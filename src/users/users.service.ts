import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
interface PostgresError {
  code: string;
  detail: string;
}
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;
      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
      });
      await this.userRepository.save(user);
      return user;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async findByEmail(email: string, withPassword: boolean = false) {
    let user: User | null;
    try {
      const query = this.userRepository
        .createQueryBuilder('user')
        .where('user.email = :email', { email });
      if (withPassword) {
        query.addSelect('user.password');
      }
      user = await query.getOne();
    } catch (error) {
      this.handleDBErrors(error);
    }
    if (!user) throw new BadRequestException('Credentials are not valid');
    return user;
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password } = updateUserDto;
    const userData = {
      ...updateUserDto,
      ...(password && { password: bcrypt.hashSync(password, 10) }),
    };
    const user = await this.userRepository.preload({
      id,
      ...userData,
    });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    try {
      await this.userRepository.save(user);
      const { password: _password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async remove(id: string) {
    await this.userRepository.delete(id);
  }

  private handleDBErrors(error: unknown): never {
    const pgError = error as PostgresError;
    if (pgError.code === '23505') {
      throw new BadRequestException(pgError.detail);
    }
    throw new InternalServerErrorException('Please check server logs');
  }
}
