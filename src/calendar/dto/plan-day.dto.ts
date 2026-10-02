import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class PlanDayDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsUUID()
  routineDayId?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(30)
  @IsUUID('all', { each: true })
  exerciseIds?: string[];
}
