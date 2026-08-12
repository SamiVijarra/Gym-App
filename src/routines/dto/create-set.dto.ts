import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSetDto {
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
