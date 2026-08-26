import { IsDateString, IsUUID } from 'class-validator';

export class GetSessionPrefillDto {
  @IsDateString()
  date!: string;

  @IsUUID()
  routineDayId!: string;
}
