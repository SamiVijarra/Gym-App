import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RoutinesService } from './routines.service';
import {
  CreateRoutineDayDto,
  CreateRoutineExerciseDto,
  CreateSetDto,
  UpdateRoutineDayDto,
  UpdateRoutineExerciseDto,
  UpdateSetDto,
} from './dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('routines')
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post('days')
  createDay(
    @Body() createRoutineDayDto: CreateRoutineDayDto,
    @GetUser() user: User,
  ) {
    return this.routinesService.createDay(createRoutineDayDto, user);
  }

  @Get()
  findMyRoutine(@GetUser() user: User) {
    return this.routinesService.findMyRoutine(user);
  }

  @Patch('days/:id')
  updatedDay(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoutineDayDto: UpdateRoutineDayDto,
    @GetUser() user: User,
  ) {
    return this.routinesService.updateDay(id, updateRoutineDayDto, user);
  }

  @Delete('days/:id')
  removeDay(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.routinesService.removeDay(id, user);
  }

  @Post('days/:dayId/exercises')
  addExerciseToDay(
    @Param('dayId', ParseUUIDPipe) dayId: string,
    @Body() createRoutineExerciseDto: CreateRoutineExerciseDto,
    @GetUser() user: User,
  ) {
    return this.routinesService.addExerciseToDay(
      dayId,
      createRoutineExerciseDto,
      user,
    );
  }

  @Patch('exercises/:id')
  updatedExerciseInDay(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoutineExerciseDto: UpdateRoutineExerciseDto,
    @GetUser() user: User,
  ) {
    return this.routinesService.updateExerciseInDay(
      id,
      updateRoutineExerciseDto,
      user,
    );
  }

  @Delete('exercises/:id')
  removeExerciseFromDay(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    return this.routinesService.removeExerciseFromDay(id, user);
  }

  @Post('exercises/:id/sets')
  addSet(
    @Param('id', ParseUUIDPipe) routineExerciseId: string,
    @Body() createSetDto: CreateSetDto,
    @GetUser() user: User,
  ) {
    return this.routinesService.addSet(routineExerciseId, createSetDto, user);
  }

  @Patch('sets/:id')
  updatedSet(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSetDto: UpdateSetDto,
    @GetUser() user: User,
  ) {
    return this.routinesService.updateSet(id, updateSetDto, user);
  }

  @Delete('sets/:id')
  removeSet(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.routinesService.removeSet(id, user);
  }
}
