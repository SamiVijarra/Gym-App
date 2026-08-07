import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ExercisesService } from './exercises.service';
import { CreateExerciseDto, UpdateExerciseDto, FindExercisesDto } from './dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  findAll(@Query() findExercisesDto: FindExercisesDto) {
    return this.exercisesService.findAll(findExercisesDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.exercisesService.findOne(id);
  }

  @Post()
  create(@Body() createExerciseDto: CreateExerciseDto, @GetUser() user: User) {
    return this.exercisesService.create(createExerciseDto, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
    @GetUser() user: User,
  ) {
    return this.exercisesService.update(id, updateExerciseDto, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.exercisesService.remove(id, user);
  }
}
