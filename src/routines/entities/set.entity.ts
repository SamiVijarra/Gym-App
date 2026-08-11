import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RoutineExercise } from './routine-exercise.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('sets')
export class Set {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => RoutineExercise, (routineExercise) => routineExercise.sets, {
    onDelete: 'CASCADE',
  })
  routineExercise!: RoutineExercise;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

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
}
