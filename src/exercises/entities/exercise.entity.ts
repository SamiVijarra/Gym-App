import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExerciseImage } from './exercise-image.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text', {
    unique: true,
  })
  name!: string;

  @Column('text', {
    array: true,
  })
  primaryMuscles!: string[];

  @Column('text', {
    nullable: true,
  })
  equipment?: string;

  @Column('text', {
    array: true,
    default: [],
  })
  instructions!: string[];

  @Column('text', {
    nullable: true,
    unique: true,
  })
  sourceId?: string;

  @OneToMany(() => ExerciseImage, (exerciseImage) => exerciseImage.exercise, {
    cascade: true,
  })
  images?: ExerciseImage[];

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  createdBy?: User;
}
