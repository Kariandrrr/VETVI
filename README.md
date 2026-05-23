Сгенерируйте приватный ключ (private.pem):
    Bash

    openssl genrsa -out private.pem 2048

    Извлеките публичный ключ (public.pem):
    Bash

    openssl rsa -in private.pem -outform PEM -pubout -out public.pem

    ⚠️ Важно: Папка certs и сами .pem файлы никогда не должны попадать в систему контроля версий. Убедитесь, что certs/ и *.pem добавлены в ваш .gitignore.


Установка и запуск
1. Клонирование репозитория
Bash

git clone [https://github.com/Kariandrrr/VETVI.git]
cd VETVI

2. Настройка базы данных

Убедитесь, что PostgreSQL запущен, и создайте базу данных для проекта:
SQL

CREATE DATABASE vetvi_db;

3. Развертывание Backend
Bash

# Перейдите в папку бэкенда (название может отличаться)
cd backend 

# Создайте и активируйте виртуальное окружение
python -m venv venv
source venv/bin/activate  # Для Windows: venv\\Scripts\\activate

# Установите зависимости
poetry install 

# Настройте переменные окружения (создайте .env на основе .env.example)
cp .env.example .env

# Примените миграции для создания таблиц в БД
alembic upgrade head

# Запустите сервер (FastAPI)
uvicorn app.main:app --reload

4. Развертывание Frontend
Bash

# В новой вкладке терминала перейдите в папку фронтенда
cd frontend

# Установите зависимости
npm install

# Запустите проект в режиме разработчика
npm start

🌍 Переменные окружения (.env)
Для успешного запуска бэкенда потребуется указать настройки подключения к БД. Формат .env:

DATABASE_URL=

APP_CONFIG__DB__DRIVER=postgresql+asyncpg
APP_CONFIG__DB__USER=
APP_CONFIG__DB__PASSWORD=
APP_CONFIG__DB__HOST=
APP_CONFIG__DB__PORT=
APP_CONFIG__DB__DBNAME=

APP_CONFIG__LOGGING__LOG_LEVEL=info

APP_CONFIG__RUN__DEBUG=True
APP_CONFIG__RUN__CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:3000","http://127.0.0.1:5173"]

APP_CONFIG__DB__MODE=DEV
