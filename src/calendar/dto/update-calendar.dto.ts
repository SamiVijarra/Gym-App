import { PartialType } from '@nestjs/mapped-types';
import { CreateCalendarDto } from './plan-day.dto';

export class UpdateCalendarDto extends PartialType(CreateCalendarDto) {}
