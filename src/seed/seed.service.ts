import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Exercise, ExerciseImage } from 'src/exercises/entities';
import { Repository } from 'typeorm';

interface RawExercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  equipment: string | null;
  instructions: string[];
  images: string[];
}
@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
    @InjectRepository(ExerciseImage)
    private readonly exerciseImageRepository: Repository<ExerciseImage>,
  ) {}

  async seedExercises() {}

  private transformExercise(item: RawExercise) {
    return {
      name: item.name,
      primaryMuscles: item.primaryMuscles,
      equipment: item.equipment ?? undefined,
      instructions: item.instructions,
      sourceId: item.id,
      images: item.images.map((path) =>
        this.exerciseImageRepository.create({
          url: `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${path}`,
        }),
      ),
    };
  }
}
