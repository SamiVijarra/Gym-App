import { IsOptional, IsString } from 'class-validator';

export class UpdateHistoryNotesDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
