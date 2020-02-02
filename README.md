# COVID-19 Tracker

COVID-19 Tracker — веб-приложение для мониторинга распространения коронавирусной инфекции и представления эпидемиологической статистики в понятном интерфейсе. Клиентская часть написана на React, серверная — на NestJS и предоставляет HTTP API для получения глобальной статистики и данных по странам.

## Содержание

- [Технологии](#технологии)
- [Использование](#использование)
- [Разработка](#разработка)
- [Тестирование](#тестирование)
- [Deploy и CI/CD](#deploy-и-cicd)
- [Структура проекта](#структура-проекта)

## Технологии

- React 17.0.1, React DOM 17.0.1, TypeScript 4.1.3.
- Create React App (`react-scripts` 4.0.1).
- NestJS 7.6.5, Node.js 14 LTS.
- Axios 0.21.1, csv-parse 4.15.0, class-validator 0.12.2.
- Jest 26 и React Testing Library 11.

## Использование

Главная страница доступна по адресу `http://localhost:3000`. В интерфейсе отображается состояние подключения к backend API. Статистические данные можно получить через REST API.

Проверить ответ API можно из терминала:

```bash
curl http://localhost:3001/api/v1/health
```

Пример ответа:

```json
{
  "status": "ok",
  "service": "covid-tracker-api"
}
```

### API статистики

Сервер получает страновую статистику из [Our World in Data](https://github.com/owid/covid-19-data) и сохраняет результат в памяти на один час. При повторных запросах используется кэш; при недоступности источника сервер отдаёт ранее полученные данные. Если данные ещё не загружались и источник недоступен, возвращается `503`.

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/v1/summary` | Глобальная статистика |
| GET | `/api/v1/countries` | Список стран с пагинацией |
| GET | `/api/v1/countries/:code` | Статистика страны по коду ISO alpha-3 |
| GET | `/api/v1/meta` | Источник и дата данных |

Параметры `/countries`: `search`, `continent`, `sortBy`, `order`, `page`, `limit`. Значение `limit` — от 1 до 100, по умолчанию 20. Доступные значения `sortBy`: `name`, `totalCases`, `totalDeaths`, `newCases`, `newDeaths`, `casesPerMillion`, `deathsPerMillion`.

Примеры запросов:

```bash
curl http://localhost:3001/api/v1/summary
curl 'http://localhost:3001/api/v1/countries?search=pol&limit=10'
curl http://localhost:3001/api/v1/countries/POL
curl http://localhost:3001/api/v1/meta
```

Поле `date` обозначает дату исходной статистики, а `fetchedAt` — момент загрузки файла сервером. Отсутствующие числовые значения возвращаются как `null`, а не как ноль. Статистика зависит от дат и полноты публикаций поставщика.

Для обращения к API из JavaScript:

```js
fetch('/api/v1/summary')
  .then((response) => response.json())
  .then((result) => console.log(result));
```

## Разработка

### Требования

Для установки и запуска необходимы Node.js **14.x LTS**, npm **6.x** и доступ к npm registry.

### Установка зависимостей

В каталоге проекта установите зависимости отдельно для клиента и сервера:

```bash
cd covid-tracker/client
npm install
cd ../server
npm install
```

При необходимости создайте файл `server/.env` на основе `.env.example` и настройте порт, разрешённый адрес клиента и `COVID_DATA_URL`. Для загрузки статистики серверу требуется исходящее HTTPS-соединение. Для локального запуска по умолчанию используются порт `3001` и адрес `http://localhost:3000`.

### Запуск Development сервера

В первом терминале:

```bash
cd covid-tracker/server
npm run start:dev
```

Во втором терминале:

```bash
cd covid-tracker/client
npm start
```

Клиент работает на порту `3000`, API — на `3001`. Настройка `proxy` в `client/package.json` направляет запросы `/api/*` к backend.

### Создание билда

Сборка backend:

```bash
cd covid-tracker/server
npm run build
npm start
```

Сборка frontend:

```bash
cd covid-tracker/client
npm run build
```

Готовые файлы клиентского приложения находятся в `client/build`.

## Тестирование

Сервер использует **Jest** для unit-тестов парсера и статистического сервиса, а **Jest + Supertest** для HTTP-проверок:

```bash
cd covid-tracker/server
npm test
npm run test:e2e
```

Клиент использует **Jest** и **React Testing Library**:

```bash
cd covid-tracker/client
npm test
```

## Deploy и CI/CD

Для публикации соберите оба приложения с помощью `npm run build`. Запустите сервер командой `npm start` в каталоге `server`, а статические файлы из `client/build` разместите на веб-сервере, например Nginx.

В конфигурации веб-сервера необходимо перенаправлять запросы с префиксом `/api/` на порт NestJS `3001`. Для публичного окружения настройте HTTPS и переменные окружения. Автоматизированные CI/CD-пайплайны в репозитории не настроены; проверки сборки и тестов выполняются через npm-скрипты.

## Структура проекта

```text
covid-tracker/
├── client/                  # React application
│   ├── public/
│   └── src/
│       └── components/
├── server/                  # NestJS API
│   ├── src/
│   │   ├── health/
│   │   └── statistics/
│   └── test/
├── .editorconfig
├── .gitignore
├── .prettierrc
└── README.md
```
