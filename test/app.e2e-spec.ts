import * as request from 'supertest';

import { initTestContext, resetData, shutdownTestContext } from './setup';
import { createUser, login } from './utils/helpers';
import {
  extractTokensFromCookies,
  ACCESS_TOKEN_NAME,
  REFRESH_TOKEN_NAME,
} from './utils/cookies';

describe('AppController (e2e)', () => {
  let ctx: Awaited<ReturnType<typeof initTestContext>>;

  beforeAll(async () => {
    ctx = await initTestContext();
  });

  afterAll(async () => {
    await shutdownTestContext(ctx);
  });

  beforeEach(async () => {
    await resetData(ctx.db);
  });

  afterEach(async () => {});

  describe('articles', () => {
    it('GET /articles should return articles list', () => {
      return request(ctx.app.getHttpServer())
        .get('/articles')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('count');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('Pagination', () => {
      beforeEach(async () => {
        const email = `pagination-test-${Date.now()}@example.com`;
        await createUser(ctx.app, {
          email,
          username: `pagination_user-${Date.now()}`,
          password: 'password12345',
        }).expect(201);

        const loginRes = await login(ctx.app, {
          email,
          password: 'password12345',
        }).expect(200);

        globalThis.__testCookies = loginRes.headers['set-cookie'];

        for (let i = 1; i <= 25; i++) {
          await request(ctx.app.getHttpServer())
            .post('/articles')
            .set('Cookie', globalThis.__testCookies)
            .send({
              title: `Article ${i}`,
              content: `Content for article ${i}`,
              isPublic: true,
            })
            .expect(201);
        }
      });

      it('should return default pagination (page=1, limit=10)', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get('/articles')
          .expect(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(10);
        expect(response.body.data[0].title).toBe('Article 25');
        expect(response.body.data[9].title).toBe('Article 16');
      });

      it('should return second page with 10 articles', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get('/articles?page=2&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(10);
        expect(response.body.data[0].title).toBe('Article 15');
        expect(response.body.data[9].title).toBe('Article 6');
      });

      it('should return third page with remaining 5 articles', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get('/articles?page=3&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(5);
        expect(response.body.data[0].title).toBe('Article 5');
        expect(response.body.data[4].title).toBe('Article 1');
      });

      it('should limit maximum articles per page to 100', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get('/articles?page=1&limit=100')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(25); // Все articles, но не больше 100
      });

      it('should handle invalid page number', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get('/articles?page=0&limit=10')
          .expect(400); // ValidationPipe должен отклонить page < 1

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
      });

      it('should handle invalid limit', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get('/articles?page=1&limit=0')
          .expect(400); // ValidationPipe должен отклонить limit < 1

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
      });

      it('should handle limit greater than maximum', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get('/articles?page=1&limit=150')
          .expect(400); // ValidationPipe должен отклонить limit > 100

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
      });

      it('should return empty array for page beyond data', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get('/articles?page=10&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(0);
      });

      it('should return articles using skip parameter', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get('/articles?skip=10&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(10);
        expect(response.body.data[0].title).toBe('Article 15');
        expect(response.body.data[9].title).toBe('Article 6');
      });

      it('should return articles using skip parameter for second page', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get('/articles?skip=20&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(5);
        expect(response.body.data[0].title).toBe('Article 5');
        expect(response.body.data[4].title).toBe('Article 1');
      });

      it('should prioritize skip over page when both are provided', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get('/articles?page=2&skip=10&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(10);
        // Должен использовать skip=10, а не page=2
        expect(response.body.data[0].title).toBe('Article 15');
        expect(response.body.data[9].title).toBe('Article 6');
      });

      it('should handle negative skip value', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get('/articles?skip=-1&limit=10')
          .expect(400); // ValidationPipe должен отклонить skip < 0

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
      });

      it('should handle skip with zero value', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get('/articles?skip=0&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(10);
        expect(response.body.data[0].title).toBe('Article 25');
        expect(response.body.data[9].title).toBe('Article 16');
      });

      it('should handle skip beyond data range', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get('/articles?skip=100&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(0);
      });

      it('should work with skip and custom limit', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get('/articles?skip=5&limit=5')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(5);
        expect(response.body.data[0].title).toBe('Article 20');
        expect(response.body.data[4].title).toBe('Article 16');
      });
    });

    describe('User search methods', () => {
      it('should find user by email for login', async () => {
        const email = `search-${Date.now()}@example.com`;
        const username = `search_user-${Date.now()}`;

        await request(ctx.app.getHttpServer())
          .post('/users')
          .send({
            email,
            username,
            password: 'password12345',
          })
          .expect(201);

        const loginRes = await request(ctx.app.getHttpServer())
          .post('/auth/login')
          .send({ email, password: 'password12345' })
          .expect(200);
        expect(loginRes.body).toEqual({
          id: expect.any(String),
          email,
          username,
        });
        expect(loginRes.headers['set-cookie']).toBeDefined();
      });

      it('should handle login with non-existent email', async () => {
        const email = `nonexistent-${Date.now()}@example.com`;

        // Попытка логина с несуществующим email
        await request(ctx.app.getHttpServer())
          .post('/auth/login')
          .send({ email, password: 'password12345' })
          .expect(401);
      });
    });

    describe('Error handling', () => {
      it('should handle duplicate email registration', async () => {
        const email = `duplicate-${Date.now()}@example.com`;
        const username = `user-${Date.now()}`;

        // Первая регистрация
        await request(ctx.app.getHttpServer())
          .post('/users')
          .send({
            email,
            username,
            password: 'password12345',
          })
          .expect(201);

        // Попытка регистрации с тем же email
        await request(ctx.app.getHttpServer())
          .post('/users')
          .send({
            email,
            username: `user2_${Date.now()}`,
            password: 'password12345',
          })
          .expect(409)
          .expect((res) => {
            expect(res.body.message).toContain('Email already exists');
          });
      });

      it('should handle duplicate username registration', async () => {
        const email = `user-${Date.now()}@example.com`;
        const username = `dup_${Date.now()}`; // Короткий username

        // Первая регистрация
        const firstResponse = await request(ctx.app.getHttpServer())
          .post('/users')
          .send({
            email,
            username,
            password: 'password12345',
          });

        expect(firstResponse.status).toBe(201);

        // Попытка регистрации с тем же username
        const secondResponse = await request(ctx.app.getHttpServer())
          .post('/users')
          .send({
            email: `user2_${Date.now()}@example.com`,
            username,
            password: 'password12345',
          });

        expect(secondResponse.status).toBe(409);
        expect(secondResponse.body.message).toContain(
          'Username already exists',
        );
      });

      it('should handle invalid refresh token', async () => {
        await request(ctx.app.getHttpServer())
          .post('/auth/refresh')
          .expect(401);
      });

      it('should handle expired refresh token', async () => {
        const email = `expired-${Date.now()}@example.com`;
        await request(ctx.app.getHttpServer())
          .post('/users')
          .send({
            email,
            username: `expired_user-${Date.now()}`,
            password: 'password12345',
          })
          .expect(201);

        const loginRes = await request(ctx.app.getHttpServer())
          .post('/auth/login')
          .send({ email, password: 'password12345' })
          .expect(200);

        const setCookieHeader = Array.isArray(loginRes.headers['set-cookie'])
          ? loginRes.headers['set-cookie']
          : [loginRes.headers['set-cookie']].filter(Boolean);
        const { refreshToken: refreshTokenValue } =
          extractTokensFromCookies(setCookieHeader);

        await request(ctx.app.getHttpServer())
          .post('/auth/logout')
          .set('Cookie', `${REFRESH_TOKEN_NAME}=${refreshTokenValue}`)
          .expect(204);

        await request(ctx.app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', `${REFRESH_TOKEN_NAME}=${refreshTokenValue}`)
          .expect(401);
      });

      it('should handle invalid login credentials', async () => {
        const email = `invalid-${Date.now()}@example.com`;

        // Попытка логина с несуществующим пользователем
        await request(ctx.app.getHttpServer())
          .post('/auth/login')
          .send({ email, password: 'wrongpassword' })
          .expect(401);
      });

      it('should handle invalid article data', async () => {
        const email = `validation-${Date.now()}@example.com`;
        await request(ctx.app.getHttpServer())
          .post('/users')
          .send({
            email,
            username: `validation_user-${Date.now()}`,
            password: 'password12345',
          })
          .expect(201);

        const loginRes = await request(ctx.app.getHttpServer())
          .post('/auth/login')
          .send({ email, password: 'password12345' })
          .expect(200);

        const setCookieHeader = Array.isArray(loginRes.headers['set-cookie'])
          ? loginRes.headers['set-cookie']
          : [loginRes.headers['set-cookie']].filter(Boolean);
        const { accessToken: accessTokenValue } =
          extractTokensFromCookies(setCookieHeader);

        // Попытка создать article с пустым title
        await request(ctx.app.getHttpServer())
          .post('/articles')
          .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessTokenValue}`)
          .send({ title: '', content: 'Test Content' })
          .expect(400);

        // Попытка создать article с пустым content
        await request(ctx.app.getHttpServer())
          .post('/articles')
          .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessTokenValue}`)
          .send({ title: 'Test Title', content: '' })
          .expect(400);
      });
    });
  });

  describe('Auth & JWT', () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    let articleId: string;

    it('POST /users -> POST /auth/login -> CRUD /articles', async () => {
      await request(ctx.app.getHttpServer())
        .post('/users')
        .send({
          email: uniqueEmail,
          username: `user-${Date.now()}`,
          password: 'password12345',
        })
        .expect(201);

      const loginRes = await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({ email: uniqueEmail, password: 'password12345' })
        .expect(200);

      const setCookieHeader = Array.isArray(loginRes.headers['set-cookie'])
        ? loginRes.headers['set-cookie']
        : [loginRes.headers['set-cookie']].filter(Boolean);
      const { accessToken: accessTokenValue } =
        extractTokensFromCookies(setCookieHeader);

      // Создание article (только с accessToken в cookie)
      const createRes = await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessTokenValue}`)
        .send({
          title: 'Test Article',
          content: 'Test Content',
          isPublic: true,
        })
        .expect(201);
      expect(createRes.body).toHaveProperty('id');
      articleId = createRes.body.id;

      // Попытка создать article без токена
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .send({ title: 'No Auth', content: 'No Auth Content' })
        .expect(401);

      // Получение списка articles
      const listRes = await request(ctx.app.getHttpServer())
        .get('/articles')
        .expect(200);
      expect(listRes.body.data.length).toBe(1);

      // Получение одного article
      await request(ctx.app.getHttpServer())
        .get(`/articles/${articleId}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessTokenValue}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', articleId);
        });

      // Обновление article (только с accessToken)
      await request(ctx.app.getHttpServer())
        .patch(`/articles/${articleId}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessTokenValue}`)
        .send({ title: 'Updated Title' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('title', 'Updated Title');
        });

      // Попытка обновить без токена
      await request(ctx.app.getHttpServer())
        .patch(`/articles/${articleId}`)
        .send({ title: 'No Auth' })
        .expect(401);

      // Удаление article (только с accessToken)
      await request(ctx.app.getHttpServer())
        .delete(`/articles/${articleId}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessTokenValue}`)
        .expect(200);

      // Попытка удалить без токена
      await request(ctx.app.getHttpServer())
        .delete(`/articles/${articleId}`)
        .expect(401);
    });

    it('should support skip parameter for authenticated users', async () => {
      const skipEmail = `skip-auth-${Date.now()}@example.com`;

      await request(ctx.app.getHttpServer())
        .post('/users')
        .send({
          email: skipEmail,
          username: `skip_auth_user-${Date.now()}`,
          password: 'password12345',
        })
        .expect(201);

      const loginRes = await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({ email: skipEmail, password: 'password12345' })
        .expect(200);

      const setCookieHeader = Array.isArray(loginRes.headers['set-cookie'])
        ? loginRes.headers['set-cookie']
        : [loginRes.headers['set-cookie']].filter(Boolean);
      const { accessToken: accessTokenValue } =
        extractTokensFromCookies(setCookieHeader);

      // Создаем 15 articles для тестирования skip
      for (let i = 1; i <= 15; i++) {
        await request(ctx.app.getHttpServer())
          .post('/articles')
          .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessTokenValue}`)
          .send({
            title: `Auth Article ${i}`,
            content: `Content for auth article ${i}`,
            isPublic: true,
          })
          .expect(201);
      }

      // Тестируем skip с аутентификацией
      const response = await request(ctx.app.getHttpServer())
        .get('/articles?skip=5&limit=5')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
      expect(response.body.count).toBe(15);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.data[0].title).toBe('Auth Article 10');
      expect(response.body.data[4].title).toBe('Auth Article 6');
    });

    it('should prioritize skip over page for authenticated users', async () => {
      const priorityEmail = `priority-${Date.now()}@example.com`;

      await request(ctx.app.getHttpServer())
        .post('/users')
        .send({
          email: priorityEmail,
          username: `priority_user-${Date.now()}`,
          password: 'password12345',
        })
        .expect(201);

      const loginRes = await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({ email: priorityEmail, password: 'password12345' })
        .expect(200);

      const setCookieHeader = Array.isArray(loginRes.headers['set-cookie'])
        ? loginRes.headers['set-cookie']
        : [loginRes.headers['set-cookie']].filter(Boolean);
      const { accessToken: accessTokenValue } =
        extractTokensFromCookies(setCookieHeader);

      // Создаем 10 articles
      for (let i = 1; i <= 10; i++) {
        await request(ctx.app.getHttpServer())
          .post('/articles')
          .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessTokenValue}`)
          .send({
            title: `Priority Article ${i}`,
            content: `Content for priority articles ${i}`,
            isPublic: true,
          })
          .expect(201);
      }

      // Тестируем приоритет skip над page
      const response = await request(ctx.app.getHttpServer())
        .get('/articles?page=2&skip=3&limit=3')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
      expect(response.body.count).toBe(10);
      expect(response.body.data).toHaveLength(3);
      // Должен использовать skip=3, а не page=2
      expect(response.body.data[0].title).toBe('Priority Article 7');
      expect(response.body.data[2].title).toBe('Priority Article 5');
    });

    it('POST /auth/refresh - get new accessToken', async () => {
      const refreshEmail = `refresh-${Date.now()}@example.com`;
      const refreshUsername = `refresh_user_${Date.now()}`;

      await request(ctx.app.getHttpServer())
        .post('/users')
        .send({
          email: refreshEmail,
          username: refreshUsername,
          password: 'password12345',
        })
        .expect(201);
      const loginRes = await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({ email: refreshEmail, password: 'password12345' })
        .expect(200);

      const setCookieHeader = Array.isArray(loginRes.headers['set-cookie'])
        ? loginRes.headers['set-cookie']
        : [loginRes.headers['set-cookie']].filter(Boolean);
      const { refreshToken: refreshTokenValue } =
        extractTokensFromCookies(setCookieHeader);

      const refreshRes = await request(ctx.app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', `${REFRESH_TOKEN_NAME}=${refreshTokenValue}`)
        .expect(200);

      expect(refreshRes.headers['set-cookie']).toBeDefined();
    });

    it('POST /auth/logout - invalidates refreshToken', async () => {
      const logoutEmail = `logout-${Date.now()}@example.com`;

      await request(ctx.app.getHttpServer())
        .post('/users')
        .send({
          email: logoutEmail,
          username: `logout_user-${Date.now()}`,
          password: 'password12345',
        })
        .expect(201);

      const loginRes = await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({ email: logoutEmail, password: 'password12345' })
        .expect(200);

      const setCookieHeader = Array.isArray(loginRes.headers['set-cookie'])
        ? loginRes.headers['set-cookie']
        : [loginRes.headers['set-cookie']].filter(Boolean);
      const { refreshToken: refreshTokenValue } =
        extractTokensFromCookies(setCookieHeader);

      // Logout
      await request(ctx.app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', `${REFRESH_TOKEN_NAME}=${refreshTokenValue}`)
        .expect(204);

      // Попытка обновить токен после logout
      await request(ctx.app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', `${REFRESH_TOKEN_NAME}=${refreshTokenValue}`)
        .expect(401);
    });

    it('POST /auth/logout - should throw 401 when no refresh token', async () => {
      // Попытка logout без refresh token
      await request(ctx.app.getHttpServer()).post('/auth/logout').expect(401);
    });

    it('POST /auth/logout - should throw 401 when refresh token is invalid', async () => {
      // Попытка logout с невалидным refresh token
      await request(ctx.app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', `${REFRESH_TOKEN_NAME}=invalid-token`)
        .expect(401);
    });
  });

  describe('Forbidden (403)', () => {
    let userA: { email: string; accessToken: string };
    let userB: { email: string; accessToken: string };
    let articleId: string;

    beforeEach(async () => {
      // Регистрация и логин UserA
      const emailA = `userA-${Date.now()}@example.com`;
      await request(ctx.app.getHttpServer())
        .post('/users')
        .send({
          email: emailA,
          username: `userA_${Date.now()}`,
          password: 'password12345',
        })
        .expect(201);

      const loginA = await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({ email: emailA, password: 'password12345' })
        .expect(200);

      const setCookieHeaderA = Array.isArray(loginA.headers['set-cookie'])
        ? loginA.headers['set-cookie']
        : [loginA.headers['set-cookie']].filter(Boolean);

      const { accessToken: accessTokenValueA } =
        extractTokensFromCookies(setCookieHeaderA);
      userA = { email: emailA, accessToken: accessTokenValueA };

      // Регистрация и логин UserB
      const emailB = `userB-${Date.now()}@example.com`;
      await request(ctx.app.getHttpServer())
        .post('/users')
        .send({
          email: emailB,
          username: `userB_${Date.now()}`,
          password: 'password12345',
        })
        .expect(201);

      const loginB = await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({ email: emailB, password: 'password12345' })
        .expect(200);

      const setCookieHeaderB = Array.isArray(loginB.headers['set-cookie'])
        ? loginB.headers['set-cookie']
        : [loginB.headers['set-cookie']].filter(Boolean);

      const { accessToken: accessTokenValueB } =
        extractTokensFromCookies(setCookieHeaderB);
      userB = { email: emailB, accessToken: accessTokenValueB };

      // UserA создаёт article
      const createRes = await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${userA.accessToken}`)
        .send({
          title: 'UserA Article',
          content: 'Owned by A content',
          isPublic: true,
        })
        .expect(201);
      articleId = createRes.body.id;
    });

    it('UserB cannot update another user article', async () => {
      await request(ctx.app.getHttpServer())
        .patch(`/articles/${articleId}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${userB.accessToken}`)
        .send({ title: 'Hacked' })
        .expect(403);
    });

    it('UserB cannot delete another user article', async () => {
      await request(ctx.app.getHttpServer())
        .delete(`/articles/${articleId}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${userB.accessToken}`)
        .expect(403);
    });
  });
});
