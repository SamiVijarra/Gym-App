import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { RoutineDay } from 'src/routines/entities';
import { User } from 'src/users/entities/user.entity';
import { HistoryEntry } from './history-entry.entity';

export enum CalendarStatus {
  EMPTY = 'empty',
  PLANNED = 'planned',
  DONE = 'done',
}

@Entity('calendar_entries')
export class CalendarEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Column('date')
  date!: string;

  @Column({
    type: 'enum',
    enum: CalendarStatus,
    default: CalendarStatus.EMPTY,
  })
  status!: CalendarStatus;

  @ManyToOne(() => RoutineDay, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  routineDay?: RoutineDay;

  @ManyToOne(() => HistoryEntry, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  historyEntry?: HistoryEntry;
}
