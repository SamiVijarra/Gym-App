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
  PlannedExercise,
  WeeklyGoal,
} from './entities';
import { RoutinesService } from 'src/routines/routines.service';
import {
  getMonthRange,
  getWeekStart,
  shiftIsoDate,
  todayInAppTimeZone,
} from 'src/common/utils/date.util';
import { ExercisesService } from 'src/exercises/exercises.service';
import {
  getMuscleGroup,
  getMuscleGroups,
  MUSCLE_GROUP_KEYS,
} from 'src/common/muscle-groups';
import {
  CompleteSessionDto,
  GetSessionPrefillDto,
  PlanDayDto,
  SetWeeklyGoalDto,
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
    @InjectRepository(WeeklyGoal)
    private readonly weeklyGoalRepository: Repository<WeeklyGoal>,
    @InjectRepository(PlannedExercise)
    private readonly plannedExerciseRepository: Repository<PlannedExercise>,
    private readonly routinesService: RoutinesService,
    private readonly exercisesService: ExercisesService,
  ) {}

  async findMyCalendar(user: User, year: number, month: number) {
    const { startDate, endDate } = getMonthRange(year, month);

    const entries = await this.calendarEntryRepository.find({
      where: {
        user: { id: user.id },
        date: Between(startDate, endDate),
      },
      relations: {
        routineDay: { exercises: { exercise: true } },
        historyEntry: { exercises: { exercise: true } },
        plannedExercises: { exercise: true },
      },
      order: { date: 'ASC', plannedExercises: { order: 'ASC' } },
    });

    return entries.map((entry) => this.toCalendarEntryView(entry));
  }

  private toCalendarEntryView(entry: CalendarEntry) {
    const exercises = entry.historyEntry
      ? (entry.historyEntry.exercises ?? []).map((item) => item.exercise)
      : entry.plannedExercises?.length
        ? entry.plannedExercises.map((item) => item.exercise)
        : (entry.routineDay?.exercises ?? []).map((item) => item.exercise);

    return {
      ...entry,
      routineDay: entry.routineDay
        ? omitKey(entry.routineDay, 'exercises')
        : null,
      historyEntry: entry.historyEntry
        ? omitKey(entry.historyEntry, 'exercises')
        : null,
      muscleGroups: getMuscleGroups(exercises),
    };
  }

  async planDay(planDayDto: PlanDayDto, user: User) {
    const { date, routineDayId, exerciseIds = [] } = planDayDto;

    const today = todayInAppTimeZone();
    if (date < today) {
      throw new BadRequestException('The day cannot be in the past');
    }

    if (routineDayId && exerciseIds.length > 0) {
      throw new BadRequestException(
        'Choose either a routine day or a list of exercises, not both',
      );
    }
    if (!routineDayId && exerciseIds.length === 0) {
      throw new BadRequestException(
        'Choose a routine day or at least one exercise to plan',
      );
    }

    const routineDay = routineDayId
      ? await this.routinesService.findDayOwnedByUser(routineDayId, user)
      : undefined;

    const plannedExercises = await Promise.all(
      exerciseIds.map(async (exerciseId, index) => {
        const exercise = await this.exercisesService.findOne(exerciseId);
        return this.plannedExerciseRepository.create({
          exercise,
          order: index + 1,
        });
      }),
    );

    const calendarEntry = this.calendarEntryRepository.create({
      user,
      date,
      status: CalendarStatus.PLANNED,
      routineDay,
      plannedExercises,
    });

    return this.calendarEntryRepository.save(calendarEntry);
  }

  async getPlannedEntryPrefill(id: string, user: User) {
    const entry = await this.calendarEntryRepository.findOne({
      where: { id },
      relations: {
        user: true,
        routineDay: true,
        plannedExercises: { exercise: { images: true } },
      },
      order: { plannedExercises: { order: 'ASC' } },
    });

    if (!entry) {
      throw new NotFoundException(`Calendar entry with id ${id} not found`);
    }
    if (entry.user.id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this calendar entry',
      );
    }
    if (entry.status !== CalendarStatus.PLANNED) {
      throw new BadRequestException('Only planned entries can be completed');
    }
    if (entry.routineDay) {
      throw new BadRequestException(
        'This planned session uses a routine day; use session-prefill instead',
      );
    }

    return {
      routineDayId: null,
      hasHistory: false,
      exercises: (entry.plannedExercises ?? []).map((planned) => ({
        routineExerciseId: null,
        exercise: {
          ...planned.exercise,
          images: [...(planned.exercise.images ?? [])].sort(
            (a, b) => a.id - b.id,
          ),
        },
        notes: undefined,
        suggestedSets: [],
      })),
    };
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
      order: {
        date: 'DESC',
        exercises: { order: 'ASC', sets: { order: 'ASC' } },
      },
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

    let existingCalendarEntry: CalendarEntry | null = null;
    if (calendarEntryId) {
      existingCalendarEntry = await this.calendarEntryRepository.findOne({
        where: {
          id: calendarEntryId,
          user: { id: user.id },
          status: CalendarStatus.PLANNED,
        },
      });
    } else if (routineDayId) {
      existingCalendarEntry = await this.calendarEntryRepository.findOne({
        where: {
          user: { id: user.id },
          date,
          status: CalendarStatus.PLANNED,
          routineDay: { id: routineDayId },
        },
      });
    }
    if (calendarEntryId && !existingCalendarEntry) {
      throw new NotFoundException(
        `Planned calendar entry with id ${calendarEntryId} not found`,
      );
    }
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

    if (existingCalendarEntry) {
      await this.plannedExerciseRepository.delete({
        calendarEntry: { id: existingCalendarEntry.id },
      });
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

  async getStats(user: User) {
    const [year, month] = todayInAppTimeZone().split('-').map(Number);
    const { startDate, endDate } = getMonthRange(year, month);

    const monthEntries = await this.calendarEntryRepository.find({
      where: {
        user: { id: user.id },
        status: CalendarStatus.DONE,
        date: Between(startDate, endDate),
      },
    });
    const monthSessionsCompleted = monthEntries.length;
    const monthActiveDays = new Set(monthEntries.map((e) => e.date)).size;

    const currentStreakWeeks = await this.calculateWeeklyStreak(user);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { total } = await this.historySetRepository
      .createQueryBuilder('set')
      .select('SUM(set.weight * set.reps)', 'total')
      .where('set."userId" = :userId', { userId: user.id })
      .getRawOne();

    return {
      monthSessionsCompleted,
      monthActiveDays,
      currentStreakWeeks,
      totalVolumeKg: Number(total) || 0,
    };
  }

  async getMuscleGroupStats(user: User) {
    const today = todayInAppTimeZone();
    const [year, month] = today.split('-').map(Number);
    const { startDate, endDate } = getMonthRange(year, month);

    const rows = await this.historyExerciseRepository
      .createQueryBuilder('he')
      .innerJoin('he.historyEntry', 'entry')
      .innerJoin('he.exercise', 'exercise')
      .leftJoin('he.sets', 'hs')
      .select('entry.id', 'entryId')
      .addSelect('LOWER(TRIM(("exercise"."primaryMuscles")[1]))', 'muscle')
      .addSelect('COALESCE(SUM(hs.weight * hs.reps), 0)', 'volume')
      .where('he."userId" = :userId', { userId: user.id })
      .andWhere('entry.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('entry.id')
      .addGroupBy('LOWER(TRIM(("exercise"."primaryMuscles")[1]))')
      .getRawMany<{ entryId: string; muscle: string; volume: string }>();

    const totals = new Map(
      MUSCLE_GROUP_KEYS.map((group) => [
        group,
        { sessions: new Set<string>(), volumeKg: 0 },
      ]),
    );
    for (const row of rows) {
      const group = getMuscleGroup([row.muscle]);
      if (!group) continue;
      const total = totals.get(group)!;
      total.sessions.add(row.entryId);
      total.volumeKg += Number(row.volume) || 0;
    }

    return {
      month: today.slice(0, 7),
      groups: MUSCLE_GROUP_KEYS.map((group) => {
        const total = totals.get(group)!;
        return {
          group,
          sessions: total.sessions.size,
          volumeKg: Math.round(total.volumeKg * 100) / 100,
        };
      }),
    };
  }

  async setWeeklyGoal(setWeeklyGoalDto: SetWeeklyGoalDto, user: User) {
    const weekStart = getWeekStart(setWeeklyGoalDto.weekStart);

    let goal = await this.weeklyGoalRepository.findOne({
      where: { user: { id: user.id }, weekStart },
    });

    if (goal) {
      goal.targetDays = setWeeklyGoalDto.targetDays;
    } else {
      goal = this.weeklyGoalRepository.create({
        user,
        weekStart,
        targetDays: setWeeklyGoalDto.targetDays,
      });
    }

    return this.weeklyGoalRepository.save(goal);
  }

  async getWeeklyGoal(weekStartInput: string, user: User) {
    const weekStart = getWeekStart(weekStartInput);

    const goal = await this.weeklyGoalRepository.findOne({
      where: { user: { id: user.id }, weekStart },
    });

    const doneDays = await this.countDoneDaysInWeek(user, weekStart);

    return {
      weekStart,
      targetDays: goal?.targetDays ?? null,
      doneDays,
    };
  }

  private async calculateWeeklyStreak(user: User): Promise<number> {
    const currentWeekStart = getWeekStart(todayInAppTimeZone());
    let streak = 0;
    let cursor = currentWeekStart;
    let isCurrentWeek = true;

    while (streak < 104) {
      const goal = await this.weeklyGoalRepository.findOne({
        where: { user: { id: user.id }, weekStart: cursor },
      });

      if (!goal) {
        if (isCurrentWeek) {
          cursor = shiftIsoDate(cursor, -7);
          isCurrentWeek = false;
          continue;
        }
        break;
      }

      const doneDays = await this.countDoneDaysInWeek(user, cursor);

      if (isCurrentWeek && doneDays < goal.targetDays) {
        cursor = shiftIsoDate(cursor, -7);
        isCurrentWeek = false;
        continue;
      }

      if (doneDays >= goal.targetDays) {
        streak++;
        cursor = shiftIsoDate(cursor, -7);
        isCurrentWeek = false;
      } else {
        break;
      }
    }

    return streak;
  }

  private async countDoneDaysInWeek(
    user: User,
    weekStart: string,
  ): Promise<number> {
    const weekEnd = shiftIsoDate(weekStart, 6);
    const entries = await this.calendarEntryRepository.find({
      where: {
        user: { id: user.id },
        status: CalendarStatus.DONE,
        date: Between(weekStart, weekEnd),
      },
    });
    return new Set(entries.map((e) => e.date)).size;
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

function omitKey<T extends object, K extends keyof T>(
  value: T,
  key: K,
): Omit<T, K> {
  const copy = { ...value };
  delete (copy as Partial<T>)[key];
  return copy;
}
