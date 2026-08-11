import { PartialType } from '@nestjs/mapped-types';
import { CreateRoutineDto } from './create-routine-day.dto';

export class UpdateRoutineDto extends PartialType(CreateRoutineDto) {}
