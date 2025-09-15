import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { ROLE_NAMES, getAdminRoleNames } from '../common/roles';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.rolesRepository.find();
  }

  async findById(id: string): Promise<Role | null> {
    return this.rolesRepository.findOneBy({ id });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.rolesRepository.findOneBy({ name });
  }

  async findAdminRole(): Promise<Role | null> {
    return this.rolesRepository.findOneBy({ name: ROLE_NAMES.ADMIN });
  }

  async findAdminRoles(): Promise<Role[]> {
    return this.rolesRepository.find({
      where: { name: In(getAdminRoleNames()) },
    });
  }

  async findAuthorRole(): Promise<Role | null> {
    return this.rolesRepository.findOneBy({ name: ROLE_NAMES.AUTHOR });
  }

  async create(data: { name: string; description?: string }): Promise<Role> {
    const role = this.rolesRepository.create(data);
    return this.rolesRepository.save(role);
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
    },
  ): Promise<Role | null> {
    await this.rolesRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.rolesRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
