import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateRoutineDayDto, UpdateRoutineDayDto } from './dto';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RoutineDay, RoutineExercise, Set } from './entities';
import { Repository } from 'typeorm';

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

  findAll() {
    return `This action returns all routines`;
  }

  findOne(id: number) {
    return `This action returns a #${id} routine`;
  }

  update(id: number, updateRoutineDayDto: UpdateRoutineDayDto) {
    return `This action updates a #${id} routine`;
  }

  remove(id: number) {
    return `This action removes a #${id} routine`;
  }

  private handleDBErrors(error: unknown): never {
    const pgError = error as PostgresError;
    if (pgError.code === '23505') {
      throw new BadRequestException(pgError.detail);
    }
    throw new InternalServerErrorException('Please check server logs');
  }
}
