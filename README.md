# ☕ Zruchno Coffee

Веб-застосунок для каталогу кав'ярень і їхнього меню. Я реалізувала повний CRUD, авторизацію через Google, роботу в реальному часі через WebSocket і SSE та ШІ-бариста у вигляді чату.

## Зміст

- [Що я реалізувала](#що-я-реалізувала)
- [Технології](#технології)
- [Структура проєкту](#структура-проєкту)
- [Запуск проєкту](#запуск-проєкту)
- [Змінні оточення](#змінні-оточення)
- [ШІ-агент (C21)](#ші-агент-c21)
- [Маршрути](#маршрути)
- [REST API](#rest-api)
- [Тестування](#тестування)

---

## Що я реалізувала

| Вимога | Реалізація |
|---|---|
| CRUD | Я створила керування кав'ярнями, категоріями меню та позиціями меню: веб-інтерфейс на EJS і REST API |
| **C10** | Я підключила WebSocket-сервер (`ws`) до того ж HTTP-сервера, що й Express; підключені клієнти отримують оновлення в реальному часі |
| **C16** | Я налаштувала авторизацію через Google (OAuth 2.0, Passport) |
| **B6** | Я додала feature flag: розділ `/game` доступний лише Premium-користувачам |
| **C18** | Я зробила спільну дошку: події малювання ретранслюються всім клієнтам через WebSocket |
| Polling | Я створила сторінку `/benchmark`, де порівнюються Frequent Polling і Long Polling; дані беруться з БД |
| **C21** | Я реалізувала ШІ-агента у вигляді чату: відповідь стрімиться через SSE, а проміжні кроки (аналіз запиту, виклик інструмента) показуються користувачу |
| QA | Я підготувала колекцію Postman `QA1 Tests` для перевірки API кав'ярень |

## Технології

- **Backend:** Node.js 22, Express 5, EJS
- **БД:** PostgreSQL 15 (драйвер `pg`)
- **Real-time:** `ws` (WebSocket), Server-Sent Events (SSE)
- **Авторизація:** `passport`, `passport-google-oauth20`, `express-session`
- **ШІ-агент:** власний агент на правилах (визначення наміру за ключовими словами) із SQL-інструментом і SSE-стрімінгом відповіді
- **Тести:** Jest, Supertest, Nock, Postman
- **Інфраструктура:** Docker, Docker Compose

## Структура проєкту

```
.
├── server.js                  # Точка входу: Express, WebSocket, OAuth, маршрути
├── controllers/
│   ├── shopController.js      # Сторінки кав'ярень
│   ├── menuController.js      # Сторінки меню
│   ├── categoryController.js  # Сторінки категорій
│   └── api/
│       ├── shopApiController.js
│       ├── categoryApiController.js
│       ├── menuApiController.js
│       └── agentController.js # ШІ-агент (SSE + виклик інструмента)
├── models/db.js               # Підключення до PostgreSQL
├── views/                     # EJS-шаблони (shops/, benchmark, dashboard, game, notes ...)
├── tests/                     # Jest-тести
├── Dockerfile
├── docker-compose.yml
├── .env                       # Локальні секрети (не потрапляє в git)
└── QA1 Tests.postman_collection.json
```

## Запуск проєкту

Застосунок повністю контейнеризований: Dockerfile на базі `node:22-alpine` збирає образ застосунку, а `docker-compose.yml` піднімає разом із ним PostgreSQL 15.

```bash
docker compose up --build
```

Після цього запускаються два контейнери:

| Сервіс | Контейнер | Порт на хості |
|---|---|---|
| Застосунок | `node_app` | `3000` |
| PostgreSQL | `postgres_db` | `5433` (всередині мережі Docker: `5432`) |

Застосунок стартує лише тоді, коли база пройшла healthcheck (`pg_isready`), тому порядок запуску гарантований. Інтерфейс відкривається на **http://localhost:3000**.

Зупинка та очищення:

```bash
docker compose down        # зупинка контейнерів
docker compose down -v     # зупинка і видалення даних БД
```

Код змонтований у контейнер (`.:/app`), але автоперезапуску немає, тому після змін застосовується `docker compose restart app`.

## Змінні оточення

Секрети винесені в `.env` у корені проєкту. Файл не потрапляє ні в git, ні в Docker-образ (він є в `.gitignore` та `.dockerignore`). Docker Compose підставляє значення в контейнери.

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=coffeedb

# Google OAuth (C16)
GOOGLE_CLIENT_ID=<client_id>
GOOGLE_CLIENT_SECRET=<client_secret>
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

| Змінна | Призначення | За замовчуванням |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Доступ до БД | `postgres` / `password` / `coffeedb` |
| `DATABASE_URL` | Рядок підключення; формується в compose з трьох змінних вище | |
| `PORT` | Порт сервера | `3000` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Дані OAuth-клієнта Google | |
| `GOOGLE_CALLBACK_URL` | Адреса зворотного виклику Google | `http://localhost:3000/auth/google/callback` |

### Google OAuth (C16)

Для входу використовується OAuth-клієнт типу *Web application* з Google Cloud Console. У його *Authorized redirect URIs* прописано `http://localhost:3000/auth/google/callback`. Вхід здійснюється за адресою `/auth/google`, вихід за адресою `/logout`. Дані користувача (ім'я, пошта, прапорець `isPremium`) зберігаються в сесії.

### Premium-доступ (B6)

Прапорець `isPremium` виставляється під час входу: користувач отримує його, якщо пошта містить `admin` або збігається із заданою в `server.js`. Middleware `requirePremium` пропускає на `/game` лише таких користувачів, інші бачать сторінку помилки зі статусом 403.

## ШІ-агент (C21)

Чат доступний за адресою **http://localhost:3000/chat**.

Агент працює за правилами, без зовнішньої LLM, тому йому не потрібні API-ключі та додаткові сервіси. Логіка складається з чотирьох кроків:

1. **Визначення наміру.** За ключовими словами («кав'ярн», «адрес», «заклад», «де знайти») агент вирішує, що шукати: заклади чи позиції меню.
2. **Витягування параметрів.** З тексту береться число як ціна; слова «дорожче», «від» та знак `>` перемикають умову з `<=` на `>=`. Решта тексту (без пунктуації та цифр) стає пошуковим терміном.
3. **Виклик інструмента.** Виконується параметризований SQL-запит до PostgreSQL: `ILIKE` за назвою, описом і категорією, результат обмежений п'ятьма записами. Параметризація виключає SQL-ін'єкції.
4. **Формування відповіді.** Результати перетворюються на текст і стрімляться клієнту по словах.

Приклади запитів: «латте», «десерт», «кав'ярні».

### Протокол SSE

Ендпоінт `GET /api/agent/chat?message=...` (також `POST` з тілом `{ "message": "..." }`) повертає потік `text/event-stream`. Кожна подія має вигляд `data: {JSON}`:

| `type` | Опис | Поля |
|---|---|---|
| `status` | Проміжний крок: аналіз запиту, виклик інструмента (`Tool Calling [query_database]`), формування відповіді | `content` |
| `chunk` | Фрагмент тексту відповіді (стрімінг по словах) | `content` |
| `done` | Кінець відповіді | |
| `error` | Помилка | `content` |

Потік можна перевірити з терміналу:

```bash
curl -N "http://localhost:3000/api/agent/chat?message=латте"
```

## Маршрути

| Шлях | Опис |
|---|---|
| `/` | Перенаправлення на `/shops` |
| `/shops` | Список кав'ярень |
| `/shops/create`, `/shops/edit/:id` | Створення та редагування кав'ярні |
| `/shops/:shopId/categories` | Категорії кав'ярні |
| `/shops/:shopId/menu` | Меню кав'ярні |
| `/map` | Карта |
| `/chat` | ШІ-агент |
| `/notes` | Нотатки |
| `/dashboard` | Дашборд |
| `/benchmark` | Порівняння Frequent / Long Polling |
| `/game` | Преміум-розділ (B6) |
| `/auth/google`, `/logout` | Вхід через Google та вихід |

## REST API

| Метод | Шлях | Опис |
|---|---|---|
| GET | `/api/shops` | Усі кав'ярні |
| GET | `/api/shops/paginated` | Кав'ярні з пагінацією |
| GET | `/api/shops/:id` | Кав'ярня за id |
| POST | `/api/shops` | Створення (`name`, `description`, `address`, `opening_hours`) |
| PUT | `/api/shops/:id` | Оновлення |
| DELETE | `/api/shops/:id` | Видалення |
| GET | `/api/categories/search` | Пошук категорій |
| GET / POST | `/api/shops/:shopId/categories` | Категорії кав'ярні / створення |
| PUT / DELETE | `/api/categories/:id` | Оновлення / видалення категорії |
| GET / POST | `/api/shops/:shopId/menu` | Меню кав'ярні / додавання позиції |
| PUT / DELETE | `/api/menu/:itemId` | Оновлення / видалення позиції |
| GET | `/api/benchmark/shops` | Frequent Polling: кількість кав'ярень |
| GET | `/api/benchmark/long-poll` | Long Polling: кількість позицій меню (відповідь із затримкою 1,5 с) |
| GET / POST | `/api/agent/chat` | ШІ-агент (SSE) |

### Модель даних

- `shops`: `id`, `name`, `address`, `description`, `opening_hours`
- `categories`: `id`, `name`, `shop_id`
- `menu_items`: `id`, `name`, `description`, `price`, `shop_id`, `category_id`

### WebSocket (C10, C18)

WebSocket працює на тому ж порту, що й HTTP: `ws://localhost:3000`. Після підключення сервер надсилає привітання `{"type":"WELCOME", ...}`. Будь-яке JSON-повідомлення від клієнта ретранслюється всім іншим підключеним клієнтам, на цьому ґрунтується спільна дошка. Функція `broadcastUpdate(data)` розсилає оновлення всім клієнтам одразу.

## Тестування

**Jest.** Автотести запускаються командою `npm test` проти БД на `localhost:5433` (`DATABASE_URL=postgres://postgres:password@localhost:5433/coffeedb`), для чого достатньо піднятого контейнера `db`. Файл `tests/setup/block-network.js` блокує реальні мережеві запити, а `nock` використовується для моків.

**Postman.** Колекція `QA1 Tests` містить чотири запити до `/api/shops`: `GET`, `POST`, `PUT /api/shops/2` і `DELETE /api/shops/9`. До кожного прив'язані перевірки статус-коду та формату відповіді. Запити з `id` 2 і 9 працюють за умови, що відповідні записи є в БД.
