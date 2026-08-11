import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateRoutineDayDto, UpdateRoutineDayDto } from './dto';
import { User } from 'src/users/entities/user.entity';
import { RoutineDay, RoutineExercise, Set } from './entities';

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
    return `This action returns all routines`;
  }

  updateDay(id: number, updateRoutineDayDto: UpdateRoutineDayDto) {
    return `This action updates a #${id} routine`;
  }

  removeDay(id: number) {
    return `This action removes a #${id} routine`;
  }

  addExerciseToDay(
    dayId: string,
    createRoutineDatDto: CreateRoutineDayDto,
    user: User,
  ) {
    return `This action returns a #${dayId} routine`;
  }

  removeExerciseFromDay(id: number, user: User) {
    return;
  }

  addSet(
    routineExerciseId: RoutineExercise,
    createRoutineDatDto: CreateRoutineDayDto,
    user: User,
  ) {}

  updateSet(
    routineExerciseId: RoutineExercise,
    createRoutineDatDto: CreateRoutineDayDto,
    user: User,
  ) {}

  removeSet(routineExerciseId: RoutineExercise, user: User) {}

  private handleDBErrors(error: unknown): never {
    const pgError = error as PostgresError;
    if (pgError.code === '23505') {
      throw new BadRequestException(pgError.detail);
    }
    throw new InternalServerErrorException('Please check server logs');
  }
}
