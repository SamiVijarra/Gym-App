import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { RoutineExercise } from './routine-exercise.entity';

@Entity('routine_days')
@Unique(['user', 'dayNumber'])
export class RoutineDay {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Column('int')
  dayNumber!: number;

  @Column('text')
  description!: string;

  @OneToMany(
    () => RoutineExercise,
    (routineExercise) => routineExercise.routineDay,
    {
      cascade: true,
    },
  )
  exercises?: RoutineExercise[];
}
