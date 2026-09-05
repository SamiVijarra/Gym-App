import { Module } from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { RoutinesController } from './routines.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutineDay, RoutineExercise, Set } from './entities';
import { ExercisesModule } from 'src/exercises/exercises.module';
import { CalendarEntry } from 'src/calendar/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoutineDay, RoutineExercise, Set, CalendarEntry]),
    ExercisesModule,
  ],
  controllers: [RoutinesController],
  providers: [RoutinesService],
  exports: [RoutinesService],
})
export class RoutinesModule {}
