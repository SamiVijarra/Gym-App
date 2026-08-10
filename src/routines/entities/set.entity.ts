import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RoutineExercise } from './routine-exercise.entity';

@Entity('sets')
export class Set {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => RoutineExercise, (routineExercise) => routineExercise.sets, {
    onDelete: 'CASCADE',
  })
  routineExercise!: RoutineExercise;

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
