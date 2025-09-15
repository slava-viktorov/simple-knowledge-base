# Simple Knowledge Base

Простое API приложения "База знаний"

## Технологии

### Backend
- **NestJS** - фреймворк для создания серверных приложений
- **TypeORM** - ORM для работы с базой данных
- **PostgreSQL** - база данных
- **JWT** - аутентификация
- **Passport** - стратегии аутентификации
- **Swagger** - документация API

## Как запустить

### Предварительные требования

- Docker и Docker Compose
- Node.js 18+
- Опционально Make (для использования Makefile команд)

### Переменные окружения

Создайте файл `.env` в корневой директории или используйте `.env.local`(используется по умолчанию) для теста:

### Процесс запуска
```bash
# Запуск в режиме разработки(.env.local)
make up
# Инициализация базы
make migration-run
# Загрузка тестовых данных в базу (fakerjs)
make seed
# Остановка
make down
```
API доступно по адресу http://localhost:3000
Документация Swagger по адресу http://localhost:3000/docs
### Остановка
```bash
# Удаление тестовых данных из базы (если нужно)
make reset
# Остановка
make down
```
### Запуск
Если в вашей системе не установлен make, то используйте docker compose напрямую
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.local up --build
docker compose exec backend npm run migration:run
docker compose exec backend npm run seed
```
### Остановка
Если в вашей системе не установлен make, то используйте docker compose напрямую
```bash
docker compose down
```

### Запуск в Linux
Для запуска нужен make

#### Разработка
```bash
# Запуск в режиме разработки
make up

# Остановка
make down
```

#### Продакшн
```bash
# Запуск в продакшн режиме
make prod ENV_FILE=.env.production

# Просмотр логов
make prod-logs
```

#### Тестирование
e2e тесты используют отдельную тестовую базу
```bash
# Unit тесты
make test-unit

# E2E тесты
make test-e2e
```

### Docker команды

#### Основные команды
```bash
# Запуск
docker compose up --build

# Остановка
docker compose down

# Просмотр логов
docker compose logs -f
```

#### База данных
```bash
# Подключение к базе данных
make db-shell

# Миграции
make migration-run
make migration-generate
make migration-revert
```

#### Разработка
```bash
# Линтинг
make lint

# Форматирование
make format

# Сборка
make build

# Запуск в режиме разработки
make up
```

## API Endpoints

После запуска API будет доступен по адресу: `http://localhost:3000`

### Документация API
- Swagger UI: `http://localhost:3000/api/docs`


### Функциональность
- Аутентификация пользователей
- CRUD операции с сущностями
- Пагинация
- Обработка ошибок


## Структура базы данных

### Основные таблицы
- `users` - пользователи системы
- `articles` - статьи
- `tag` - статьи
- `refresh_tokens` - токены обновления

## Разработка

### Добавление новых миграций
```bash
make migration-generate
```

### Запуск тестов
```bash

# Unit тесты
make backend-test-unit

# E2E тесты
make backend-test-e2e
```


## Безопасность

- JWT токены для аутентификации
- Хеширование паролей с bcrypt
- Валидация входных данных
- CORS настройки
- Helmet для безопасности заголовков

## Лицензия

UNLICENSED
