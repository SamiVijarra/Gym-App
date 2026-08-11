import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateRoutineDayDto {
  @IsInt()
  @Min(1)
  dayNumber!: number;

  @IsString()
  @MinLength(3)
  description!: string;
}
