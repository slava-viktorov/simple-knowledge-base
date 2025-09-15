import * as request from 'supertest';
import { initTestContext, resetData, shutdownTestContext } from './setup';
import { createUser, login } from './utils/helpers';

const ACCESS_TOKEN_NAME = process.env.JWT_ACCESS_TOKEN_NAME || 'accessToken';

describe('Role System Integration (e2e)', () => {
  let ctx: Awaited<ReturnType<typeof initTestContext>>;
  let adminUser: { id: string; email: string; accessToken: string };
  let authorUser: { id: string; email: string; accessToken: string };

  beforeAll(async () => {
    ctx = await initTestContext();
  });

  afterAll(async () => {
    await shutdownTestContext(ctx);
  });

  beforeEach(async () => {
    await resetData(ctx.db);
    // админ и автор создаются в setup и сохраняются между тестами
    adminUser = ctx.admin;
    authorUser = ctx.author;
  });

  describe('User Creation with Roles', () => {
    it('should allow anyone to create AUTHOR user', async () => {
      const newAuthorEmail = `new-author-${Date.now()}@example.com`;

      await request(ctx.app.getHttpServer())
        .post('/users')
        .send({
          email: newAuthorEmail,
          username: `new_author_${Date.now()}`,
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', newAuthorEmail);
        });
    });

    it('should allow ADMIN to create other ADMIN user', async () => {
      const newAdminEmail = `new-admin-${Date.now()}@example.com`;

      await request(ctx.app.getHttpServer())
        .post('/users')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${adminUser.accessToken}`)
        .send({
          email: newAdminEmail,
          username: `new_admin_${Date.now()}`,
          password: 'password123',
          roleId: '550e8400-e29b-41d4-a716-446655440002',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', newAdminEmail);
        });
    });

    it('should prevent AUTHOR from creating ADMIN user', async () => {
      const newAdminEmail = `forbidden-admin-${Date.now()}@example.com`;

      await request(ctx.app.getHttpServer())
        .post('/users')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authorUser.accessToken}`)
        .send({
          email: newAdminEmail,
          username: `forbidden_admin_${Date.now()}`,
          password: 'password123',
          roleId: '550e8400-e29b-41d4-a716-446655440002',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('Forbidden');
        });
    });

    it('should prevent unauthenticated user from creating ADMIN user', async () => {
      const newAdminEmail = `unauth-admin-${Date.now()}@example.com`;

      await request(ctx.app.getHttpServer())
        .post('/users')
        .send({
          email: newAdminEmail,
          username: `unauth_admin_${Date.now()}`,
          password: 'password123',
          roleId: '550e8400-e29b-41d4-a716-446655440002',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('Forbidden');
        });
    });
  });

  describe('User Editing with Roles', () => {
    let testUser: { id: string; email: string };

    beforeEach(async () => {
      // Создаем тестового пользователя
      const testEmail = `test-user-${Date.now()}@example.com`;
      const createRes = await createUser(ctx.app, {
        email: testEmail,
        username: `test_user_${Date.now()}`,
        password: 'password123',
      }).expect(201);

      testUser = { id: createRes.body.id, email: testEmail };
    });

    it('should allow user to edit their own profile (except email and role)', async () => {
      // логинимся под testUser, чтобы редактировать самого себя
      const loginRes = await login(ctx.app, {
        email: testUser.email,
        password: 'password123',
      }).expect(200);
      const cookies = Array.isArray(loginRes.headers['set-cookie'])
        ? loginRes.headers['set-cookie']
        : [loginRes.headers['set-cookie']].filter(Boolean);
      const token = cookies
        .find((c: string) => c.startsWith(`${ACCESS_TOKEN_NAME}=`))
        ?.split('=')[1]
        .split(';')[0];

      await request(ctx.app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${token}`)
        .send({ username: 'updated_username' })
        .expect(200)
        .expect((res) => {
          expect(res.body.username).toBe('updated_username');
        });
    });

    it('should prevent user from editing their own email', async () => {
      await request(ctx.app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authorUser.accessToken}`)
        .send({
          email: 'newemail@example.com',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain(
            'You can only edit your own profile',
          );
        });
    });

    it('should prevent user from editing their own role', async () => {
      await request(ctx.app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authorUser.accessToken}`)
        .send({
          roleId: '550e8400-e29b-41d4-a716-446655440002',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain(
            'You can only edit your own profile',
          );
        });
    });

    it('should prevent user from editing other users', async () => {
      const otherUserEmail = `other-user-${Date.now()}@example.com`;
      const otherUserRes = await request(ctx.app.getHttpServer())
        .post('/users')
        .send({
          email: otherUserEmail,
          username: `other_user_${Date.now()}`,
          password: 'password123',
        })
        .expect(201);

      await request(ctx.app.getHttpServer())
        .patch(`/users/${otherUserRes.body.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authorUser.accessToken}`)
        .send({
          username: 'hacked_username',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain(
            'You can only edit your own profile',
          );
        });
    });

    it('should allow ADMIN to edit any user including email and role', async () => {
      await request(ctx.app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${adminUser.accessToken}`)
        .send({
          username: 'admin_updated_username',
          email: 'admin_updated@example.com',
          roleId: '550e8400-e29b-41d4-a716-446655440002',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.username).toBe('admin_updated_username');
          expect(res.body.email).toBe('admin_updated@example.com');
        });
    });
  });

  describe('Article Access Control with Roles', () => {
    let adminArticle: { id: string };
    let authorArticle: { id: string };

    beforeEach(async () => {
      // ADMIN создает статью
      const adminArticleRes = await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${adminUser.accessToken}`)
        .send({
          title: 'Admin Article',
          content: 'Content by admin',
          isPublic: false,
        })
        .expect(201);
      adminArticle = { id: adminArticleRes.body.id };

      // AUTHOR создает статью
      const authorArticleRes = await request(ctx.app.getHttpServer())
        .post('/articles')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authorUser.accessToken}`)
        .send({
          title: 'Author Article',
          content: 'Content by author',
          isPublic: true,
        })
        .expect(201);
      authorArticle = { id: authorArticleRes.body.id };
    });

    it('should allow ADMIN to edit any article', async () => {
      await request(ctx.app.getHttpServer())
        .patch(`/articles/${authorArticle.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${adminUser.accessToken}`)
        .send({
          title: 'Admin edited author article',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Admin edited author article');
        });
    });

    it('should allow ADMIN to delete any article', async () => {
      await request(ctx.app.getHttpServer())
        .delete(`/articles/${authorArticle.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${adminUser.accessToken}`)
        .expect(200);
    });

    it('should allow AUTHOR to edit their own article', async () => {
      await request(ctx.app.getHttpServer())
        .patch(`/articles/${authorArticle.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authorUser.accessToken}`)
        .send({
          title: 'Author edited their own article',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Author edited their own article');
        });
    });

    it('should prevent AUTHOR from editing other users articles', async () => {
      await request(ctx.app.getHttpServer())
        .patch(`/articles/${adminArticle.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authorUser.accessToken}`)
        .send({
          title: 'Author tried to edit admin article',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('Forbidden');
        });
    });

    it('should prevent AUTHOR from deleting other users articles', async () => {
      await request(ctx.app.getHttpServer())
        .delete(`/articles/${adminArticle.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authorUser.accessToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('Forbidden');
        });
    });
  });

  describe('User Deletion with Roles', () => {
    let testUser: { id: string };

    beforeEach(async () => {
      const testEmail = `delete-test-${Date.now()}@example.com`;
      const createRes = await request(ctx.app.getHttpServer())
        .post('/users')
        .send({
          email: testEmail,
          username: `delete_test_${Date.now()}`,
          password: 'password123',
        })
        .expect(201);

      testUser = { id: createRes.body.id };
    });

    it('should allow ADMIN to delete any user', async () => {
      await request(ctx.app.getHttpServer())
        .delete(`/users/${testUser.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${adminUser.accessToken}`)
        .expect(200);
    });

    it('should prevent AUTHOR from deleting any user', async () => {
      await request(ctx.app.getHttpServer())
        .delete(`/users/${testUser.id}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${authorUser.accessToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('Forbidden');
        });
    });

    it('should prevent unauthenticated user from deleting any user', async () => {
      await request(ctx.app.getHttpServer())
        .delete(`/users/${testUser.id}`)
        .expect(401);
    });
  });
});
