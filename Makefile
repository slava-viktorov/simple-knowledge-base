# Makefile для управления docker compose и npm-скриптами
ENV_FILE ?= .env.local

include $(ENV_FILE)

export $(shell sed 's/=.*//' $(ENV_FILE))

up:
	docker compose --project-name $(PROJECT_NAME) -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.testdb.yml --env-file .env.local up --build

down:
	docker compose --project-name $(PROJECT_NAME) down

prod:
	docker compose --project-name $(PROJECT_NAME) -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up --build -d

prod-logs:
	docker compose --project-name $(PROJECT_NAME) logs -f

stop:
	docker compose --project-name $(PROJECT_NAME) stop

logs:
	docker compose --project-name $(PROJECT_NAME) logs -f

clean:
	docker compose --project-name $(PROJECT_NAME) down -v --remove-orphans

db-shell:
	docker compose --project-name $(PROJECT_NAME) exec db psql -U $$DB_USERNAME -d $$DB_DATABASE

# Миграции TypeORM
migration-init:
	@echo "Checking if containers are running..."
	@docker compose --project-name $(PROJECT_NAME) ps | grep -q "Up" || (echo "Containers are not running. Please run 'make up' first." && exit 1)
	@echo "Running migration init..."
	docker compose --project-name $(PROJECT_NAME) exec backend npm run migration:init

migration-run:
	@echo "Checking if containers are running..."
	@docker compose --project-name $(PROJECT_NAME) ps | grep -q "Up" || (echo "Containers are not running. Please run 'make up' first." && exit 1)
	@echo "Running migrations..."
	docker compose --project-name $(PROJECT_NAME) exec backend npm run migration:run

migration-revert:
	@echo "Checking if containers are running..."
	@docker compose --project-name $(PROJECT_NAME) ps | grep -q "Up" || (echo "Containers are not running. Please run 'make up' first." && exit 1)
	@echo "Reverting last migration..."
	docker compose --project-name $(PROJECT_NAME) exec backend npm run migration:revert

migration-generate:
	@echo "Checking if containers are running..."
	@docker compose --project-name $(PROJECT_NAME) ps | grep -q "Up" || (echo "Containers are not running. Please run 'make up' first." && exit 1)
	@echo "Generating migration..."
	docker compose --project-name $(PROJECT_NAME) exec backend npm run migration:generate

# NPM-скрипты
lint:
	docker compose --project-name $(PROJECT_NAME) exec backend npm run lint

format:
	docker compose --project-name $(PROJECT_NAME) exec backend npm run format

build:
	docker compose --project-name $(PROJECT_NAME) exec backend npm run build

start:
	docker compose --project-name $(PROJECT_NAME) exec backend npm run start

start-dev:
	docker compose --project-name $(PROJECT_NAME) exec backend npm run start:dev

test-unit:
	docker compose --project-name $(PROJECT_NAME) exec backend npm run test

test-e2e:
	docker compose --project-name $(PROJECT_NAME) exec backend npm run test:e2e

test-cov:
	docker compose --project-name $(PROJECT_NAME) exec backend npm run test:cov

# Seed и reset
seed:
	docker compose --project-name $(PROJECT_NAME) exec backend npm run seed

seed-reset:
	docker compose --project-name $(PROJECT_NAME) exec backend npm run seed:reset

# Мониторинг
health:
	curl -f http://localhost/api/v1/health || curl -f http://localhost:3000/api/v1/health

# Безопасность
security-headers:
	curl -I http://localhost/api/v1/health 
