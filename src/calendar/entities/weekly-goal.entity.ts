import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity('weekly_goals')
@Unique(['user', 'weekStart'])
export class WeeklyGoal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Column('date')
  weekStart!: string;

  @Column('int')
  targetDays!: number;
}
