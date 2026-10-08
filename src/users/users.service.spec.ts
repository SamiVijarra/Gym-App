import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';

async function buildService(storedPassword: string | null) {
  const userRepository = {
    findOne: jest.fn(() =>
      Promise.resolve(
        storedPassword === null
          ? null
          : { id: 'user-1', password: bcrypt.hashSync(storedPassword, 4) },
      ),
    ),
    update: jest.fn(() => Promise.resolve({ affected: 1 })),
    preload: jest.fn((value: object) => Promise.resolve(value)),
    save: jest.fn((value: object) => Promise.resolve(value)),
  };

  const moduleRef = await Test.createTestingModule({
    providers: [
      UsersService,
      { provide: getRepositoryToken(User), useValue: userRepository },
    ],
  }).compile();

  return { service: moduleRef.get(UsersService), userRepository };
}

describe('UsersService.changePassword', () => {
  it('stores a hash of the new password when the current one is correct', async () => {
    const { service, userRepository } = await buildService('Current1');

    const result = await service.changePassword('user-1', {
      currentPassword: 'Current1',
      newPassword: 'Brandnew2',
    });

    expect(result).toEqual({ message: 'Password updated' });
    const [id, changes] = userRepository.update.mock.calls[0] as unknown as [
      string,
      { password: string },
    ];
    expect(id).toBe('user-1');
    expect(changes.password).not.toBe('Brandnew2');
    expect(bcrypt.compareSync('Brandnew2', changes.password)).toBe(true);
  });

  it('rejects a wrong current password without changing anything', async () => {
    const { service, userRepository } = await buildService('Current1');

    await expect(
      service.changePassword('user-1', {
        currentPassword: 'Wrong999',
        newPassword: 'Brandnew2',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('rejects a new password equal to the current one', async () => {
    const { service, userRepository } = await buildService('Current1');

    await expect(
      service.changePassword('user-1', {
        currentPassword: 'Current1',
        newPassword: 'Current1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('fails when the user does not exist', async () => {
    const { service } = await buildService(null);

    await expect(
      service.changePassword('user-1', {
        currentPassword: 'Current1',
        newPassword: 'Brandnew2',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
