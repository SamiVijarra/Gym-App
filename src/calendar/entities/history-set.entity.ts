import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { HistoryExercise } from './history-exercise.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('history_sets')
export class HistorySet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => HistoryExercise, (historyExercise) => historyExercise.sets, {
    onDelete: 'CASCADE',
  })
  historyExercise!: HistoryExercise;

  @Column('int')
  order!: number;

  @Column('numeric', { precision: 10, scale: 2 })
  weight!: number;

  @Column('int')
  reps!: number;

  @Column('int', { nullable: true })
  restSeconds?: number;

  @Column('text', { nullable: true })
  notes?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;
}
