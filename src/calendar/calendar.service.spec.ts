import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FindOperator } from 'typeorm';

import { CalendarService } from './calendar.service';
import {
  CalendarEntry,
  HistoryEntry,
  HistoryExercise,
  HistorySet,
  PlannedExercise,
  WeeklyGoal,
} from './entities';
import { RoutinesService } from 'src/routines/routines.service';
import { ExercisesService } from 'src/exercises/exercises.service';
import { User } from 'src/users/entities/user.entity';

const user = { id: 'user-1' } as User;

type EntryRow = { date: string; status: string };

function buildService() {
  const goals = new Map<string, number>();
  const doneEntries: EntryRow[] = [];

  const calendarEntryRepository = {
    find: jest.fn(({ where }: { where: { date: FindOperator<string> } }) => {
      const [from, to] = where.date.value as unknown as [string, string];
      return Promise.resolve(
        doneEntries.filter((entry) => entry.date >= from && entry.date <= to),
      );
    }),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((value: object) => value),
    save: jest.fn((value: object) => Promise.resolve(value)),
  };

  const weeklyGoalRepository = {
    findOne: jest.fn(({ where }: { where: { weekStart: string } }) =>
      Promise.resolve(
        goals.has(where.weekStart)
          ? {
              weekStart: where.weekStart,
              targetDays: goals.get(where.weekStart),
            }
          : null,
      ),
    ),
  };

  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ total: 0 }),
  };

  const historyEntryRepository = {
    create: jest.fn((value: object) => value),
    save: jest.fn((value: object) => Promise.resolve(value)),
  };
  const muscleRows: { entryId: string; muscle: string; volume: string }[] = [];
  const muscleQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(() => Promise.resolve(muscleRows)),
  };
  const historyExerciseRepository = {
    create: jest.fn((value: object) => value),
    createQueryBuilder: jest.fn(() => muscleQueryBuilder),
  };
  const historySetRepository = {
    create: jest.fn((value: object) => value),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const plannedExerciseRepository = {
    create: jest.fn((value: object) => value),
  };

  const routinesService = {
    findDayOwnedByUser: jest.fn().mockResolvedValue({ id: 'day-1' }),
    findDayWithDetailsOwnedByUser: jest.fn(),
    updateSet: jest.fn().mockResolvedValue(undefined),
    addSet: jest.fn().mockResolvedValue(undefined),
  };
  const exercisesService = {
    findOne: jest.fn((id: string) => Promise.resolve({ id })),
  };

  return {
    goals,
    doneEntries,
    muscleRows,
    muscleQueryBuilder,
    calendarEntryRepository,
    historyEntryRepository,
    routinesService,
    exercisesService,
    async create() {
      const moduleRef = await Test.createTestingModule({
        providers: [
          CalendarService,
          {
            provide: getRepositoryToken(CalendarEntry),
            useValue: calendarEntryRepository,
          },
          {
            provide: getRepositoryToken(HistoryEntry),
            useValue: historyEntryRepository,
          },
          {
            provide: getRepositoryToken(HistoryExercise),
            useValue: historyExerciseRepository,
          },
          {
            provide: getRepositoryToken(HistorySet),
            useValue: historySetRepository,
          },
          {
            provide: getRepositoryToken(WeeklyGoal),
            useValue: weeklyGoalRepository,
          },
          {
            provide: getRepositoryToken(PlannedExercise),
            useValue: plannedExerciseRepository,
          },
          { provide: RoutinesService, useValue: routinesService },
          { provide: ExercisesService, useValue: exercisesService },
        ],
      }).compile();
      return moduleRef.get(CalendarService);
    },
  };
}

describe('CalendarService', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-10-03T15:00:00Z') });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('weekly streak (via getStats)', () => {
    const done = (ctx: ReturnType<typeof buildService>, ...dates: string[]) =>
      dates.forEach((date) => ctx.doneEntries.push({ date, status: 'done' }));

    it('counts consecutive weeks in which the weekly goal was met', async () => {
      const ctx = buildService();
      ctx.goals.set('2026-09-28', 2).set('2026-09-21', 2).set('2026-09-14', 2);
      done(
        ctx,
        '2026-09-29',
        '2026-10-01',
        '2026-09-22',
        '2026-09-24',
        '2026-09-15',
        '2026-09-17',
      );

      const service = await ctx.create();
      expect((await service.getStats(user)).currentStreakWeeks).toBe(3);
    });

    it('does not break the streak while the current week is still in progress', async () => {
      const ctx = buildService();
      ctx.goals.set('2026-09-28', 3).set('2026-09-21', 2).set('2026-09-14', 2);
      done(
        ctx,
        '2026-09-29',
        '2026-09-22',
        '2026-09-24',
        '2026-09-15',
        '2026-09-17',
      );

      const service = await ctx.create();
      expect((await service.getStats(user)).currentStreakWeeks).toBe(2);
    });

    it('stops at the first past week that missed its goal', async () => {
      const ctx = buildService();
      ctx.goals.set('2026-09-28', 1).set('2026-09-21', 3).set('2026-09-14', 1);
      done(ctx, '2026-09-29', '2026-09-22', '2026-09-15');

      const service = await ctx.create();
      expect((await service.getStats(user)).currentStreakWeeks).toBe(1);
    });

    it('stops at a past week that has no goal set', async () => {
      const ctx = buildService();
      ctx.goals.set('2026-09-28', 1).set('2026-09-14', 1);
      done(ctx, '2026-09-29', '2026-09-15');

      const service = await ctx.create();
      expect((await service.getStats(user)).currentStreakWeeks).toBe(1);
    });

    it('skips the current week when it has no goal yet', async () => {
      const ctx = buildService();
      ctx.goals.set('2026-09-21', 1);
      done(ctx, '2026-09-22');

      const service = await ctx.create();
      expect((await service.getStats(user)).currentStreakWeeks).toBe(1);
    });

    it('counts distinct days, not sessions (two sessions on one day are one day)', async () => {
      const ctx = buildService();
      ctx.goals.set('2026-09-28', 2);
      done(ctx, '2026-09-29', '2026-09-29');

      const service = await ctx.create();
      expect((await service.getStats(user)).currentStreakWeeks).toBe(0);
    });

    it('is 0 when the user never set a goal', async () => {
      const ctx = buildService();
      const service = await ctx.create();
      expect((await service.getStats(user)).currentStreakWeeks).toBe(0);
    });
  });

  describe('getMuscleGroupStats', () => {
    it('returns every group with zeros when there are no sessions this month', async () => {
      const ctx = buildService();
      const service = await ctx.create();

      const stats = await service.getMuscleGroupStats(user);

      expect(stats.month).toBe('2026-10');
      expect(stats.groups.map((g) => g.group)).toEqual([
        'chest',
        'back',
        'shoulders',
        'arms',
        'legs',
        'glutes',
        'core',
      ]);
      expect(
        stats.groups.every((g) => g.sessions === 0 && g.volumeKg === 0),
      ).toBe(true);
    });

    it('counts a session once per group and adds up the volume of its muscles', async () => {
      const ctx = buildService();
      ctx.muscleRows.push(
        { entryId: 'e1', muscle: 'lats', volume: '1000.50' },
        { entryId: 'e1', muscle: 'traps', volume: '200' },
        { entryId: 'e2', muscle: 'lats', volume: '300' },
        { entryId: 'e2', muscle: 'chest', volume: '500' },
      );
      const service = await ctx.create();

      const stats = await service.getMuscleGroupStats(user);
      const byGroup = Object.fromEntries(stats.groups.map((g) => [g.group, g]));

      expect(byGroup.back).toEqual({
        group: 'back',
        sessions: 2,
        volumeKg: 1500.5,
      });
      expect(byGroup.chest).toEqual({
        group: 'chest',
        sessions: 1,
        volumeKg: 500,
      });
      expect(byGroup.legs.sessions).toBe(0);
    });

    it('ignores muscles that do not belong to any group', async () => {
      const ctx = buildService();
      ctx.muscleRows.push(
        { entryId: 'e1', muscle: 'unknown muscle', volume: '999' },
        { entryId: 'e1', muscle: 'glutes', volume: '400' },
      );
      const service = await ctx.create();

      const stats = await service.getMuscleGroupStats(user);
      const total = stats.groups.reduce((sum, g) => sum + g.volumeKg, 0);

      expect(total).toBe(400);
    });

    it('limits the query to the current month in the app time zone and to the user', async () => {
      const ctx = buildService();
      const service = await ctx.create();

      await service.getMuscleGroupStats(user);

      expect(ctx.muscleQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('BETWEEN'),
        { startDate: '2026-10-01', endDate: '2026-10-31' },
      );
      expect(ctx.muscleQueryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('userId'),
        { userId: 'user-1' },
      );
    });
  });

  describe('findMyCalendar', () => {
    const exercise = (id: string, muscle: string) => ({
      id,
      primaryMuscles: [muscle],
    });

    it('colors each entry from what it contains and keeps absent relations as null', async () => {
      const ctx = buildService();
      ctx.calendarEntryRepository.find.mockResolvedValueOnce([
        {
          id: 'done',
          date: '2026-10-01',
          status: 'done',
          routineDay: null,
          historyEntry: {
            id: 'h1',
            exercises: [
              { exercise: exercise('e1', 'glutes') },
              { exercise: exercise('e2', 'chest') },
              { exercise: exercise('e3', 'chest') },
            ],
          },
          plannedExercises: [],
        },
        {
          id: 'free-plan',
          date: '2026-10-02',
          status: 'planned',
          routineDay: null,
          historyEntry: null,
          plannedExercises: [
            { exercise: exercise('e4', 'lats') },
            { exercise: exercise('e5', 'quadriceps') },
          ],
        },
        {
          id: 'routine-plan',
          date: '2026-10-03',
          status: 'planned',
          routineDay: {
            id: 'd1',
            description: 'Push day',
            exercises: [{ exercise: exercise('e6', 'triceps') }],
          },
          historyEntry: null,
          plannedExercises: [],
        },
        {
          id: 'unmapped',
          date: '2026-10-04',
          status: 'done',
          routineDay: null,
          historyEntry: {
            id: 'h2',
            exercises: [{ exercise: exercise('e7', 'cardio') }],
          },
          plannedExercises: [],
        },
      ] as never);
      const service = await ctx.create();

      const [done, freePlan, routinePlan, unmapped] =
        await service.findMyCalendar(user, 2026, 10);

      expect(done.muscleGroups).toEqual(['chest', 'glutes']);
      expect(freePlan.muscleGroups).toEqual(['back', 'legs']);
      expect(routinePlan.muscleGroups).toEqual(['arms']);
      expect(unmapped.muscleGroups).toEqual([]);

      expect(done.routineDay).toBeNull();
      expect(freePlan.historyEntry).toBeNull();
      expect(routinePlan.routineDay).toEqual({
        id: 'd1',
        description: 'Push day',
      });
      expect(done.historyEntry).toEqual({ id: 'h1' });
    });
  });

  describe('planDay', () => {
    it('rejects a day in the past', async () => {
      const service = await buildService().create();
      await expect(
        service.planDay({ date: '2026-10-02', routineDayId: 'day-1' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lets you plan today at 22:00 in Cordoba (already tomorrow in UTC)', async () => {
      jest.setSystemTime(new Date('2026-10-04T01:00:00Z'));
      const ctx = buildService();
      const service = await ctx.create();

      await service.planDay(
        { date: '2026-10-03', exerciseIds: ['ex-1'] },
        user,
      );

      expect(ctx.calendarEntryRepository.save).toHaveBeenCalledTimes(1);
    });

    it('requires either a routine day or at least one exercise', async () => {
      const service = await buildService().create();
      await expect(
        service.planDay({ date: '2026-10-05' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('does not accept a routine day and a list of exercises together', async () => {
      const service = await buildService().create();
      await expect(
        service.planDay(
          { date: '2026-10-05', routineDayId: 'day-1', exerciseIds: ['ex-1'] },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('keeps the order in which the exercises were chosen', async () => {
      const ctx = buildService();
      const service = await ctx.create();

      await service.planDay(
        { date: '2026-10-05', exerciseIds: ['ex-b', 'ex-a', 'ex-c'] },
        user,
      );

      const created = ctx.calendarEntryRepository.create.mock.calls[0][0] as {
        plannedExercises: { exercise: { id: string }; order: number }[];
      };
      expect(
        created.plannedExercises.map((p) => [p.exercise.id, p.order]),
      ).toEqual([
        ['ex-b', 1],
        ['ex-a', 2],
        ['ex-c', 3],
      ]);
    });
  });

  describe('completeSession', () => {
    const sets = (...values: [number, number][]) =>
      values.map(([weight, reps]) => ({ weight, reps }));

    it('syncs the routine template: updates existing sets and adds new ones', async () => {
      const ctx = buildService();
      ctx.routinesService.findDayWithDetailsOwnedByUser.mockResolvedValue({
        id: 'day-1',
        exercises: [
          {
            id: 're-bench',
            exercise: { id: 'ex-bench' },
            sets: [{ id: 'set-1', order: 1 }],
          },
        ],
      });
      const service = await ctx.create();

      await service.completeSession(
        {
          date: '2026-10-03',
          routineDayId: 'day-1',
          exercises: [
            { exerciseId: 'ex-bench', sets: sets([60, 8], [65, 6]) },
            { exerciseId: 'ex-squat', sets: sets([80, 5]) },
          ],
        },
        user,
      );

      expect(ctx.routinesService.updateSet).toHaveBeenCalledTimes(1);
      expect(ctx.routinesService.updateSet).toHaveBeenCalledWith(
        'set-1',
        expect.objectContaining({ weight: 60, reps: 8 }),
        user,
      );
      expect(ctx.routinesService.addSet).toHaveBeenCalledTimes(1);
      expect(ctx.routinesService.addSet).toHaveBeenCalledWith(
        're-bench',
        expect.objectContaining({ weight: 65, reps: 6 }),
        user,
      );
    });

    it('does not touch any routine for a free session', async () => {
      const ctx = buildService();
      const service = await ctx.create();

      await service.completeSession(
        {
          date: '2026-10-03',
          exercises: [{ exerciseId: 'ex-bench', sets: sets([60, 8]) }],
        },
        user,
      );

      expect(
        ctx.routinesService.findDayWithDetailsOwnedByUser,
      ).not.toHaveBeenCalled();
      expect(ctx.routinesService.updateSet).not.toHaveBeenCalled();
      expect(ctx.routinesService.addSet).not.toHaveBeenCalled();
    });

    it('a free session without calendarEntryId does not consume any planned entry', async () => {
      const ctx = buildService();
      const service = await ctx.create();

      await service.completeSession(
        {
          date: '2026-10-03',
          exercises: [{ exerciseId: 'ex-bench', sets: sets([60, 8]) }],
        },
        user,
      );

      expect(ctx.calendarEntryRepository.findOne).not.toHaveBeenCalled();
    });

    it('rejects an unknown calendarEntryId before saving anything', async () => {
      const ctx = buildService();
      const service = await ctx.create();

      await expect(
        service.completeSession(
          {
            date: '2026-10-03',
            calendarEntryId: 'missing',
            exercises: [{ exerciseId: 'ex-bench', sets: sets([60, 8]) }],
          },
          user,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(ctx.historyEntryRepository.save).not.toHaveBeenCalled();
    });
  });
});
