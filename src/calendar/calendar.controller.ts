import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import {
  CompleteSessionDto,
  GetSessionPrefillDto,
  PlanDayDto,
  UpdateHistoryNotesDto,
} from './dto';

@UseGuards(AuthGuard('jwt'))
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  findMyCalendar(
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @GetUser() user: User,
  ) {
    return this.calendarService.findMyCalendar(user, year, month);
  }

  @Post('plan-day')
  planDay(@Body() planDayDto: PlanDayDto, @GetUser() user: User) {
    return this.calendarService.planDay(planDayDto, user);
  }

  @Get('session-prefill')
  getSessionPrefill(
    @Query() getSessionPrefillDto: GetSessionPrefillDto,
    @GetUser() user: User,
  ) {
    return this.calendarService.getSessionPrefill(getSessionPrefillDto, user);
  }

  @Get('history/:id')
  findHistoryEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    return this.calendarService.findHistoryEntryOwnedByUser(id, user);
  }

  @Get('history/exercise/:exerciseId')
  findExerciseHistory(
    @Param('exerciseId', ParseUUIDPipe) exerciseId: string,
    @GetUser() user: User,
  ) {
    return this.calendarService.findExerciseHistory(exerciseId, user);
  }

  @Post('complete-session')
  completeSession(
    @Body() completeSessionDto: CompleteSessionDto,
    @GetUser() user: User,
  ) {
    return this.calendarService.completeSession(completeSessionDto, user);
  }

  @Patch('history-exercises/:id/notes')
  updateHistoryExerciseNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateHistoryNotesDto: UpdateHistoryNotesDto,
    @GetUser() user: User,
  ) {
    return this.calendarService.updateHistoryExerciseNotes(
      id,
      updateHistoryNotesDto,
      user,
    );
  }

  @Patch('history-sets/:id/notes')
  updateHistorySetNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateHistoryNotesDto: UpdateHistoryNotesDto,
    @GetUser() user: User,
  ) {
    return this.calendarService.updateHistorySetNotes(
      id,
      updateHistoryNotesDto,
      user,
    );
  }

  @Delete(':id')
  cancelPlannedDay(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    return this.calendarService.cancelPlannedDay(id, user);
  }
}
