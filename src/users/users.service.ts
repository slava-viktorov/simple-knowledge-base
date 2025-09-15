import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import {
  IUsersRepository,
  USERS_REPOSITORY,
} from './users.repository.interface';
import { User } from './entities/user.entity';
import { RolesService } from '../roles/roles.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly rolesService: RolesService,
  ) {}

  async create(data: {
    email: string;
    username: string;
    password: string;
    source?: string;
    roleId?: string;
  }): Promise<User> {
    await this.assertUnique(data.email, data.username);
    const finalRoleId = await this.resolveRoleId(data.roleId);

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.usersRepository.create({
      email: data.email,
      username: data.username,
      passwordHash,
      source: data.source,
      roleId: finalRoleId,
    });
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.usersRepository.findById(id);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.usersRepository.findByEmail(email);
    return user;
  }

  async findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<User | null> {
    const user = await this.usersRepository.findByEmailOrUsername(
      email,
      username,
    );
    return user;
  }

  async findAllBySource(source: string): Promise<User[]> {
    const users = await this.usersRepository.findAllBySource(source);
    return users;
  }

  async deleteById(id: string): Promise<number> {
    const result = await this.usersRepository.deleteById(id);
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Проверка уникальности email/username при обновлении
    if (updateUserDto.email || updateUserDto.username) {
      await this.assertUniqueOnUpdate(
        id,
        updateUserDto.email,
        updateUserDto.username,
      );
    }
    const updatedUser = await this.usersRepository.update(id, updateUserDto);

    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return updatedUser;
  }

  private async assertUnique(email: string, username: string): Promise<void> {
    const existing = await this.usersRepository.findByEmailOrUsername(
      email,
      username,
    );
    if (!existing) return;
    if (existing.email === email) {
      throw new ConflictException('Email already exists');
    }
    if (existing.username === username) {
      throw new ConflictException('Username already exists');
    }
    throw new ConflictException(
      'User with provided credentials already exists',
    );
  }

  private async assertUniqueOnUpdate(
    id: string,
    email?: string,
    username?: string,
  ): Promise<void> {
    const existing = await this.usersRepository.findByEmailOrUsername(
      email ?? '',
      username ?? '',
    );
    if (!existing || existing.id === id) return;
    if (email && existing.email === email) {
      throw new ConflictException('Email already exists');
    }
    if (username && existing.username === username) {
      throw new ConflictException('Username already exists');
    }
  }

  private async resolveRoleId(roleId?: string): Promise<string> {
    if (roleId) {
      const role = await this.rolesService.findById(roleId);
      if (!role) {
        throw new Error('Invalid role specified');
      }
      return role.id;
    }
    const authorRole = await this.rolesService.findAuthorRole();
    if (!authorRole) {
      throw new Error('Author role not found. Please run migrations.');
    }
    return authorRole.id;
  }
}
