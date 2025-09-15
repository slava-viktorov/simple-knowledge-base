import { faker } from '@faker-js/faker/locale/ru';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { CreateArticleDto } from '../articles/dto/create-article.dto';
import { Role } from '../roles/entities/role.entity';

export type TestData = Record<
  'users' | 'articles',
  CreateUserDto[] | CreateArticleDto[]
> & {
  users: CreateUserDto[];
  articles: CreateArticleDto[];
};

export function generateFakeUsers(
  count: number,
  roles?: Role[],
): CreateUserDto[] {
  return Array.from({ length: count }, () => {
    const user: CreateUserDto = {
      email: faker.internet.email(),
      username: faker.internet.username(),
      password: faker.internet.password({ length: 8 }),
    };

    // Если роли переданы, случайно назначаем роль
    if (roles && roles.length > 0) {
      const randomRole = faker.helpers.arrayElement(roles);
      user.roleId = randomRole.id;
    }

    return user;
  });
}

export function generateTypedArticles(
  count: number,
  publicRatio: number = 0.7,
): CreateArticleDto[] {
  const availableTags = [
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

  return Array.from({ length: count }, () => {
    // Случайно выбираем 1-4 тега для статьи
    const randomTags = faker.helpers.arrayElements(availableTags, {
      min: 1,
      max: 4,
    });

    return {
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(2),
      isPublic: faker.datatype.boolean(publicRatio), // 70% публичных по умолчанию
      tagNames: randomTags,
    };
  });
}

export function generateFakeUsersWithSpecificRoles(
  count: number,
  roles: Role[],
  roleDistribution?: { [roleName: string]: number },
): CreateUserDto[] {
  const users: CreateUserDto[] = [];

  if (roleDistribution) {
    Object.entries(roleDistribution).forEach(([roleName, userCount]) => {
      const role = roles.find((r) => r.name === roleName);
      if (role) {
        for (let i = 0; i < userCount; i++) {
          users.push({
            email: faker.internet.email(),
            username: faker.internet.username(),
            password: faker.internet.password({ length: 8 }),
            roleId: role.id,
          });
        }
      }
    });

    return users;
  }

  for (let i = 0; i < count; i++) {
    const randomRole = faker.helpers.arrayElement(roles);
    users.push({
      email: faker.internet.email(),
      username: faker.internet.username(),
      password: faker.internet.password({ length: 8 }),
      roleId: randomRole.id,
    });
  }

  return users;
}

export function generateFakeUsersWithRole(
  count: number,
  role: Role,
): CreateUserDto[] {
  return Array.from({ length: count }, () => ({
    email: faker.internet.email(),
    username: faker.internet.username(),
    password: faker.internet.password({ length: 8 }),
    roleId: role.id,
  }));
}

export function generateTestData(roles?: Role[]): TestData {
  return {
    users: generateFakeUsers(5, roles),
    articles: generateTypedArticles(15), // Используем функцию с поддержкой isPublic
  };
}
