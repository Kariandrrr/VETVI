# VETVI

Монорепозиторий для проекта VETVI - полнофункциональное веб-приложение с FastAPI бэкендом и React + TypeScript фронтендом.

## 🎯 Описание

VETVI - это монорепозиторий, содержащий бэкенд на FastAPI и фронтенд на React с TypeScript. Проект использует современные подходы к разработке, включая:
- Асинхронную работу с базой данных
- JWT аутентификацию с использованием RS256
- Модульную архитектуру с использованием Poetry
- Автоматическое тестирование
- Type-safe фронтенд с TypeScript
- Современный UI с Tailwind CSS

## 🛠 Технологический стек

### Backend
- **FastAPI** - современный веб-фреймворк для создания API
- **SQLAlchemy 2.0** - ORM для работы с базами данных
- **Alembic** - миграции базы данных
- **Pydantic** - валидация данных и настройки
- **PostgreSQL** - основная база данных (production)
- **SQLite** - база данных для тестирования
- **PyJWT** - JWT аутентификация с RS256
- **Pytest** - фреймворк для тестирования
- **Poetry** - управление зависимостями

### Frontend
- **React 18** - UI библиотека
- **TypeScript** - типизированный JavaScript
- **Vite** - сборщик и dev-сервер
- **Tailwind CSS** - utility-first CSS фреймворк
- **ESLint** - линтер для JavaScript/TypeScript

## 📁 Структура проекта

```
VETVI/
├── packages/
│   ├── back/                      # Backend приложение
│   │   ├── src/
│   │   │   ├── core/              # Ядро приложения
│   │   │   │   ├── mixins/        # Переиспользуемые миксины
│   │   │   │   ├── models/        # SQLAlchemy модели
│   │   │   │   ├── schemas/       # Pydantic схемы
│   │   │   │   ├── __init__.py
│   │   │   │   └── config.py      # Конфигурация приложения
│   │   │   ├── deps/              # Dependency injection
│   │   │   ├── routers/           # API роутеры
│   │   │   ├── service/           # Бизнес-логика
│   │   │   └── utils/             # Утилиты
│   │   ├── tests/                 # Тесты
│   │   ├── alembic/               # Миграции базы данных
│   │   ├── certs/                 # RSA ключи (НЕ коммитить!)
│   │   │   ├── private_key.pem
│   │   │   └── public_key.pem
│   │   ├── .env                   # Переменные окружения (НЕ коммитить!)
│   │   ├── .test.env              # Тестовое окружение
│   │   ├── .gitignore
│   │   ├── alembic.ini            # Конфигурация Alembic
│   │   ├── pyproject.toml         # Poetry конфигурация
│   │   ├── poetry.lock
│   │   └── pytest.ini             # Конфигурация Pytest
│   │
│   └── web/                       # Frontend приложение
│       ├── src/
│       │   ├── api/               # API клиенты и запросы
│       │   ├── assets/            # Статические ресурсы
│       │   ├── components/        # React компоненты
│       │   ├── context/           # React Context провайдеры
│       │   ├── hooks/             # Кастомные React хуки
│       │   ├── lib/               # Вспомогательные библиотеки
│       │   ├── pages/             # Страницы приложения
│       │   ├── types/             # TypeScript типы
│       │   ├── utils/             # Утилиты
│       │   ├── App.css
│       │   ├── App.tsx            # Главный компонент
│       │   ├── index.css
│       │   └── main.tsx           # Точка входа
│       ├── .gitignore
│       ├── components.json        # Shadcn/ui конфигурация
│       ├── eslint.config.js       # ESLint конфигурация
│       ├── index.html
│       ├── package.json
│       ├── package-lock.json
│       ├── postcss.config.js      # PostCSS конфигурация
│       ├── tailwind.config.ts     # Tailwind конфигурация
│       ├── tsconfig.json          # TypeScript конфигурация
│       ├── tsconfig.app.json
│       ├── tsconfig.node.json
│       └── vite.config.ts         # Vite конфигурация
│
└── README.md
```

## ✅ Требования

- Python 3.10+
- Poetry 1.5+
- PostgreSQL 14+
- Node.js 18+
- npm или yarn
- OpenSSL (для генерации RSA ключей)

## 🚀 Установка и запуск

### 1. Клонирование репозитория

```bash
git clone https://github.com/Kariandrrr/VETVI.git
cd VETVI
```

### 2. Генерация RSA ключей

Создайте директорию для сертификатов и сгенерируйте ключи:

```bash
cd packages/back
mkdir certs
cd certs

# Генерация приватного ключа
openssl genrsa -out private_key.pem 2048

# Генерация публичного ключа
openssl rsa -in private_key.pem -pubout -out public_key.pem

cd ../..
```

⚠️ **Важно:** Никогда не коммитьте директорию `certs/` в Git!

### 3. Настройка Backend

#### Установка Poetry

```bash
# Linux/macOS/WSL
curl -sSL https://install.python-poetry.org | python3 -

# Или через pip
pip install poetry
```

#### Установка зависимостей

```bash
cd packages/back

# Установка зависимостей
poetry install

# Активация виртуального окружения
poetry shell
```

#### Настройка базы данных

Создайте PostgreSQL базу данных:

```sql
CREATE DATABASE vetvi_db;
CREATE USER vetvi_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE vetvi_db TO vetvi_user;
```

#### Конфигурация окружения

Создайте файл `.env` в директории `packages/back/`:

```env
# Alembic (синхронный драйвер)
DATABASE_URL=postgresql+psycopg2://vetvi_user:your_password@localhost:5432/vetvi_db

# Конфигурация базы данных (асинхронный драйвер)
APP_CONFIG__DB__DRIVER=postgresql+asyncpg
APP_CONFIG__DB__USER=vetvi_user
APP_CONFIG__DB__PASSWORD=your_password
APP_CONFIG__DB__HOST=localhost
APP_CONFIG__DB__PORT=5432
APP_CONFIG__DB__DBNAME=vetvi_db
APP_CONFIG__DB__MODE=DEV

# Логирование
APP_CONFIG__LOGGING__LOG_LEVEL=info

# Настройки запуска
APP_CONFIG__RUN__DEBUG=True
APP_CONFIG__RUN__CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:3000"]
```

Файл `.test.env` должен содержать:

```env
APP_CONFIG__DB__MODE=TEST
APP_CONFIG__DB__DRIVER=sqlite+aiosqlite
APP_CONFIG__DB__DBNAME=:memory:
APP_CONFIG__DB__ECHO=false
```

#### Применение миграций

```bash
# Находясь в packages/back с активированным poetry shell
alembic upgrade head
```

#### Запуск сервера

```bash
# Из директории packages/back
poetry run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Или внутри poetry shell
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

API будет доступно по адресу: `http://localhost:8000`

### 4. Настройка Frontend

```bash
cd packages/web

# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev
```

Приложение будет доступно по адресу: `http://localhost:5173`

## ⚙️ Конфигурация

### Переменные окружения Backend

#### Production (.env)

| Переменная | Описание | Пример |
|------------|----------|---------|
| `DATABASE_URL` | URL для Alembic (синхронный) | `postgresql+psycopg2://user:pass@localhost/db` |
| `APP_CONFIG__DB__DRIVER` | Асинхронный драйвер БД | `postgresql+asyncpg` |
| `APP_CONFIG__DB__USER` | Пользователь БД | `vetvi_user` |
| `APP_CONFIG__DB__PASSWORD` | Пароль БД | `secret_password` |
| `APP_CONFIG__DB__HOST` | Хост БД | `localhost` |
| `APP_CONFIG__DB__PORT` | Порт БД | `5432` |
| `APP_CONFIG__DB__DBNAME` | Имя БД | `vetvi_db` |
| `APP_CONFIG__DB__MODE` | Режим работы | `DEV` или `PROD` |
| `APP_CONFIG__LOGGING__LOG_LEVEL` | Уровень логирования | `info`, `debug`, `warning` |
| `APP_CONFIG__RUN__DEBUG` | Режим отладки | `True` / `False` |
| `APP_CONFIG__RUN__CORS_ORIGINS` | Разрешенные CORS origins | `["http://localhost:5173"]` |

#### Testing (.test.env)

```env
APP_CONFIG__DB__MODE=TEST
APP_CONFIG__DB__DRIVER=sqlite+aiosqlite
APP_CONFIG__DB__DBNAME=:memory:
APP_CONFIG__DB__ECHO=false
```

### Аутентификация RS256

Проект использует асимметричную криптографию для JWT токенов:

- **Приватный ключ** (`private_key.pem`) - для подписи токенов
- **Публичный ключ** (`public_key.pem`) - для верификации токенов

Это обеспечивает повышенную безопасность, так как публичный ключ может быть распространен для верификации без риска компрометации.

## 🧪 Тестирование

"[!IMPORTANT]
Примечание о состоянии тестов: на текущий момент не все тесты в репозитории являются валидными. Они использовались не столько для финальной проверки продукта, сколько как инструмент итеративной модернизации и рефакторинга в процессе разработки. В будущем планируется приведение тестового покрытия к актуальному состоянию."

### Backend

```bash
cd packages/back

# Активировать poetry shell
poetry shell

# Запуск всех тестов
pytest

# Запуск с покрытием кода
pytest --cov=src --cov-report=html

# Запуск конкретного теста
pytest tests/test_auth.py -v

# Запуск с детальным выводом
pytest -vv
```

Тесты используют in-memory SQLite базу данных для изоляции и скорости выполнения.

### Frontend

```bash
cd packages/web

# Запуск линтера
npm run lint

# Запуск типов проверки
npm run type-check  # (если настроено)

# Сборка проекта
npm run build
```

## 📚 API Документация

После запуска backend сервера документация доступна по адресам:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## 🔧 Полезные команды

### Backend (Poetry)

```bash
# Добавить зависимость
poetry add package-name

# Добавить dev-зависимость
poetry add --group dev package-name

# Обновить зависимости
poetry update

# Показать установленные пакеты
poetry show

# Экспорт requirements.txt
poetry export -f requirements.txt --output requirements.txt
```

### Миграции базы данных

```bash
# Создать новую миграцию
alembic revision --autogenerate -m "Description of changes"

# Применить миграции
alembic upgrade head

# Откатить последнюю миграцию
alembic downgrade -1

# Посмотреть текущую версию
alembic current

# История миграций
alembic history
```

### Frontend

```bash
# Запуск dev-сервера
npm run dev

# Сборка для production
npm run build

# Превью production сборки
npm run preview

# Линтинг
npm run lint

```

## 🔒 Безопасность

### Важные замечания:

1. **Никогда не коммитьте**:
   - `.env` файлы (кроме `.env.example`)
   - Директорию `certs/`
   - Файлы с секретами (`*.pem`, `*.key`)
   - `node_modules/`
   - `__pycache__/`, `.pytest_cache/`

2. **`.gitignore` должен включать**:
   ```
   # Backend
   .env
   .env.*
   !.env.example
   !.test.env
   certs/
   *.pem
   *.key
   __pycache__/
   .pytest_cache/
   .coverage
   htmlcov/
   
   # Frontend
   node_modules/
   dist/
   .env.local
   .env.*.local
   ```

## 🏗️ Архитектура

### Backend

- **core/mixins** - переиспользуемые миксины для моделей (timestamps, soft delete и т.д.)
- **core/models** - SQLAlchemy модели базы данных
- **core/schemas** - Pydantic схемы для валидации и сериализации
- **deps** - зависимости для dependency injection (database session, current user и т.д.)
- **routers** - FastAPI роутеры для различных ресурсов
- **service** - бизнес-логика приложения
- **utils** - вспомогательные функции

### Frontend

- **api** - API клиенты для взаимодействия с backend
- **components** - переиспользуемые React компоненты
- **context** - React Context для глобального состояния
- **hooks** - кастомные React хуки
- **pages** - компоненты страниц
- **types** - TypeScript типы и интерфейсы
- **utils** - вспомогательные функции


⭐ Если проект был полезен, поставьте звезду на GitHub!
