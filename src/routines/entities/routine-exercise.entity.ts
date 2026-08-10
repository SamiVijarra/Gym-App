import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Exercise } from 'src/exercises/entities';
import { RoutineDay } from './routine-day.entity';
import { Set } from './set.entity';

@Entity('routine_exercises')
export class RoutineExercise {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => RoutineDay, (routineDay) => routineDay.exercises, {
    onDelete: 'CASCADE',
  })
  routineDay!: RoutineDay;

  @ManyToOne(() => Exercise, { onDelete: 'RESTRICT' })
  exercise!: Exercise;

  @Column('int')
  order!: number;

  @Column('text', { nullable: true })
  notes?: string;

  @OneToMany(() => Set, (set) => set.routineExercise, {
    cascade: true,
  })
  sets?: Set[];
}
