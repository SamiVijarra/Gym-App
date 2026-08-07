import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { ExercisesModule } from 'src/exercises/exercises.module';

@Module({
  providers: [SeedService],
  exports: [ExercisesModule],
})
export class SeedModule {}
