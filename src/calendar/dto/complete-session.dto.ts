import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CompleteSessionSetDto {
  @IsNumber()
  @Min(0)
  weight!: number;

  @IsInt()
  @Min(1)
  reps!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
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
  @ArrayNotEmpty()
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

  @IsOptional()
  @IsUUID()
  calendarEntryId?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CompleteSessionExerciseDto)
  exercises!: CompleteSessionExerciseDto[];
}
