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

  async completeSession(completeSessionDto: CompleteSessionDto, user: User) {
    const { date, routineDayId, exercises } = completeSessionDto;

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

    const existingCalendarEntry = await this.calendarEntryRepository.findOne({
      where: {
        user: { id: user.id },
        date,
        status: CalendarStatus.PLANNED,
        ...(routineDayId ? { routineDay: { id: routineDayId } } : {}),
      },
    });

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

  private getMonthRange(year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return { startDate, endDate };
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
        exercises: { exercise: true, sets: true },
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
}
