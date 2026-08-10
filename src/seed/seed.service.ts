import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as fs from 'fs';
import * as path from 'path';

import { Exercise, ExerciseImage } from 'src/exercises/entities';

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

  async seedExercises() {
    const filePath = path.join(__dirname, 'data', 'exercises-data.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const exercises = JSON.parse(rawData) as RawExercise[];

    let inserted = 0;
    let skipped = 0;

    for (const item of exercises) {
      const exists = await this.exerciseRepository.findOne({
        where: { sourceId: item.id },
      });
      if (exists) {
        skipped++;
        continue;
      }
      const exerciseData = this.transformExercise(item);
      const exercise = this.exerciseRepository.create(exerciseData);
      await this.exerciseRepository.save(exercise);
      inserted++;
    }
    console.log(
      `Seed completo: ${inserted} insertados, ${skipped} ya existían.`,
    );
  }

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
