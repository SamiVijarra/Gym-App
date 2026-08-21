import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { HistoryEntry } from './history-entry.entity';
import { User } from 'src/users/entities/user.entity';
import { Exercise } from 'src/exercises/entities';

@Entity('history_exercises')
export class HistoryExercise {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => HistoryEntry, (historyEntry) => historyEntry.exercises, {
    onDelete: 'CASCADE',
  })
  historyEntry!: HistoryEntry;

  @ManyToOne(() => Exercise, { onDelete: 'RESTRICT' })
  exercise!: Exercise;

  @Column('int')
  order!: number;

  @Column('text', { nullable: true })
  notes?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @OneToMany(() => HistorySet, (historySet) => historySet.historyExercise, {
    cascade: true,
  })
  sets?: HistorySet[];
}
