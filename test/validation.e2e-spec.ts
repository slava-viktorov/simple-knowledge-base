import * as request from 'supertest';
import { initTestContext, resetData, shutdownTestContext } from './setup';
import { createUser, login } from './utils/helpers';
import { extractTokensFromCookies, ACCESS_TOKEN_NAME } from './utils/cookies';

describe('Data Validation (e2e)', () => {
  let ctx: Awaited<ReturnType<typeof initTestContext>>;
  let authenticatedUser: { id: string; email: string; accessToken: string };

  beforeAll(async () => {
    ctx = await initTestContext();
  });

  afterAll(async () => {
    await shutdownTestContext(ctx);
  });

  beforeEach(async () => {
    await resetData(ctx.db);

    const userEmail = `user-${Date.now()}@example.com`;
    const createRes = await createUser(ctx.app, {
      email: userEmail,
      username: `test_user_${Date.now()}`,
      password: 'password12345',
    }).expect(201);

    const loginRes = await login(ctx.app, {
      email: userEmail,
      password: 'password12345',
    }).expect(200);

    const cookies = Array.isArray(loginRes.headers['set-cookie'])
      ? loginRes.headers['set-cookie']
      : [loginRes.headers['set-cookie']].filter(Boolean);
    const { accessToken } = extractTokensFromCookies(cookies);
    authenticatedUser = {
      id: createRes.body.id,
      email: userEmail,
      accessToken,
    };
  });

  afterEach(async () => {});

  describe('User Registration Validation', () => {
    it('should validate required fields for user creation', async () => {
      await request(ctx.app.getHttpServer())
        .post('/users')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email should not be empty');
          expect(res.body.message).toContain('username should not be empty');
          expect(res.body.message).toContain('password should not be empty');
        });
    });

    it('should validate email format', async () => {
      await request(ctx.app.getHttpServer())
        .post('/users')
        .send({
          email: 'invalid-email',
          username: 'testuser',
          password: 'password123',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email must be an email');
        });
    });

    it('should validate username length', async () => {
      await request(ctx.app.getHttpServer())
        .post('/users')
        .send({
          email: 'test@example.com',
          username: 'ab',
          password: 'password123',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'username must be longer than or equal to 3 characters',
          );
        });
    });

    it('should validate password length', async () => {
      await request(ctx.app.getHttpServer())
        .post('/users')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: '123',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'password must be longer than or equal to 8 characters',
          );
        });
    });

    it('should validate UUID format for roleId', async () => {
      await request(ctx.app.getHttpServer())
        .post('/users')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
          roleId: 'invalid-uuid',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('roleId must be a UUID');
        });
    });

    it('should accept valid user data', async () => {
      await request(ctx.app.getHttpServer())
        .post('/users')
        .send({
          email: 'valid@example.com',
          username: 'validuser',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('valid@example.com');
          expect(res.body.username).toBe('validuser');
        });
    });
  });

  describe('Article Creation Validation', () => {
    it('should validate required fields for article creation', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('title should not be empty');
          expect(res.body.message).toContain('content should not be empty');
        });
    });

    it('should validate title length', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'ab',
          content: 'Valid content',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'title must be longer than or equal to 3 characters',
          );
        });
    });

    it('should validate content length', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'Valid title',
          content: 'ab',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'content must be longer than or equal to 10 characters',
          );
        });
    });

    it('should validate isPublic field type', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'Valid title',
          content: 'Valid content',
          isPublic: 'not-a-boolean',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'isPublic must be a boolean value',
          );
        });
    });

    it('should validate tagNames array format', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'Valid title',
          content: 'Valid content',
          tagNames: 'not-an-array',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('tagNames must be an array');
        });
    });

    it('should validate tagNames array elements', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'Valid title',
          content: 'Valid content',
          tagNames: [123, 'valid-tag', null],
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'each value in tagNames must be a string',
          );
        });
    });

    it('should accept valid article data', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'Valid Article Title',
          content: 'This is valid article content',
          isPublic: true,
          tagNames: ['JavaScript', 'TypeScript'],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe('Valid Article Title');
          expect(res.body.isPublic).toBe(true);
          expect(res.body.tags).toHaveLength(2);
        });
    });
  });

  describe('Tag Creation Validation', () => {
    it('should validate required fields for tag creation', async () => {
      await request(ctx.app.getHttpServer())
        .post('/tags')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('name should not be empty');
        });
    });

    it('should validate tag name length', async () => {
      await request(ctx.app.getHttpServer())
        .post('/tags')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          name: 'a',
          description: 'Valid description',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'name must be longer than or equal to 2 characters',
          );
        });
    });

    it('should validate tag name maximum length', async () => {
      const longName = 'a'.repeat(101);
      await request(ctx.app.getHttpServer())
        .post('/tags')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          name: longName,
          description: 'Valid description',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'name must be shorter than or equal to 100 characters',
          );
        });
    });

    it('should validate description maximum length', async () => {
      const longDescription = 'a'.repeat(201);
      await request(ctx.app.getHttpServer())
        .post('/tags')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          name: 'ValidTag',
          description: longDescription,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'description must be shorter than or equal to 200 characters',
          );
        });
    });
  });

  describe('Pagination Validation', () => {
    beforeEach(async () => {
      // Создаем несколько статей для тестирования пагинации
      for (let i = 1; i <= 5; i++) {
        await request(ctx.app.getHttpServer())
          .post('/articles')
          .set(
            'Cookie',
            `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`,
          )
          .send({
            title: `Article ${i}`,
            content: `Content for article ${i}`,
            isPublic: true,
          })
          .expect(201);
      }
    });

    it('should validate page parameter', async () => {
      await request(ctx.app.getHttpServer())
        .get('/articles?page=invalid')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('page must be a number');
        });
    });

    it('should validate limit parameter', async () => {
      await request(ctx.app.getHttpServer())
        .get('/articles?limit=invalid')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('limit must be a number');
        });
    });

    it('should validate page minimum value', async () => {
      await request(ctx.app.getHttpServer())
        .get('/articles?page=0')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('page must not be less than 1');
        });
    });

    it('should validate limit minimum value', async () => {
      await request(ctx.app.getHttpServer())
        .get('/articles?limit=0')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('limit must not be less than 1');
        });
    });

    it('should validate limit maximum value', async () => {
      await request(ctx.app.getHttpServer())
        .get('/articles?limit=101')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'limit must not be greater than 100',
          );
        });
    });

    it('should accept valid pagination parameters', async () => {
      await request(ctx.app.getHttpServer())
        .get('/articles?page=1&limit=3')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('count');
          expect(res.body.data).toHaveLength(3);
          expect(res.body.count).toBe(5);
        });
    });
  });

  describe('User Update Validation', () => {
    it('should validate email format in user updates', async () => {
      await request(ctx.app.getHttpServer())
        .patch(`/users/${authenticatedUser.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          email: 'invalid-email',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email must be an email');
        });
    });

    it('should validate username length in user updates', async () => {
      await request(ctx.app.getHttpServer())
        .patch(`/users/${authenticatedUser.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          username: 'ab',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'username must be longer than or equal to 3 characters',
          );
        });
    });

    it('should validate password length in user updates', async () => {
      await request(ctx.app.getHttpServer())
        .patch(`/users/${authenticatedUser.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          password: '123',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'password must be longer than or equal to 8 characters',
          );
        });
    });

    it('should validate UUID format for roleId in user updates', async () => {
      await request(ctx.app.getHttpServer())
        .patch(`/users/${authenticatedUser.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          roleId: 'invalid-uuid',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('roleId must be a UUID');
        });
    });
  });

  describe('Authentication Validation', () => {
    it('should validate login credentials', async () => {
      await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email should not be empty');
          expect(res.body.message).toContain('password should not be empty');
        });
    });

    it('should validate email format in login', async () => {
      await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email must be an email');
        });
    });

    it('should validate password length in login', async () => {
      await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: '123',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'password must be longer than or equal to 8 characters',
          );
        });
    });
  });

  describe('Edge Cases and Boundary Testing', () => {
    it('should handle extremely long strings', async () => {
      const longString = 'a'.repeat(10000);

      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: longString,
          content: longString,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'title must be shorter than or equal to 255 characters',
          );
        });
    });

    it('should handle special characters in input', async () => {
      await request(ctx.app.getHttpServer())
        .post('/users')
        .send({
          email: 'test@example.com',
          username: 'user@#$%^&*()',
          password: 'password123',
        })
        .expect(201); // Специальные символы в username должны быть разрешены
    });

    it('should handle unicode characters', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'Статья на русском языке 🚀',
          content: 'Содержание статьи с эмодзи и специальными символами: @#$%',
          isPublic: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe('Статья на русском языке 🚀');
        });
    });

    it('should handle empty arrays in tagNames', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'Article without tags',
          content: 'Content without tags',
          isPublic: true,
          tagNames: [],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.tags).toHaveLength(0);
        });
    });

    it('should handle null and undefined values', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'Article',
          content: 'Valid content long enough',
          isPublic: 'public',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'isPublic must be a boolean value',
          );
        });
    });
  });
});
