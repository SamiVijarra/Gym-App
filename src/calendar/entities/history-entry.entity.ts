import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RoutineDay } from 'src/routines/entities';
import { User } from 'src/users/entities/user.entity';
import { HistoryExercise } from './history-exercise.entity';

@Entity('history_entries')
export class HistoryEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Column('date')
  date!: string;

  @ManyToOne(() => RoutineDay, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  routineDay?: RoutineDay;

  @OneToMany(
    () => HistoryExercise,
    (historyExercise) => historyExercise.historyEntry,
    {
      cascade: true,
    },
  )
  exercises?: HistoryExercise[];
}
