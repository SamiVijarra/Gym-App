import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { MUSCLE_GROUP_KEYS, type MuscleGroup } from 'src/common/muscle-groups';

export class FindExercisesDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  muscle?: string;

  @IsOptional()
  @IsIn(MUSCLE_GROUP_KEYS)
  muscleGroup?: MuscleGroup;

  @IsOptional()
  @IsString()
  @MinLength(3)
  equipment?: string;
}
