import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/users/entities/user.entity';

interface PostgresError {
  code: string;
  detail: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.create(createUserDto);
      return {
        ...this.excludePassword(user),
        token: this.getJwtToken({ id: user.id }),
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userService.findByEmail(email, true);

    if (!bcrypt.compareSync(password, user.password)) {
      throw new BadRequestException('Credentials are not valid');
    }

    return {
      ...this.excludePassword(user),
      token: this.getJwtToken({ id: user.id }),
    };
  }

  private excludePassword(user: User) {
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private getJwtToken(payload: { id: string }) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleDBErrors(error: unknown): never {
    const pgError = error as PostgresError;
    if (pgError.code === '23505') {
      throw new BadRequestException(pgError.detail);
    }
    throw new InternalServerErrorException('Please check server logs');
  }

  checkAuthStatus(user: User) {
    return {
      ...this.excludePassword(user),
      token: this.getJwtToken({ id: user.id }),
    };
  }
}
