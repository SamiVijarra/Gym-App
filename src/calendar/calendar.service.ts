import { BadRequestException, Injectable } from '@nestjs/common';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from 'src/users/entities/user.entity';
import { PlanDayDto } from './dto/plan-day.dto';
import { CalendarEntry, CalendarStatus, HistoryEntry } from './entities';
import { RoutinesService } from 'src/routines/routines.service';
import { GetSessionPrefillDto } from './dto/get-session-prefill.dto';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEntry)
    private readonly calendarEntryRepository: Repository<CalendarEntry>,
    @InjectRepository(HistoryEntry)
    private readonly historyEntryRepository: Repository<HistoryEntry>,
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

  async getSessionPrefill(
    getSessionPrefillDto: GetSessionPrefillDto,
    user: User,
  ) {
    const { routineDayId } = getSessionPrefillDto;
    const routineDay = await this.routinesService.findDayWithDetailsOwnedByUser(
      routineDayId,
      user,
    );

    const lastHistoryEntry = await this.historyEntryRepository.findOne({
      where: { user: { id: user.id }, routineDay: { id: routineDayId } },
      relations: { exercises: { exercise: true, sets: true } },
      order: { date: 'DESC' },
    });

    const exercises = (routineDay?.exercises ?? []).map((routineExercise) => {
      const matchingHistoryExercise = lastHistoryEntry?.exercises?.find(
        (historyExercise) =>
          historyExercise.exercise.id === routineExercise.exercise.id,
      );

      const suggestedSets = (matchingHistoryExercise?.sets ?? [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((historySet) => ({
          order: historySet.order,
          weight: historySet.weight,
          reps: historySet.reps,
          restSeconds: historySet.restSeconds,
        }));

      return {
        routineExerciseId: routineExercise.id,
        exercise: routineExercise.exercise,
        notes: routineExercise.notes,
        suggestedSets,
      };
    });

    return {
      routineDayId,
      hasHistory: !!lastHistoryEntry,
      exercises,
    };
  }
}
