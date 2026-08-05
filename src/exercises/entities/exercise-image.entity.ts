import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Exercise } from './exercise.entity';
import { User } from 'src/users/entities/user.entity';

@Entity({ name: 'exercise_images' })
export class ExerciseImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  url!: string;

  @ManyToOne(() => Exercise, (exercise) => exercise.images, {
    onDelete: 'CASCADE',
  })
  exercise!: Exercise;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  uploadedBy?: User;
}
