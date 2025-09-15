import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';
import { IUsersRepository } from '../users.repository.interface';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class TypeOrmUsersRepository implements IUsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
    source?: string;
    roleId?: string;
  }): Promise<User> {
    const newUser = this.usersRepository.create(data);
    const result = await this.usersRepository.save(newUser);
    return result;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.usersRepository.findOneBy({ id });
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.usersRepository.findOneBy({ email });
    return user;
  }

  async findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<User | null> {
    const user = await this.usersRepository.findOneBy([
      { email },
      { username },
    ]);

    return user;
  }

  async findAllBySource(source: string): Promise<User[]> {
    const user = await this.usersRepository.findBy({ source });
    return user;
  }

  async deleteById(id: string): Promise<number> {
    const result = await this.usersRepository.delete({ id });
    return result.affected ?? 0;
  }

  async update(id: string, updateData: UpdateUserDto): Promise<User | null> {
    const existingUser = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!existingUser) {
      return null;
    }

    // Обновляем только переданные поля
    Object.assign(existingUser, updateData);

    const updatedUser = await this.usersRepository.save(existingUser);
    return updatedUser;
  }
}
