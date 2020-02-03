# COVID-19 Tracker

COVID-19 Tracker — веб-приложение для просмотра мировой статистики распространения COVID-19 и сравнения показателей между странами. Панель мониторинга отображает число зарегистрированных случаев и смертей, а каталог стран позволяет находить подробную информацию по выбранному государству.

## Содержание

- [Технологии](#технологии)
- [Использование](#использование)
- [Разработка](#разработка)
- [Тестирование](#тестирование)
- [Deploy и CI/CD](#deploy-и-cicd)
- [Структура проекта](#структура-проекта)

## Технологии

**Frontend**

- React 17.0.1, React DOM 17.0.1, TypeScript 4.1.3.
- React Router DOM 5.2.0.
- Create React App (`react-scripts` 4.0.1).
- CSS, Fetch API.

**Backend**

- NestJS 7.6.5, Node.js 14 LTS.
- Axios 0.21.1, csv-parse 4.15.0, class-validator 0.12.2.
- Jest 26, Supertest 6.

**Тестирование интерфейса:** Jest и React Testing Library 11.

## Использование

После запуска откройте [http://localhost:3000](http://localhost:3000).

- **Dashboard** (`/`) — мировые показатели, число новых зарегистрированных случаев и смертей, рейтинг стран и таблица с последними доступными данными.
- **Countries** (`/countries`) — поиск по названию, выбор континента, сортировка и пагинация.
- **Country details** (`/countries/:code`) — показатели выбранной страны, население и дата отчёта.

В разделе Countries нажмите на название страны, чтобы открыть её подробную страницу. При отсутствии связи с API приложение сообщает об ошибке и позволяет повторить запрос. Числовые значения и даты поступают с сервера; отсутствующие показатели обозначаются символом «—».

### API статистики

NestJS получает данные из [Our World in Data](https://github.com/owid/covid-19-data), кеширует полученный набор на один час и возвращает его через REST API. Если внешний источник временно недоступен, сервер продолжает отдавать уже загруженные данные. При отсутствии данных возвращается HTTP `503`.

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/v1/health` | Проверка доступности сервера |
| GET | `/api/v1/summary` | Мировые показатели |
| GET | `/api/v1/countries` | Страны с фильтрацией и пагинацией |
| GET | `/api/v1/countries/:code` | Показатели страны по ISO-коду |
| GET | `/api/v1/meta` | Источник и дата данных |

Параметры `/api/v1/countries`:

- `search` — часть названия страны.
- `continent` — континент.
- `sortBy` — `name`, `totalCases`, `totalDeaths`, `newCases`, `newDeaths`, `casesPerMillion`, `deathsPerMillion`.
- `order` — `asc` или `desc`.
- `page` — номер страницы, начиная с 1.
- `limit` — размер страницы от 1 до 100.

Примеры запросов:

```bash
curl http://localhost:3001/api/v1/health
curl http://localhost:3001/api/v1/summary
curl 'http://localhost:3001/api/v1/countries?search=pol&limit=10'
curl http://localhost:3001/api/v1/countries/POL
```

Поле `date` отражает дату статистического наблюдения. Время `fetchedAt` относится к загрузке данных на сервер и не заменяет дату публикации статистики. Данные могут пересматриваться их поставщиком.

## Разработка

### Требования

- Node.js 14.x LTS.
- npm 6.x.
- Доступ к npm registry для установки зависимостей.
- Доступ к источнику CSV для загрузки статистики.

### Установка зависимостей

Из корня репозитория выполните:

```bash
cd client
npm install
cd ../server
npm install
```

При необходимости создайте `server/.env` из `server/.env.example`. Параметр `COVID_DATA_URL` позволяет изменить URL статистического CSV. Приложение не требует регистрации и отдельной базы данных.

### Запуск Development сервера

В первом терминале:

```bash
cd server
npm run start:dev
```

Во втором терминале:

```bash
cd client
npm start
```

Frontend доступен на `http://localhost:3000`, backend API — на `http://localhost:3001`. Настройка `proxy` в `client/package.json` перенаправляет запросы `/api/*` на backend. Чтобы открыть страницу страны по прямой ссылке, используйте маршрут вида `http://localhost:3000/countries/POL`.

### Создание билда

Сборка backend:

```bash
cd server
npm run build
npm start
```

Сборка frontend:

```bash
cd client
npm run build
```

Статические файлы приложения будут размещены в `client/build/`, серверный JavaScript — в `server/dist/`.

## Тестирование

Для unit- и HTTP-тестов сервера используются Jest и Supertest:

```bash
cd server
npm test
npm run test:e2e
```

Для тестирования React-компонентов, страниц и форматирования данных используются Jest и React Testing Library:

```bash
cd client
npm test
```

## Deploy и CI/CD

Для production-сборки выполните `npm run build` в папках `server` и `client`. Запускайте backend командой `npm start` из `server`, а содержимое `client/build` размещайте на веб-сервере (например, Nginx).

В конфигурации веб-сервера необходимо направлять запросы `/api/` на NestJS по порту `3001`. Для корректной работы маршрутов React Router настройте возврат `index.html` при обращении к неизвестным статическим путям. Используйте HTTPS и задайте разрешённые источники CORS через переменные окружения.

Автоматизированные CI/CD-пайплайны в репозитории не настроены. Сборка и тесты выполняются с помощью npm-скриптов.

## Структура проекта

```text
covid-tracker/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/                    # Типы данных и HTTP-клиент
│   │   ├── components/             # Переиспользуемые элементы интерфейса
│   │   ├── hooks/                  # Загрузка данных API
│   │   ├── pages/                  # Dashboard, Countries, Country details
│   │   ├── App.tsx                 # Маршрутизация и общий layout
│   │   ├── App.css
│   │   ├── utils.ts
│   │   └── index.tsx
│   └── package.json
├── server/
│   ├── src/
│   │   ├── health/
│   │   └── statistics/
│   ├── test/
│   └── package.json
├── .editorconfig
├── .gitignore
├── .prettierrc
└── README.md
```
