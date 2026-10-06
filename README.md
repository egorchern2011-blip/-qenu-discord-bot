# Qenu Discord Bot

Готовый бот для Discord-сервера в стиле anime + gaming + community.

## Что умеет

- `/setup` — создаёт оформление сервера, категории, каналы и роли.
- Панель тикетов с кнопками.
- Staff-заявка через Discord Modal.
- Временные голосовые комнаты: пользователь заходит в `➕・создать-комнату`, бот создаёт личный временный voice.
- Логи базовых действий.
- Роли спонсоров.
- Роли интересов.
- Кнопки для выбора пола/интересов и уведомлений.
- Команда `/panel` — повторно отправляет панели в нужные каналы.

## Важно

Бот НЕ содержит ваш токен. Никому не отправляйте `DISCORD_TOKEN`.

## Установка на Windows

1. Установите Node.js 18.17+.
2. Распакуйте ZIP.
3. Откройте папку проекта в CMD/PowerShell.
4. Выполните:

```bash
npm install
```

5. Скопируйте `.env.example` в `.env`.
6. Заполните `.env`:
   - `DISCORD_TOKEN` — токен Discord-бота.
   - `CLIENT_ID` — Application ID бота.
   - `GUILD_ID` — ID вашего Discord-сервера.
7. Запустите:

```bash
npm start
```

8. В Discord выполните:

```text
/setup
```

## Права бота

Для автоматической настройки серверу бота нужны как минимум:

- Manage Channels
- Manage Roles
- Manage Messages
- Send Messages
- View Channels
- Read Message History
- Connect
- Move Members
- Manage Webhooks (не обязательно)

Для создания ролей роль бота должна находиться выше ролей, которыми он управляет.

## Как получить ID сервера

Discord → Настройки → Расширенные → Режим разработчика → правой кнопкой по серверу → Копировать ID.

## Как создать бота

Discord Developer Portal → New Application → Bot → Reset Token → скопировать токен.

При приглашении бота включите OAuth2 scopes:
- bot
- applications.commands

## Безопасность

Не публикуйте `.env`, токен или содержимое токена в чате.
Если токен случайно утёк — сразу сбросьте его в Developer Portal.
