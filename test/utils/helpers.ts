import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

export function createUser(
  app: INestApplication,
  data: {
    email: string;
    username: string;
    password: string;
    roleId?: string;
  },
) {
  return request(app.getHttpServer()).post('/users').send(data);
}

export function login(
  app: INestApplication,
  data: { email: string; password: string },
) {
  return request(app.getHttpServer()).post('/auth/login').send(data);
}

export function getAccessTokenFromSetCookie(
  setCookieHeader: string[] | undefined,
  name: string,
) {
  if (!Array.isArray(setCookieHeader)) return '';
  for (const cookieStr of setCookieHeader) {
    const m = cookieStr.match(new RegExp(`${name}=([^;]+)`));
    if (m) return m[1];
  }
  return '';
}
