process.env.NODE_ENV = 'test';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import { DataSource as TypeOrmDataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

export interface TestContext {
  app: INestApplication;
  db: TypeOrmDataSource;
  admin: { id: string; email: string; accessToken: string };
  author: { id: string; email: string; accessToken: string };
}

// const REFRESH_TOKEN_NAME = process.env.JWT_REFRESH_TOKEN_NAME || 'refreshToken';
const ACCESS_TOKEN_NAME = process.env.JWT_ACCESS_TOKEN_NAME || 'accessToken';

function extractToken(setCookieHeader: string[] | undefined, name: string) {
  if (!Array.isArray(setCookieHeader)) return '';
  for (const cookieStr of setCookieHeader) {
    const m = cookieStr.match(new RegExp(`${name}=([^;]+)`));
    if (m) return m[1];
  }
  return '';
}

export async function initTestContext(): Promise<TestContext> {
  const { dataSourceOptions } = await import('../data-source');
  const db = new TypeOrmDataSource(dataSourceOptions);
  await db.initialize();
  await db.runMigrations();

  // Очистка зависимых таблиц в корректном порядке
  await db.query('TRUNCATE TABLE "article_tags" RESTART IDENTITY CASCADE');
  await db.query('TRUNCATE TABLE "refresh_tokens" RESTART IDENTITY CASCADE');
  await db.query('TRUNCATE TABLE "articles" RESTART IDENTITY CASCADE');
  await db.query('TRUNCATE TABLE "tags" RESTART IDENTITY CASCADE');
  await db.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');

  // Создать приложение
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  await app.init();

  // Создаем пользователя и повышаем роль до admin напрямую через БД
  const adminEmail = `admin-${Date.now()}@example.com`;
  const adminCreate = await request(app.getHttpServer())
    .post('/users')
    .send({
      email: adminEmail,
      username: `admin_user_${Date.now()}`,
      password: 'password12345',
    })
    .expect(201);
  const adminId = adminCreate.body?.id;

  const adminRole = await db.query(
    'SELECT id FROM roles WHERE name = $1 LIMIT 1',
    ['admin'],
  );
  const adminRoleId = adminRole?.[0]?.id ?? adminRole?.[0]?.id;
  if (adminRoleId) {
    await db.query('UPDATE "users" SET "roleId" = $1 WHERE id = $2', [
      adminRoleId,
      adminId,
    ]);
  }

  const adminLogin = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: adminEmail, password: 'password12345' })
    .expect(200);
  const adminCookies = Array.isArray(adminLogin.headers['set-cookie'])
    ? adminLogin.headers['set-cookie']
    : [adminLogin.headers['set-cookie']].filter(Boolean);
  const adminAccessToken = extractToken(adminCookies, ACCESS_TOKEN_NAME);

  // Создаем обычного автора
  const authorEmail = `author-${Date.now()}@example.com`;
  const authorCreate = await request(app.getHttpServer())
    .post('/users')
    .send({
      email: authorEmail,
      username: `author_user_${Date.now()}`,
      password: 'password12345',
    })
    .expect(201);
  const authorLogin = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: authorEmail, password: 'password12345' })
    .expect(200);
  const authorCookies = Array.isArray(authorLogin.headers['set-cookie'])
    ? authorLogin.headers['set-cookie']
    : [authorLogin.headers['set-cookie']].filter(Boolean);
  const authorAccessToken = extractToken(authorCookies, ACCESS_TOKEN_NAME);

  return {
    app,
    db,
    admin: { id: adminId, email: adminEmail, accessToken: adminAccessToken },
    author: {
      id: authorCreate.body?.id,
      email: authorEmail,
      accessToken: authorAccessToken,
    },
  };
}

export async function resetData(db: TypeOrmDataSource): Promise<void> {
  await db.query('TRUNCATE TABLE "article_tags" RESTART IDENTITY CASCADE');
  await db.query('TRUNCATE TABLE "refresh_tokens" RESTART IDENTITY CASCADE');
  await db.query('TRUNCATE TABLE "articles" RESTART IDENTITY CASCADE');
  await db.query('TRUNCATE TABLE "tags" RESTART IDENTITY CASCADE');
  // Пользователей не чистим между тестами
}

export async function shutdownTestContext(ctx: TestContext): Promise<void> {
  await ctx.app.close();
  await ctx.db.destroy();
}
