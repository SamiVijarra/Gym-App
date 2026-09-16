import { IsDateString, IsInt, Max, Min } from 'class-validator';

export class SetWeeklyGoalDto {
  @IsDateString()
  weekStart!: string;

  @IsInt()
  @Min(1)
  @Max(7)
  targetDays!: number;
}
