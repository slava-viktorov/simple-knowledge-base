import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from './users/users.module';
import { ArticlesModule } from './articles/articles.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { TagsModule } from './tags/tags.module';
import { dataSourceOptions } from '../data-source';
import { validate } from './common/config/validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    UsersModule,
    ArticlesModule,
    AuthModule,
    RolesModule,
    TagsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
