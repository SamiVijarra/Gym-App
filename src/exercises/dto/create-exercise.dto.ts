import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { EXERCISE_MUSCLES } from 'src/common/muscle-groups';

export class CreateExerciseDto {
  @IsString()
  @MinLength(4)
  name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(EXERCISE_MUSCLES, {
    each: true,
    message: `each value in primaryMuscles must be one of: ${EXERCISE_MUSCLES.join(', ')}`,
  })
  primaryMuscles!: string[];

  @IsString()
  @IsOptional()
  equipment?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  instructions?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
