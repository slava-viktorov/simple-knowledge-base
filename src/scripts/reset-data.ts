import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { ArticlesService } from '../articles/articles.service';
import { AuthService } from '../auth/auth.service';
import { TagsService } from '../tags/tags.service';
import { ArticleResponseDto } from '../articles/dto/article-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { INestApplicationContext } from '@nestjs/common';

interface AppServices {
  app: INestApplicationContext;
  usersService: UsersService;
  articlesService: ArticlesService;
  authService: AuthService;
  tagsService: TagsService;
}

// Хелпер для загрузки всех данных с пагинацией
async function loadAllPaginatedData<T>(
  fetchFunction: (
    page: number,
    limit: number,
  ) => Promise<PaginatedResponseDto<T>>,
  limit: number = 1000,
): Promise<T[]> {
  const allData: T[] = [];
  let page = 1;
  let hasMoreData = true;

  while (hasMoreData) {
    const response = await fetchFunction(page, limit);

    if (response.data.length === 0) {
      hasMoreData = false;
      break;
    }

    allData.push(...response.data);
    page += 1;
  }

  return allData;
}

async function getAppAndServices(): Promise<AppServices> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const articlesService = app.get(ArticlesService);
  const authService = app.get(AuthService);
  const tagsService = app.get(TagsService);
  return { app, usersService, articlesService, authService, tagsService };
}

export async function resetData(): Promise<void> {
  const logger = new Logger('ResetData');
  let app: INestApplicationContext | undefined;

  try {
    const services = await getAppAndServices();
    app = services.app;
    const { usersService, articlesService, tagsService } = services;

    logger.log('Удаляем все тестовые данные...');

    // Получаем пользователей с source = 'seed'
    const seedUsers = await usersService.findAllBySource('seed');
    logger.log(`Найдено ${seedUsers.length} пользователей с source = 'seed'`);

    let deletedArticles = 0;

    const articlesToDelete: ArticleResponseDto[] = [];

    for (const user of seedUsers) {
      const userArticles = await loadAllPaginatedData<ArticleResponseDto>(
        (page, limit) =>
          articlesService.findAllByAuthorId(user.id, { page, limit }),
      );
      articlesToDelete.push(...userArticles);
    }

    for (const article of articlesToDelete) {
      await articlesService.remove(article.id);
      deletedArticles += 1;
    }

    logger.log(`Удалено ${deletedArticles} элементов`);

    let deletedUsers = 0;
    for (const user of seedUsers) {
      const deleted = await usersService.deleteById(user.id);
      if (deleted > 0) {
        deletedUsers += 1;
      }
    }
    logger.log(`Удалено ${deletedUsers} пользователей`);

    // Удаляем теги, которые больше не используются
    logger.log('Удаляем неиспользуемые теги...');
    const allTags = await tagsService.findAll();
    let deletedTags = 0;

    for (const tag of allTags) {
      try {
        await tagsService.remove(tag.id);
        deletedTags += 1;
      } catch (error) {
        // Тег может быть защищен от удаления или уже удален
        const message = (error as Error).message;
        logger.warn(`Не удалось удалить тег ${tag.name}: ${message}`);
      }
    }

    logger.log(`Удалено ${deletedTags} тегов`);

    logger.log('Все тестовые данные успешно удалены!');
  } catch (error) {
    logger.error(
      'Ошибка при удалении тестовых данных:',
      (error as Error).message,
    );
    throw error;
  } finally {
    if (app) await app.close();
  }
}

// CLI запуск
if (require.main === module) {
  void resetData();
}
