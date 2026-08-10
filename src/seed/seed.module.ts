import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { ExercisesModule } from 'src/exercises/exercises.module';

@Module({
  imports: [ExercisesModule],
  providers: [SeedService],
})
export class SeedModule {}
