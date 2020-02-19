# Data sources and synchronization

## Source

The application reads public COVID-19 CSV datasets from [Our World in Data](https://github.com/owid/covid-19-data). The source URLs are configurable with `COVID_DATA_URL` (latest observations) and `COVID_HISTORY_URL` (historical data). Availability and coverage depend on what the provider publishes. The application must not present the cache download time as the observation date.

## Latest observations

At startup the NestJS application loads a previously saved JSON snapshot if one exists, then attempts to refresh it. The refresh interval is configured with `COVID_SYNC_INTERVAL_MINUTES` (default `60`). Failed updates are retried according to `COVID_SYNC_RETRY_MINUTES` (default `5`). The latest snapshot is stored at `COVID_DATA_CACHE_FILE` (default `./data/owid-statistics.json`). Writes use a temporary file followed by replacement to avoid exposing partially written snapshots.

When an upstream request fails, the server continues to serve its last successfully loaded dataset. If neither an in-memory nor a persisted snapshot exists, statistics requests return HTTP `503`. If a valid refresh succeeds but persistence fails, the new dataset remains available in memory until the process restarts; on restart the last persisted snapshot is used.

## Historical observations

The full historical CSV is read by the backend as a stream and materialized as a compressed JSON cache at `COVID_HISTORY_CACHE_FILE` (default `./data/owid-history.json.gz`). The first historical request can take longer than ordinary summary requests. The historical cache is refreshed after its retention period; previously cached data remains available if refresh fails.

Observations are keyed by ISO code and reporting date. Source gaps are retained as missing values rather than synthetic zeros. New case or death values can be negative when the source revises earlier reports. Seven-day averages are computed only when a complete sequence is available.

## Interpretation

- Confirmed cases are reported observations, not an estimate of every infection.
- Case counts and testing data may have different reporting dates or missing observations.
- Per-million values require a valid population denominator.
- Country comparisons use shared observation dates and preserve gaps.
- Downloads of fresh CSV data are not guaranteed to contain present-day observations.

The API provides data-source metadata through `GET /api/v1/meta` and synchronization details through `GET /api/v1/sync/status`.
