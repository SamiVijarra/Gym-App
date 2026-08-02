import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text', { unique: true })
  email!: string;

  @Column('text', { select: false })
  password!: string;

  @Column('text')
  name!: string;

  @Column('date', { nullable: true })
  birthDate?: Date;

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  weight?: number;

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  height?: number;

  @CreateDateColumn()
  createdAt!: Date;
}
