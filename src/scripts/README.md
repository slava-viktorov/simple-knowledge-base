# Генератор тестовых данных

Этот модуль содержит функции для генерации тестовых данных, включая пользователей с ролями и статьи.

## Функции

### `generateFakeUsers(count, roles?)`
Генерирует пользователей со случайными ролями.

**Параметры:**
- `count` - количество пользователей для генерации
- `roles` - массив ролей для случайного выбора (опционально)

**Пример:**
```typescript
const roles = await rolesService.findAll();
const users = generateFakeUsers(10, roles);
```

### `generateFakeUsersWithRole(count, role)`
Генерирует пользователей с определенной ролью.

**Параметры:**
- `count` - количество пользователей
- `role` - роль для назначения всем пользователям

**Пример:**
```typescript
const adminRole = await rolesService.findAdminRole();
const adminUsers = generateFakeUsersWithRole(3, adminRole);
```

### `generateFakeUsersWithSpecificRoles(count, roles, roleDistribution?)`
Генерирует пользователей с заданным распределением ролей.

**Параметры:**
- `count` - общее количество пользователей (используется только если roleDistribution не задан)
- `roles` - массив доступных ролей
- `roleDistribution` - объект с распределением ролей { roleName: count }

**Пример:**
```typescript
const roles = await rolesService.findAll();
const roleDistribution = {
  'author': 5,
  'admin': 2
};
const users = generateFakeUsersWithSpecificRoles(0, roles, roleDistribution);
```

### `generateFakeUsersWithRole(count, role)`
Генерирует пользователей с определенной ролью.

**Параметры:**
- `count` - количество пользователей
- `role` - роль для назначения всем пользователям

**Пример:**
```typescript
const authorRole = await rolesService.findAuthorRole();
const authorUsers = generateFakeUsersWithRole(10, authorRole);
```

### `generateTypedArticles(count)`
Генерирует тестовые статьи.

**Параметры:**
- `count` - количество статей для генерации

**Пример:**
```typescript
const articles = generateTypedArticles(15);
```

### `generateTestData(roles?)`
Генерирует полный набор тестовых данных (пользователи + статьи).

**Параметры:**
- `roles` - массив ролей для назначения пользователям (опционально)

**Пример:**
```typescript
const roles = await rolesService.findAll();
const testData = generateTestData(roles);
```

## Примеры использования

### В тестах
```typescript
import { generateFakeUsers, generateFakeUsersWithRole } from './fake-data-generator';
import { RolesService } from '../roles/roles.service';

describe('User Tests', () => {
  let rolesService: RolesService;
  let adminRole: Role;

  beforeEach(async () => {
    rolesService = new RolesService(/* ... */);
    adminRole = await rolesService.findAdminRole();
  });

  it('should create admin users', async () => {
    const adminUsers = generateFakeUsersWithRole(3, adminRole);
    // Тестируем создание администраторов
  });
});
```

### В seed скриптах
```typescript
import { generateFakeUsersWithSpecificRoles } from './fake-data-generator';

async function seedDatabase() {
  const roles = await rolesService.findAll();
  
  // Создаем 10 авторов и 2 администратора
  const users = generateFakeUsersWithSpecificRoles(0, roles, {
    'author': 10,
    'admin': 2
  });
  
  for (const user of users) {
    await usersService.create(user);
  }
}
```

### Для публичной регистрации
```typescript
// Генерируем пользователей без ролей (для публичной регистрации)
const users = generateFakeUsers(5); // roleId будет undefined
```

## Структура данных

### CreateUserDto
```typescript
{
  email: string;
  username: string;
  password: string;
  roleId?: string; // ID роли (опционально)
}
```

### CreateArticleDto
```typescript
{
  title: string;
  content: string;
}
```

### TestData
```typescript
{
  users: CreateUserDto[];
  articles: CreateArticleDto[];
}
```

## Зависимости

- `@faker-js/faker` - для генерации случайных данных
- `../roles/entities/role.entity` - для типизации ролей
- `../users/dto/create-user.dto` - для типизации пользователей
- `../articles/dto/create-article.dto` - для типизации статей

## Примечания

- Все функции генерируют валидные данные согласно DTO
- Пароли генерируются длиной 8 символов
- Email и username генерируются с помощью faker.js
- Роли назначаются случайно из переданного массива
- Если роли не переданы, пользователи создаются без roleId
