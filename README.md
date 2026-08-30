# re-kitis-bot

Перед использованием установи postgresql и создай пользователя kitisbot и базу данных kitisbot_db:
```
CREATE USER kitisbot WITH PASSWORD 'qwertyuiop123';
CREATE DATABASE kitisbot_db OWNER kitisbot;
```

Потом скопируй `config/example.yaml` в `config/default.yaml` (для тестов), либо в `config/production.yaml` для прода.
Также для прода установи `NODE_ENV=production` в файле `.env`.

Для запуска используй `bun run src/index.ts`.
