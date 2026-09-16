import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from 'src/users/entities/user.entity';
import {
  CalendarEntry,
  CalendarStatus,
  HistoryEntry,
  HistoryExercise,
  HistorySet,
} from './entities';
import { RoutinesService } from 'src/routines/routines.service';
import { ExercisesService } from 'src/exercises/exercises.service';
import {
  CompleteSessionDto,
  GetSessionPrefillDto,
  PlanDayDto,
  UpdateHistoryNotesDto,
} from './dto';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEntry)
    private readonly calendarEntryRepository: Repository<CalendarEntry>,
    @InjectRepository(HistoryEntry)
    private readonly historyEntryRepository: Repository<HistoryEntry>,
    @InjectRepository(HistoryExercise)
    private readonly historyExerciseRepository: Repository<HistoryExercise>,
    @InjectRepository(HistorySet)
    private readonly historySetRepository: Repository<HistorySet>,
    private readonly routinesService: RoutinesService,
    private readonly exercisesService: ExercisesService,
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
      throw new BadRequestException('The day cannot be in the past');
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
      relations: { exercises: { exercise: { images: true }, sets: true } },
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

  async completeSession(completeSessionDto: CompleteSessionDto, user: User) {
    const { date, routineDayId, calendarEntryId, exercises } =
      completeSessionDto;

    const routineDay = routineDayId
      ? await this.routinesService.findDayOwnedByUser(routineDayId, user)
      : undefined;

    const historyExercises = await Promise.all(
      exercises.map(async (exerciseDto, exerciseIndex) => {
        const exercise = await this.exercisesService.findOne(
          exerciseDto.exerciseId,
        );

        return this.historyExerciseRepository.create({
          exercise,
          user,
          order: exerciseIndex + 1,
          notes: exerciseDto.notes,
          sets: exerciseDto.sets.map((setDto, setIndex) =>
            this.historySetRepository.create({
              user,
              order: setIndex + 1,
              weight: setDto.weight,
              reps: setDto.reps,
              restSeconds: setDto.restSeconds,
              notes: setDto.notes,
            }),
          ),
        });
      }),
    );

    const historyEntry = this.historyEntryRepository.create({
      user,
      date,
      routineDay,
      exercises: historyExercises,
    });

    const savedHistoryEntry =
      await this.historyEntryRepository.save(historyEntry);

    if (routineDayId) {
      await this.syncRoutineTemplate(
        routineDayId,
        savedHistoryEntry.exercises ?? [],
        user,
      );
    }

    const existingCalendarEntry = calendarEntryId
      ? await this.calendarEntryRepository.findOne({
          where: {
            id: calendarEntryId,
            user: { id: user.id },
            status: CalendarStatus.PLANNED,
          },
        })
      : await this.calendarEntryRepository.findOne({
          where: {
            user: { id: user.id },
            date,
            status: CalendarStatus.PLANNED,
            ...(routineDayId ? { routineDay: { id: routineDayId } } : {}),
          },
        });
    if (calendarEntryId && !existingCalendarEntry) {
      throw new NotFoundException(
        `Planned calendar entry with id ${calendarEntryId} not found`,
      );
    }
    if (existingCalendarEntry) {
      existingCalendarEntry.status = CalendarStatus.DONE;
      existingCalendarEntry.historyEntry = savedHistoryEntry;
      return this.calendarEntryRepository.save(existingCalendarEntry);
    }

    const newCalendarEntry = this.calendarEntryRepository.create({
      user,
      date,
      status: CalendarStatus.DONE,
      routineDay,
      historyEntry: savedHistoryEntry,
    });

    return this.calendarEntryRepository.save(newCalendarEntry);
  }

  async cancelPlannedDay(id: string, user: User) {
    const calendarEntry = await this.calendarEntryRepository.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!calendarEntry) {
      throw new NotFoundException(`Calendar entry with id ${id} not found`);
    }
    if (calendarEntry.user.id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this calendar entry',
      );
    }
    if (calendarEntry.status !== CalendarStatus.PLANNED) {
      throw new BadRequestException('Only planned entries can be canceled');
    }

    await this.calendarEntryRepository.remove(calendarEntry);
    return { id };
  }

  async getStatus(user: User) {
    const now = new Date();
    const { startDate, endDate } = this.getMonthRange(
      now.getFullYear(),
      now.getMonth() + 1,
    );

    const monthEntries = await this.calendarEntryRepository.find({
      where: {
        user: { id: user.id },
        status: CalendarStatus.DONE,
        date: Between(startDate, endDate),
      },
    });

    const monthSessionsCompleted = monthEntries.length;
    const monthActiveDays = new Set(monthEntries.map((e) => e.date)).size;

    const allDoneEntries = await this.calendarEntryRepository.find({
      where: {
        user: { id: user.id },
        status: CalendarStatus.DONE,
      },
    });

    const doneDates = [...new Set(allDoneEntries.map((e) => e.date))].sort(
      (a, b) => (a < b ? 1 : -1),
    );

    let currentStreakDays = 0;
    if (doneDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mostRecent = new Date(doneDates[0]);
      const daysSinceMostRecent = Math.floor(
        (today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceMostRecent <= 1) {
        currentStreakDays = 1;
        for (let i = 1; i < doneDates.length; i++) {
          const prev = new Date(doneDates[i - 1]);
          const curr = new Date(doneDates[i]);
          const diffDays = Math.round(
            (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24),
          );
          if (diffDays === 1) {
            currentStreakDays++;
          } else {
            break;
          }
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { total } = await this.historySetRepository
      .createQueryBuilder('set')
      .select('SUM(set.weight * set.reps)', 'total')
      .where('set."userId" = :userId', { userId: user.id })
      .getRawOne();

    return {
      monthSessionsCompleted,
      monthActiveDays,
      currentStreakDays,
      totalVolumeKg: Number(total) || 0,
    };
  }

  private getMonthRange(year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return { startDate, endDate };
  }

  async findExerciseHistory(exerciseId: string, user: User) {
    const historyExercises = await this.historyExerciseRepository.find({
      where: {
        exercise: { id: exerciseId },
        user: { id: user.id },
      },
      relations: { historyEntry: true, sets: true },
      order: {
        historyEntry: { date: 'ASC' },
        sets: { order: 'ASC' },
      },
    });

    return historyExercises.map((historyExercise) => ({
      historyExerciseId: historyExercise.id,
      date: historyExercise.historyEntry.date,
      notes: historyExercise.notes,
      sets: (historyExercise.sets ?? []).map((set) => ({
        order: set.order,
        weight: set.weight,
        reps: set.reps,
        restSeconds: set.restSeconds,
      })),
    }));
  }

  async updateHistoryExerciseNotes(
    id: string,
    updateHistoryNotesDto: UpdateHistoryNotesDto,
    user: User,
  ) {
    await this.findHistoryExerciseAndVerifyOwner(id, user);
    const updated = await this.historyExerciseRepository.preload({
      id,
      notes: updateHistoryNotesDto.notes,
    });
    return this.historyExerciseRepository.save(updated!);
  }

  async updateHistorySetNotes(
    id: string,
    updateHistoryNotesDto: UpdateHistoryNotesDto,
    user: User,
  ) {
    await this.findHistorySetAndVerifyOwner(id, user);
    const updated = await this.historySetRepository.preload({
      id,
      notes: updateHistoryNotesDto.notes,
    });
    return this.historySetRepository.save(updated!);
  }

  async findHistoryEntryOwnedByUser(id: string, user: User) {
    const historyEntry = await this.historyEntryRepository.findOne({
      where: { id },
      relations: {
        user: true,
        routineDay: true,
        exercises: { exercise: { images: true }, sets: true },
      },
      order: {
        exercises: { order: 'ASC', sets: { order: 'ASC' } },
      },
    });

    if (!historyEntry) {
      throw new NotFoundException(`History entry with id ${id} not found`);
    }
    if (historyEntry.user.id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this history entry',
      );
    }

    return historyEntry;
  }

  private async findHistoryExerciseAndVerifyOwner(id: string, user: User) {
    const historyExercise = await this.historyExerciseRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!historyExercise) {
      throw new NotFoundException(`History exercise with id ${id} not found`);
    }
    if (historyExercise.user.id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this history exercise',
      );
    }
    return historyExercise;
  }

  private async findHistorySetAndVerifyOwner(id: string, user: User) {
    const historySet = await this.historySetRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!historySet) {
      throw new NotFoundException(`History set with id ${id} not found`);
    }
    if (historySet.user.id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this history set',
      );
    }
    return historySet;
  }

  private async syncRoutineTemplate(
    routineDayId: string,
    historyExercises: HistoryExercise[],
    user: User,
  ) {
    const routineDay = await this.routinesService.findDayWithDetailsOwnedByUser(
      routineDayId,
      user,
    );
    if (!routineDay?.exercises) return;

    for (const historyExercise of historyExercises) {
      const routineExercise = routineDay.exercises.find(
        (re) => re.exercise.id === historyExercise.exercise.id,
      );
      if (!routineExercise) continue;

      for (const historySet of historyExercise.sets ?? []) {
        const routineSet = (routineExercise.sets ?? []).find(
          (s) => s.order === historySet.order,
        );

        const values = {
          weight: historySet.weight,
          reps: historySet.reps,
          restSeconds: historySet.restSeconds,
        };

        if (routineSet) {
          await this.routinesService.updateSet(routineSet.id, values, user);
        } else {
          await this.routinesService.addSet(routineExercise.id, values, user);
        }
      }
    }
  }
}
