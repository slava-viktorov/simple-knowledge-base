import * as request from 'supertest';
import { initTestContext, resetData, shutdownTestContext } from './setup';
import { extractTokensFromCookies, ACCESS_TOKEN_NAME } from './utils/cookies';

describe('Tags System Integration (e2e)', () => {
  let ctx: Awaited<ReturnType<typeof initTestContext>>;
  let authenticatedUser: { id: string; email: string; accessToken: string };
  let adminUser: { id: string; email: string; accessToken: string };

  beforeAll(async () => {
    ctx = await initTestContext();
  });

  afterAll(async () => {
    await shutdownTestContext(ctx);
  });

  beforeEach(async () => {
    await resetData(ctx.db);

    // обычный пользователь
    const userEmail = `user-${Date.now()}@example.com`;
    const createRes = await request(ctx.app.getHttpServer())
      .post('/users')
      .send({
        email: userEmail,
        username: `test_user_${Date.now()}`,
        password: 'password12345',
      })
      .expect(201);
    const userLogin = await request(ctx.app.getHttpServer())
      .post('/auth/login')
      .send({ email: userEmail, password: 'password12345' })
      .expect(200);
    const userCookies = Array.isArray(userLogin.headers['set-cookie'])
      ? userLogin.headers['set-cookie']
      : [userLogin.headers['set-cookie']].filter(Boolean);
    const { accessToken: userAccessToken } =
      extractTokensFromCookies(userCookies);
    authenticatedUser = {
      id: createRes.body.id,
      email: userEmail,
      accessToken: userAccessToken,
    };

    // админ
    adminUser = ctx.admin;
  });

  afterEach(async () => {});

  describe('Tag Management', () => {
    it('should allow admin to create tags', async () => {
      await request(ctx.app.getHttpServer())
        .post('/tags')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${adminUser.accessToken}`)
        .send({
          name: 'JavaScript',
          description: 'Programming language for web development',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name', 'javascript');
          expect(res.body).toHaveProperty(
            'description',
            'Programming language for web development',
          );
        });
    });

    it('should allow authenticated users to create tags', async () => {
      await request(ctx.app.getHttpServer())
        .post('/tags')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          name: 'TypeScript',
          description: 'Typed superset of JavaScript',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name', 'typescript');
          expect(res.body).toHaveProperty(
            'description',
            'Typed superset of JavaScript',
          );
        });
    });

    it('should prevent anonymous users from creating tags', async () => {
      await request(ctx.app.getHttpServer())
        .post('/tags')
        .send({
          name: 'Python',
          description: 'High-level programming language',
        })
        .expect(401);
    });

    it('should allow anyone to read tags', async () => {
      // Создаем тег через админа
      await request(ctx.app.getHttpServer())
        .post('/tags')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${adminUser.accessToken}`)
        .send({
          name: 'React',
          description: 'JavaScript library for building user interfaces',
        })
        .expect(201);

      // Проверяем, что обычный пользователь может читать теги
      await request(ctx.app.getHttpServer())
        .get('/tags')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].name).toBe('react');
        });

      // Проверяем, что анонимный пользователь может читать теги
      await request(ctx.app.getHttpServer())
        .get('/tags')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].name).toBe('react');
        });
    });

    it('should prevent duplicate tag names', async () => {
      // Создаем первый тег
      await request(ctx.app.getHttpServer())
        .post('/tags')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${adminUser.accessToken}`)
        .send({
          name: 'Node.js',
          description: 'JavaScript runtime',
        })
        .expect(201);

      // Попытка создать тег с тем же именем
      await request(ctx.app.getHttpServer())
        .post('/tags')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${adminUser.accessToken}`)
        .send({
          name: 'Node.js',
          description: 'Different description',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });
  });

  describe('Article-Tag Relationships', () => {
    const createdTags: { id: string; name: string }[] = [];

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    beforeEach(async () => {
      // Создаем несколько тегов
      const tagNames = ['JavaScript', 'TypeScript', 'React', 'Node.js'];
      for (const tagName of tagNames) {
        const tagRes = await request(ctx.app.getHttpServer())
          .post('/tags')
          .set('Cookie', `${ACCESS_TOKEN_NAME}=${adminUser.accessToken}`)
          .send({
            name: tagName,
            description: `Description for ${tagName}`,
          })
          .expect(201);

        createdTags.push({ id: tagRes.body.id, name: tagName });
      }
    });

    it('should allow creating articles with tags', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'Introduction to JavaScript',
          content: 'Learn the basics of JavaScript programming',
          isPublic: true,
          tagNames: ['JavaScript', 'React'],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('tags');
          expect(res.body.tags).toHaveLength(2);
          const names = res.body.tags.map((tag: any) => tag.name);
          expect(names).toContain('javascript');
          expect(names).toContain('react');
        });
    });

    it('should automatically create tags if they do not exist', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'Vue.js Tutorial',
          content: 'Learn Vue.js framework',
          isPublic: true,
          tagNames: ['Vue.js', 'Frontend', 'JavaScript'],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.tags).toHaveLength(3);
          const names = res.body.tags.map((tag: any) => tag.name);
          expect(names).toContain('vue.js');
          expect(names).toContain('frontend');
          expect(names).toContain('javascript');
        });

      // Проверяем, что новые теги были созданы
      await request(ctx.app.getHttpServer())
        .get('/tags')
        .expect(200)
        .expect((res) => {
          const tagNames = res.body.map((tag: any) => tag.name);
          expect(tagNames).toContain('vue.js');
          expect(tagNames).toContain('frontend');
        });
    });

    it('should allow filtering articles by tags', async () => {
      // Создаем статьи с разными тегами
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'JavaScript Basics',
          content: 'Learn JavaScript',
          isPublic: true,
          tagNames: ['JavaScript'],
        })
        .expect(201);

      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'TypeScript Advanced',
          content: 'Learn TypeScript',
          isPublic: true,
          tagNames: ['TypeScript'],
        })
        .expect(201);

      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'React with TypeScript',
          content: 'Learn React with TypeScript',
          isPublic: true,
          tagNames: ['react', 'typescript'],
        })
        .expect(201)
        .expect(async (res) => {
          const articleId = res.body?.id;
          expect(articleId).toBeDefined();
          const getRes = await request(ctx.app.getHttpServer())
            .get(`/articles/${articleId}`)
            .expect(200);
          const tagNames = (getRes.body?.tags || []).map((t: any) => t.name);
          expect(tagNames).toEqual(
            expect.arrayContaining(['react', 'typescript']),
          );
        });

      await request(ctx.app.getHttpServer())
        .get('/articles')
        .query({ tags: ['javascript'], limit: 50 })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
          expect(res.body.data[0].title).toBe('JavaScript Basics');
        });

      await request(ctx.app.getHttpServer())
        .get('/articles')
        .query({ tags: ['typescript'], limit: 50 })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(2);
          const titles = res.body.data.map((article: any) => article.title);
          expect(titles).toContain('TypeScript Advanced');
          expect(titles).toContain('React with TypeScript');
        });

      await request(ctx.app.getHttpServer())
        .get('/articles')
        .query({ tags: ['react'], limit: 50 })
        .expect(200)
        .expect((res) => {
          const titles = res.body.data.map((a: any) => a.title);
          expect(titles).toContain('React with TypeScript');
        });

      // Убеждаемся, что оба тега существуют в БД
      const tagsRes = await request(ctx.app.getHttpServer())
        .get('/tags')
        .expect(200);
      const names = (tagsRes.body as any[]).map((t) => t.name);
      expect(names).toEqual(expect.arrayContaining(['react', 'typescript']));

      let filterRes = await request(ctx.app.getHttpServer())
        .get('/articles')
        .query({ tags: ['react', 'typescript'], match: 'all', limit: 50 })
        .expect(200);
      if (
        !Array.isArray(filterRes.body?.data) ||
        filterRes.body.data.length === 0
      ) {
        await sleep(100);
        filterRes = await request(ctx.app.getHttpServer())
          .get('/articles')
          .query({ tags: ['react', 'typescript'], match: 'all', limit: 50 })
          .expect(200);
      }
      expect(filterRes.body.data).toHaveLength(1);
      expect(filterRes.body.data[0].title).toBe('React with TypeScript');
    });

    it('should handle case-insensitive tag filtering', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'JavaScript Article',
          content: 'Content long',
          isPublic: true,
          tagNames: ['JavaScript'],
        })
        .expect(201);

      // Поиск с разным регистром
      await request(ctx.app.getHttpServer())
        .get('/articles?tags=javascript')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
          expect(res.body.data[0].title).toBe('JavaScript Article');
        });
    });

    it('should return empty results for non-existent tags', async () => {
      await request(ctx.app.getHttpServer())
        .get('/articles?tags=NonExistentTag')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(0);
          expect(res.body.count).toBe(0);
        });
    });
  });

  describe('Tag Updates and Deletion', () => {
    let testTag: { id: string };

    beforeEach(async () => {
      const tagRes = await request(ctx.app.getHttpServer())
        .post('/tags')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${adminUser.accessToken}`)
        .send({
          name: 'Test Tag',
          description: 'Original description',
        })
        .expect(201);

      testTag = { id: tagRes.body.id };
    });

    it('should allow admin to update tags', async () => {
      await request(ctx.app.getHttpServer())
        .patch(`/tags/${testTag.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${adminUser.accessToken}`)
        .send({
          name: 'Updated Tag',
          description: 'Updated description',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Tag');
          expect(res.body.description).toBe('Updated description');
        });
    });

    it('should allow authenticated users to update tags', async () => {
      await request(ctx.app.getHttpServer())
        .patch(`/tags/${testTag.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          name: 'Hacked Tag',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Hacked Tag');
        });
    });

    it('should allow admin to delete tags', async () => {
      await request(ctx.app.getHttpServer())
        .delete(`/tags/${testTag.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${adminUser.accessToken}`)
        .expect(200);

      // Проверяем, что тег удален
      await request(ctx.app.getHttpServer())
        .get(`/tags/${testTag.id}`)
        .expect(404);
    });

    it('should prevent non-admin users from deleting tags', async () => {
      await request(ctx.app.getHttpServer())
        .delete(`/tags/${testTag.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .expect(403);
    });

    it('should handle tag deletion with associated articles', async () => {
      // Создаем статью с тегом
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'Article with Test Tag',
          content: 'Content long',
          isPublic: true,
          tagNames: ['Test Tag'],
        })
        .expect(201);

      // Удаляем тег
      await request(ctx.app.getHttpServer())
        .delete(`/tags/${testTag.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${adminUser.accessToken}`)
        .expect(200);

      // Проверяем, что статья все еще существует, но без тега
      await request(ctx.app.getHttpServer())
        .get('/articles')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
          expect(res.body.data[0].tags).toHaveLength(0);
        });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tag names array', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'Article without tags',
          content: 'Content long',
          isPublic: true,
          tagNames: [],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.tags).toHaveLength(0);
        });
    });

    it('should handle duplicate tags in tagNames array', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'Article with duplicate tags',
          content: 'Content long',
          isPublic: true,
          tagNames: ['JavaScript', 'JavaScript', 'React'],
        })
        .expect(201)
        .expect((res) => {
          // Должны быть только уникальные теги
          expect(res.body.tags).toHaveLength(2);
          const tagNames = res.body.tags.map((tag: any) => tag.name);
          expect(tagNames).toContain('javascript');
          expect(tagNames).toContain('react');
        });
    });

    it('should handle very long tag names gracefully', async () => {
      const longTagName = 'a'.repeat(1000);

      await request(ctx.app.getHttpServer())
        .post('/tags')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${adminUser.accessToken}`)
        .send({
          name: longTagName,
          description: 'Very long tag name',
        })
        .expect(400);
    });
  });
});
