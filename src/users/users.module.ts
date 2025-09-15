import { Module } from '@nestjs/common';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { USERS_REPOSITORY } from './users.repository.interface';
import { TypeOrmUsersRepository } from './repositories/typeorm-users.repository';
import { UserEditGuard } from './guards/user-edit.guard';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), RolesModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserEditGuard,
    {
      provide: USERS_REPOSITORY,
      useClass: TypeOrmUsersRepository,
    },
  ],
  exports: [UsersService, USERS_REPOSITORY],
})
export class UsersModule {}
