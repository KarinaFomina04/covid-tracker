# REST API

The backend exposes JSON endpoints under `/api/v1`. In local development the API listens on `http://localhost:3001`; with Docker Compose use `http://localhost:8080/api/v1` through Nginx.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/summary` | Global totals and reporting date |
| GET | `/summary/history` | Global historical observations |
| GET | `/countries` | Paginated country list |
| GET | `/countries/:code` | Latest observation for a country |
| GET | `/countries/:code/history` | Country historical observations |
| GET | `/map` | Country statistics for map markers |
| GET | `/compare` | Date-aligned comparison of 2–4 countries |
| GET | `/meta` | Dataset source and update metadata |
| GET | `/sync/status` | Synchronization state |

All paths in the table are relative to `/api/v1`.

## Countries

`GET /countries` accepts `search`, `continent`, `sortBy`, `order`, `page` and `limit`. Sorting fields: `name`, `totalCases`, `totalDeaths`, `newCases`, `newDeaths`, `casesPerMillion`, `deathsPerMillion`; `order` is `asc` or `desc`. Pages are numbered from 1; `limit` accepts values from 1 to 100.

Country detail uses the three-letter ISO code, for example `/countries/POL`. Testing fields (`totalTests`, `newTests`, `testsPerThousand`, `positiveRate`) may be `null` or absent in older cached observations. `positiveRate` is a fraction; multiply by 100 to display a percentage.

## History

`GET /summary/history` and `GET /countries/:code/history` accept either `period=7d|30d|90d|all` or `from` and `to` dates (`YYYY-MM-DD`). Do not combine `period` with a date range. Results contain dated `points` with total and new cases and deaths, plus seven-day averages. Averages with insufficient observations are `null`; gaps are not treated as zero.

## Comparison

`GET /compare` accepts:

| Parameter | Values |
|---|---|
| `codes` | 2–4 distinct ISO country codes, separated by commas; required |
| `metric` | `totalCases`, `newCases`, `newCasesAverage`, `totalDeaths`, `newDeaths`, `newDeathsAverage` |
| `scale` | `absolute` or `perMillion` |
| `period` | `7d`, `30d`, `90d`, `all` |
| `from`, `to` | Alternative explicit date range, `YYYY-MM-DD` |

The response returns a shared `dates` array and aligned `countries` series. Missing observations or missing population for per-million calculations yield `null`, not zero.

## Errors

Errors have the fields `statusCode`, `message`, `error`, `timestamp`, and `path`. Typical HTTP statuses are `400` for invalid parameters, `404` for an unknown country, `503` for unavailable statistics, and `500` for unexpected server failures. Internal exception traces are not sent to clients.

## Examples

```bash
curl http://localhost:3001/api/v1/health
curl 'http://localhost:3001/api/v1/countries?search=pol&limit=10'
curl 'http://localhost:3001/api/v1/countries/POL/history?period=30d'
curl 'http://localhost:3001/api/v1/compare?codes=USA,ITA&metric=newCases&scale=perMillion&period=30d'
curl http://localhost:3001/api/v1/sync/status
```

The reporting date of an observation is distinct from the date on which the backend downloaded it. See [Data](DATA.md).
