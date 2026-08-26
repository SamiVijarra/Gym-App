import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  CreateRoutineDayDto,
  CreateRoutineExerciseDto,
  CreateSetDto,
  UpdateRoutineDayDto,
  UpdateSetDto,
} from './dto';
import { User } from 'src/users/entities/user.entity';
import { RoutineDay, RoutineExercise, Set } from './entities';
import { ExercisesService } from 'src/exercises/exercises.service';
import { UpdateRoutineExerciseDto } from './dto/update-routine-exercise.dto';

interface PostgresError {
  code: string;
  detail: string;
}

@Injectable()
export class RoutinesService {
  constructor(
    @InjectRepository(RoutineDay)
    private readonly routineDayRepository: Repository<RoutineDay>,
    @InjectRepository(RoutineExercise)
    private readonly routineExerciseRepository: Repository<RoutineExercise>,
    @InjectRepository(Set)
    private readonly setRepository: Repository<Set>,
    private readonly exercisesService: ExercisesService,
  ) {}
  async createDay(createRoutineDayDto: CreateRoutineDayDto, user: User) {
    try {
      const routineDay = this.routineDayRepository.create({
        ...createRoutineDayDto,
        user,
      });
      return await this.routineDayRepository.save(routineDay);
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  findMyRoutine(user: User) {
    return this.routineDayRepository.find({
      where: { user: { id: user.id } },
      relations: { exercises: { exercise: true, sets: true } },
      order: { dayNumber: 'ASC' },
    });
  }

  async updateDay(
    id: string,
    updateRoutineDayDto: UpdateRoutineDayDto,
    user: User,
  ) {
    await this.findDayAndVerifyOwner(id, user);
    const updated = await this.routineDayRepository.preload({
      id,
      ...updateRoutineDayDto,
    });
    return this.routineDayRepository.save(updated!);
  }

  async removeDay(id: string, user: User) {
    const day = await this.findDayAndVerifyOwner(id, user);
    return this.routineDayRepository.remove(day);
  }

  private async findDayAndVerifyOwner(id: string, user: User) {
    const day = await this.routineDayRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!day)
      throw new NotFoundException(`Routine day with id ${id} not found`);
    if (day.user.id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this day',
      );
    }
    return day;
  }

  async addExerciseToDay(
    dayId: string,
    createRoutineExerciseDto: CreateRoutineExerciseDto,
    user: User,
  ) {
    const day = await this.findDayAndVerifyOwner(dayId, user);
    const exercise = await this.exercisesService.findOne(
      createRoutineExerciseDto.exerciseId,
    );
    const existingCount = await this.routineExerciseRepository.count({
      where: { routineDay: { id: dayId } },
    });
    const routineExercise = this.routineExerciseRepository.create({
      routineDay: day,
      exercise,
      user,
      notes: createRoutineExerciseDto.notes,
      order: existingCount + 1,
    });
    return this.routineExerciseRepository.save(routineExercise);
  }

  async updateExerciseInDay(
    id: string,
    updateRoutineExerciseDto: UpdateRoutineExerciseDto,
    user: User,
  ) {
    await this.findRoutineExerciseAndVerifyOwner(id, user);
    const updated = await this.routineExerciseRepository.preload({
      id,
      ...updateRoutineExerciseDto,
    });
    return this.routineExerciseRepository.save(updated!);
  }

  async removeExerciseFromDay(id: string, user: User) {
    const routineExercise = await this.findRoutineExerciseAndVerifyOwner(
      id,
      user,
    );
    return this.routineExerciseRepository.remove(routineExercise);
  }

  private async findRoutineExerciseAndVerifyOwner(id: string, user: User) {
    const routineExercise = await this.routineExerciseRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!routineExercise) {
      throw new NotFoundException(`Routine exercise with id ${id} not found`);
    }
    if (routineExercise.user.id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this exercise',
      );
    }
    return routineExercise;
  }

  async addSet(
    routineExerciseId: string,
    createSetDto: CreateSetDto,
    user: User,
  ) {
    const routineExercise = await this.findRoutineExerciseAndVerifyOwner(
      routineExerciseId,
      user,
    );
    const existingCount = await this.setRepository.count({
      where: { routineExercise: { id: routineExerciseId } },
    });
    const set = this.setRepository.create({
      ...createSetDto,
      routineExercise,
      user,
      order: existingCount + 1,
    });
    return this.setRepository.save(set);
  }

  async updateSet(id: string, updateSetDto: UpdateSetDto, user: User) {
    await this.findSetAndVerifyOwner(id, user);
    const updated = await this.setRepository.preload({ id, ...updateSetDto });
    return this.setRepository.save(updated!);
  }

  async removeSet(id: string, user: User) {
    const set = await this.findSetAndVerifyOwner(id, user);
    return this.setRepository.remove(set);
  }

  private async findSetAndVerifyOwner(id: string, user: User) {
    const set = await this.setRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!set) {
      throw new NotFoundException(`Set with id ${id} not found`);
    }
    if (set.user.id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this set',
      );
    }
    return set;
  }

  private handleDBErrors(error: unknown): never {
    const pgError = error as PostgresError;
    if (pgError.code === '23505') {
      throw new BadRequestException(pgError.detail);
    }
    throw new InternalServerErrorException('Please check server logs');
  }

  findDayOwnedByUser(id: string, user: User) {
    return this.findDayAndVerifyOwner(id, user);
  }
}
