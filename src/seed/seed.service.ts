import { Injectable } from '@nestjs/common';

@Injectable()
export class SeedService {
  create() {
    return 'This action adds a new seed';
  }

  findAll() {
    return `This action returns all seed`;
  }

  findOne(id: number) {
    return `This action returns a #${id} seed`;
  }

  update(id: number) {
    return `This action updates a #${id} seed`;
  }

  remove(id: number) {
    return `This action removes a #${id} seed`;
  }
}
