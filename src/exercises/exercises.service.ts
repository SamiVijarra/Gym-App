import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateExerciseDto, UpdateExerciseDto } from './dto';
import { ExerciseImage, Exercise } from './entities';
import { User } from 'src/users/entities/user.entity';
import { FindExercisesDto } from './dto/find.exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
    @InjectRepository(ExerciseImage)
    private readonly exerciseImageRepository: Repository<ExerciseImage>,
  ) {}

  async create(createExerciseDto: CreateExerciseDto, user: User) {
    const { images = [], ...exerciseData } = createExerciseDto;
    const exercise = this.exerciseRepository.create({
      ...exerciseData,
      createdBy: user,
      images: images.map((url) =>
        this.exerciseImageRepository.create({ url, uploadedBy: user }),
      ),
    });
    return this.exerciseRepository.save(exercise);
  }

  async update(id: string, updateExerciseDto: UpdateExerciseDto, user: User) {
    const existingExercise = await this.exerciseRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!existingExercise) throw new NotFoundException('Exercise not found');

    if (existingExercise.createdBy?.id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to edit this exercise',
      );
    }
    const { images, ...toUpdate } = updateExerciseDto;
    const exercise = await this.exerciseRepository.preload({
      id,
      ...toUpdate,
    });

    if (images) {
      await this.exerciseImageRepository.delete({ exercise: { id } });
      exercise!.images = images.map((url) =>
        this.exerciseImageRepository.create({ url, uploadedBy: user }),
      );
    }
    await this.exerciseRepository.save(exercise!);
    return this.exerciseRepository.findOne({
      where: { id },
      relations: { images: true },
    });
  }

  findAll(findExercisesDto: FindExercisesDto) {
    const { name, muscle, equipment } = findExercisesDto;
    const query = this.exerciseRepository
      .createQueryBuilder('exercise')
      .leftJoinAndSelect('exercise.images', 'images');
    if (name) {
      query.andWhere('exercise.name ILIKE :name', { name: `%${name}%` });
    }
    if (muscle) {
      query.andWhere(':muscle = ANY(exercise.primaryMuscles)', { muscle });
    }
    if (equipment) {
      query.andWhere('exercise.equipment = :equipment', { equipment });
    }
    return query.getMany();
  }

  async findOne(id: string) {
    const exercise = await this.exerciseRepository.findOne({
      where: { id },
      relations: { images: true, createdBy: true },
      select: {
        createdBy: { id: true },
      },
    });
    if (!exercise)
      throw new NotFoundException(`Exercise with id ${id} not found`);
    return exercise;
  }

  async remove(id: string, user: User) {
    const exercise = await this.exerciseRepository.findOne({
      where: { id },
      relations: { createdBy: true },
      select: {
        createdBy: { id: true },
      },
    });

    if (!exercise)
      throw new NotFoundException(`Exercise with id ${id} not found`);

    if (exercise.createdBy?.id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to delete this exercise',
      );
    }

    await this.exerciseRepository.remove(exercise);
  }
}
