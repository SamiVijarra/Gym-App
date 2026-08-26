import { IsDateString, IsUUID } from 'class-validator';

export class PlanDayDto {
  @IsDateString()
  date!: string;

  @IsUUID()
  routineDayId!: string;
}
