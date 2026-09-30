import { IsDateString } from 'class-validator';

export class GetWeeklyGoalDto {
  @IsDateString()
  weekStart!: string;
}
