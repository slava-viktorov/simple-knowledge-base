import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { ArticlesService } from '../articles/articles.service';
import { TagsService } from '../tags/tags.service';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { generateTestData } from './fake-data-generator';
import { INestApplicationContext } from '@nestjs/common';

interface AppServices {
  app: INestApplicationContext;
  usersService: UsersService;
  articlesService: ArticlesService;
  tagsService: TagsService;
}

async function getAppAndServices(): Promise<AppServices> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const articlesService = app.get(ArticlesService);
  const tagsService = app.get(TagsService);
  return { app, usersService, articlesService, tagsService };
}

async function seedData(): Promise<void> {
  const logger = new Logger('SeedData');
  let app: INestApplicationContext | undefined;

  try {
    const services = await getAppAndServices();
    app = services.app;
    const { usersService, articlesService, tagsService } = services;

    logger.log('Добавляем тестовые данные...');

    const testData = generateTestData();

    logger.log('Создаем пользователей...');
    const users = await Promise.all(
      testData.users.map(async (userData) => {
        const passwordHash = await bcrypt.hash(userData.password, 10);
        const user = await usersService.create({
          email: userData.email,
          username: userData.username,
          passwordHash,
          source: 'seed',
          // roleId не указан - будет назначена роль author автоматически
        });
        return user;
      }),
    );
    logger.log(`Создано ${users.length} пользователей`);

    // Создаем теги
    logger.log('Создаем теги...');
    const tagNames = [
      'javascript',
      'typescript',
      'react',
      'vue',
      'angular',
      'nodejs',
      'express',
      'nestjs',
      'mongodb',
      'postgresql',
      'tutorial',
      'guide',
      'tips',
      'news',
      'review',
      'frontend',
      'backend',
      'fullstack',
      'devops',
      'testing',
    ];

    const tags = await Promise.all(
      tagNames.map(async (tagName) => {
        try {
          return await tagsService.create({
            name: tagName,
            description: `Articles about ${tagName}`,
          });
        } catch {
          // Если тег уже существует, получаем его
          return await tagsService.findByName(tagName);
        }
      }),
    );
    logger.log(`Создано/найдено ${tags.length} тегов`);

    logger.log('Создаем статьи...');
    const allArticles = [...testData.articles];

    const articles = await Promise.all(
      allArticles.map(async (articleData) => {
        const randomUser = users[Math.floor(Math.random() * users.length)];

        // Случайно выбираем 1-4 тега для статьи
        const randomTags = faker.helpers.arrayElements(tags, {
          min: 1,
          max: 4,
        });
        const tagNames = randomTags
          .map((tag) => tag?.name)
          .filter((name): name is string => Boolean(name));

        return articlesService.create(
          {
            title: articleData.title,
            content: articleData.content,
            isPublic: articleData.isPublic,
            tagNames: tagNames,
          },
          randomUser,
        );
      }),
    );
    logger.log(`Создано ${articles.length} статей`);

    logger.log('Тестовые данные успешно добавлены!');
    logger.log(
      `Итого: ${users.length} пользователей, ${tags.length} тегов, ${articles.length} статей`,
    );
    logger.log(`   - Случайных статей: ${testData.articles.length}`);
    logger.log(`   - Тегов: ${tags.length}`);
  } catch (err) {
    const message = (err as Error).message;
    console.error('Ошибка при добавлении тестовых данных:', message);
    process.exit(1);
  } finally {
    if (app) await app.close();
  }
}

// CLI запуск
if (require.main === module) {
  void seedData();
}

export { seedData };
