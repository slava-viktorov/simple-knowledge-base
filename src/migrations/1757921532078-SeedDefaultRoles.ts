import { MigrationInterface, QueryRunner } from 'typeorm';
import { Role } from '../roles/entities/role.entity';

export class SeedDefaultRoles1757921532078 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.upsert(
      Role,
      [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'author',
          description: 'Regular user role',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'admin',
          description: 'Administrator role',
        },
      ],
      ['id'],
    );
  }

  public async down(): Promise<void> {
    // Ничего не удаляем: роли считаются системными и постоянными
  }
}
