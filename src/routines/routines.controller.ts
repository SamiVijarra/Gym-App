import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { CreateRoutineDayDto, UpdateRoutineDayDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('routines')
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post('days')
  create(
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
    @Param('id') id: string,
    @Body() updateRoutineDayDto: UpdateRoutineDayDto,
    @GetUser() user: User,
  ) {
    return this.routinesService.updateDay(id, updateRoutineDayDto, user);
  }

  @Delete('days/:id')
  removeDay(@Param('id') id: string, @GetUser() user: User) {
    return this.routinesService.removeDay(id, user);
  }
}
