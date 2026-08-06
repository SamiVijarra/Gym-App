import { IsOptional, IsString, MinLength } from 'class-validator';

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
  @IsString()
  @MinLength(3)
  equipment?: string;
}
