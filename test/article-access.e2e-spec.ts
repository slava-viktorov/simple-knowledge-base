import * as request from 'supertest';
import { initTestContext, resetData, shutdownTestContext } from './setup';
import { createUser, login } from './utils/helpers';

const ACCESS_TOKEN_NAME = process.env.JWT_ACCESS_TOKEN_NAME || 'accessToken';

describe('Article Access Control (e2e)', () => {
  let ctx: Awaited<ReturnType<typeof initTestContext>>;
  let authenticatedUser: { id: string; email: string; accessToken: string };
  let publicArticle: { id: string };
  let privateArticle: { id: string };

  beforeAll(async () => {
    ctx = await initTestContext();
  });

  afterAll(async () => {
    await shutdownTestContext(ctx);
  });

  beforeEach(async () => {
    await resetData(ctx.db);

    // Создание аутентифицированного пользователя
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
    const { accessToken } = (function (setCookieHeader: string[] | undefined) {
      let token = '';
      if (Array.isArray(setCookieHeader)) {
        for (const cookieStr of setCookieHeader) {
          const m = cookieStr.match(new RegExp(`${ACCESS_TOKEN_NAME}=([^;]+)`));
          if (m) token = m[1];
        }
      }
      return { accessToken: token };
    })(cookies);
    authenticatedUser = {
      id: createRes.body.id,
      email: userEmail,
      accessToken,
    };

    // Создание публичной статьи
    const publicArticleRes = await request(ctx.app.getHttpServer())
      .post('/articles')
      .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessToken}`)
      .send({
        title: 'Public Article',
        content: 'This is a public article',
        isPublic: true,
      })
      .expect(201);
    publicArticle = { id: publicArticleRes.body.id };

    // Создание приватной статьи
    const privateArticleRes = await request(ctx.app.getHttpServer())
      .post('/articles')
      .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessToken}`)
      .send({
        title: 'Private Article',
        content: 'This is a private article',
        isPublic: false,
      })
      .expect(201);
    privateArticle = { id: privateArticleRes.body.id };
  });

  describe('Public Article Access', () => {
    it('should allow anonymous access to public articles', async () => {
      await request(ctx.app.getHttpServer())
        .get(`/articles/${publicArticle.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', publicArticle.id);
          expect(res.body).toHaveProperty('title', 'Public Article');
          expect(res.body).toHaveProperty('isPublic', true);
        });
    });

    it('should allow authenticated access to public articles', async () => {
      await request(ctx.app.getHttpServer())
        .get(`/articles/${publicArticle.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', publicArticle.id);
          expect(res.body).toHaveProperty('title', 'Public Article');
          expect(res.body).toHaveProperty('isPublic', true);
        });
    });

    it('should include public articles in articles list for anonymous users', async () => {
      await request(ctx.app.getHttpServer())
        .get('/articles')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('count');
          expect(Array.isArray(res.body.data)).toBe(true);

          // Должна быть только публичная статья
          const publicArticles = res.body.data.filter(
            (article: any) => article.isPublic,
          );
          expect(publicArticles).toHaveLength(1);
          expect(publicArticles[0].id).toBe(publicArticle.id);
        });
    });

    it('should include both public and private articles in articles list for authenticated users', async () => {
      await request(ctx.app.getHttpServer())
        .get('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('count');
          expect(Array.isArray(res.body.data)).toBe(true);

          // Должны быть обе статьи
          expect(res.body.data).toHaveLength(2);
          const articleIds = res.body.data.map((article: any) => article.id);
          expect(articleIds).toContain(publicArticle.id);
          expect(articleIds).toContain(privateArticle.id);
        });
    });
  });

  describe('Private Article Access', () => {
    it('should deny anonymous access to private articles', async () => {
      await request(ctx.app.getHttpServer())
        .get(`/articles/${privateArticle.id}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain(
            'Authentication required to access private articles',
          );
        });
    });

    it('should allow authenticated access to private articles', async () => {
      await request(ctx.app.getHttpServer())
        .get(`/articles/${privateArticle.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', privateArticle.id);
          expect(res.body).toHaveProperty('title', 'Private Article');
          expect(res.body).toHaveProperty('isPublic', false);
        });
    });

    it('should exclude private articles from articles list for anonymous users', async () => {
      await request(ctx.app.getHttpServer())
        .get('/articles')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('count');

          // Должна быть только публичная статья
          const publicArticles = res.body.data.filter(
            (article: any) => article.isPublic,
          );
          const privateArticles = res.body.data.filter(
            (article: any) => !article.isPublic,
          );
          expect(publicArticles).toHaveLength(1);
          expect(privateArticles).toHaveLength(0);
        });
    });
  });

  describe('Article Creation and Modification', () => {
    it('should allow authenticated users to create public articles', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'New Public Article',
          content: 'Content for new public article',
          isPublic: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title', 'New Public Article');
          expect(res.body).toHaveProperty('isPublic', true);
        });
    });

    it('should allow authenticated users to create private articles', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'New Private Article',
          content: 'Content for new private article',
          isPublic: false,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title', 'New Private Article');
          expect(res.body).toHaveProperty('isPublic', false);
        });
    });

    it('should prevent anonymous users from creating articles', async () => {
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .send({
          title: 'Anonymous Article',
          content: 'This should not be allowed',
          isPublic: true,
        })
        .expect(401);
    });

    it('should allow article owners to change article visibility', async () => {
      // Изменяем публичную статью на приватную
      await request(ctx.app.getHttpServer())
        .patch(`/articles/${publicArticle.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          isPublic: false,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('isPublic', false);
        });

      // Проверяем, что теперь статья недоступна анонимно
      await request(ctx.app.getHttpServer())
        .get(`/articles/${publicArticle.id}`)
        .expect(403);
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent article ID gracefully', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(ctx.app.getHttpServer())
        .get(`/articles/${nonExistentId}`)
        .expect(404);
    });

    it('should handle invalid article ID format', async () => {
      const invalidId = 'invalid-id-format';

      await request(ctx.app.getHttpServer())
        .get(`/articles/${invalidId}`)
        .expect(404);
    });

    it('should handle articles list with mixed visibility correctly', async () => {
      // Создаем еще одну публичную статью
      await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .send({
          title: 'Another Public Article',
          content: 'Another public content',
          isPublic: true,
        })
        .expect(201);

      // Анонимный пользователь должен видеть только публичные статьи
      await request(ctx.app.getHttpServer())
        .get('/articles')
        .expect(200)
        .expect((res) => {
          const publicArticles = res.body.data.filter(
            (article: any) => article.isPublic,
          );
          const privateArticles = res.body.data.filter(
            (article: any) => !article.isPublic,
          );
          expect(publicArticles).toHaveLength(2);
          expect(privateArticles).toHaveLength(0);
        });

      // Аутентифицированный пользователь должен видеть все статьи
      await request(ctx.app.getHttpServer())
        .get('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authenticatedUser.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(3);
        });
    });
  });
});
