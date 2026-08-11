import { PartialType } from '@nestjs/mapped-types';
import { CreateRoutineDayDto } from './create-routine-day.dto';

export class UpdateRoutineDayDto extends PartialType(CreateRoutineDayDto) {}
