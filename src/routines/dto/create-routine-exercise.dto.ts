import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRoutineExerciseDto {
  @IsUUID()
  exerciseId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
