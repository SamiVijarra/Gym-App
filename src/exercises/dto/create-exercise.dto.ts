import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateExerciseDto {
  @IsString()
  @MinLength(4)
  name!: string;

  @IsArray()
  @IsString({ each: true })
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
