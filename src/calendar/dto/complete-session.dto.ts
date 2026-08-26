import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CompleteSessionSetDto {
  @IsNumber()
  weight!: number;

  @IsInt()
  reps!: number;

  @IsOptional()
  @IsInt()
  restSeconds?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteSessionExerciseDto {
  @IsUUID()
  exerciseId!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompleteSessionSetDto)
  sets!: CompleteSessionSetDto[];
}

export class CompleteSessionDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsUUID()
  routineDayId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompleteSessionExerciseDto)
  exercises!: CompleteSessionExerciseDto[];
}
