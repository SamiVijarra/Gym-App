import { IsOptional, IsString } from 'class-validator';

export class UpdateRoutineExerciseDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
