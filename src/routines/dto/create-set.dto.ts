import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSetDto {
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
