import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Exercise } from 'src/exercises/entities';
import { CalendarEntry } from './calendar-entry.entity';

@Entity('planned_exercises')
export class PlannedExercise {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => CalendarEntry, (entry) => entry.plannedExercises, {
    onDelete: 'CASCADE',
  })
  calendarEntry!: CalendarEntry;

  @ManyToOne(() => Exercise, { onDelete: 'CASCADE' })
  exercise!: Exercise;

  @Column('int')
  order!: number;
}
