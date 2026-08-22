import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { ExercisesModule } from 'src/exercises/exercises.module';
import { RoutinesModule } from 'src/routines/routines.module';

import {
  CalendarEntry,
  HistoryEntry,
  HistoryExercise,
  HistorySet,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CalendarEntry,
      HistoryEntry,
      HistoryExercise,
      HistorySet,
    ]),
    RoutinesModule,
    ExercisesModule,
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
