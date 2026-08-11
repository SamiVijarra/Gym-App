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
  findAll() {
    return this.routinesService.findAll();
  }

  @Get(':id')
  findMy(@Param('id') id: string) {
    return this.routinesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRoutineDayDto: UpdateRoutineDayDto,
  ) {
    return this.routinesService.updateDay(+id, updateRoutineDayDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routinesService.remove(+id);
  }
}
