import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateCalendarDto } from './dto/update-calendar.dto';
import { User } from 'src/users/entities/user.entity';
import { Between, Repository } from 'typeorm';
import { PlanDayDto } from './dto/plan-day.dto';
import { CalendarEntry, CalendarStatus } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import { RoutinesService } from 'src/routines/routines.service';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEntry)
    private readonly calendarEntryRepository: Repository<CalendarEntry>,
    private readonly routinesService: RoutinesService,
  ) {}

  findMyCalendar(user: User, year: number, month: number) {
    const { startDate, endDate } = this.getMonthRange(year, month);

    return this.calendarEntryRepository.find({
      where: {
        user: { id: user.id },
        date: Between(startDate, endDate),
      },
      relations: { routineDay: true, historyEntry: true },
      order: { date: 'ASC' },
    });
  }

  async planDay(planDayDto: PlanDayDto, user: User) {
    const { date, routineDayId } = planDayDto;

    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      throw new BadRequestException('No se puede planificar el día');
    }

    const routineDay = await this.routinesService.findDayOwnedByUser(
      routineDayId,
      user,
    );

    const calendarEntry = this.calendarEntryRepository.create({
      user,
      date,
      status: CalendarStatus.PLANNED,
      routineDay,
    });

    return this.calendarEntryRepository.save(calendarEntry);
  }

  private getMonthRange(year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return { startDate, endDate };
  }
}
