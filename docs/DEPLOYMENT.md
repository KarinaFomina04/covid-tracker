# Deployment and operations

## Requirements

- Docker Engine and Docker Compose for container deployment.
- Access to package registries and container images during builds.
- Network access from the backend to the configured OWID CSV source.
- Network access to OpenStreetMap tiles from browsers if the map background is required.

## Docker Compose

From the repository root:

```bash
docker-compose up -d --build
docker-compose ps
docker-compose logs -f
```

The website is exposed at `http://localhost:8080`. Nginx serves the React production build and forwards `/api/` requests to the `api` service on port 3001 over the Compose network. The API port is not published directly to the host.

Check health:

```bash
curl http://localhost:8080/api/v1/health
curl http://localhost:8080/api/v1/sync/status
```

To stop services without deleting saved data:

```bash
docker-compose down
```

The named volume `statistics_data` persists the backend's latest and historical caches under `/app/data`. **Do not use `docker-compose down -v` if the saved datasets must be retained.**

## Production configuration

The Compose file supplies cache paths, synchronization and retry intervals, and the frontend origin. Use HTTPS with a public reverse proxy in deployments reachable outside a private network. Restrict access to sensitive operational endpoints if infrastructure policy requires it. Keep secrets and deployment credentials outside the Git repository.

The web image uses Nginx. Content-hashed `/static/` assets are long-cacheable, while the HTML shell is revalidated so new deployments can reference updated bundles. Text responses are gzip-compressed when supported by the client. Nonexistent static assets return 404 rather than the SPA entrypoint.

## Continuous integration

`.github/workflows/ci.yml` runs on pushes and pull requests. The workflow checks React tests and build, NestJS unit/HTTP tests and build, and then builds both Docker images. Npm download caches help repeated runs. The workflow does **not** publish images or deploy to a remote server.

To reproduce checks locally:

```bash
cd client && npm install && npm run test:coverage && npm run build
cd ../server && npm install && npm run test:coverage && npm run test:e2e && npm run build
cd .. && docker-compose up -d --build
```

## Troubleshooting

| Symptom | Check |
|---|---|
| Website unavailable | `docker-compose ps`, `docker-compose logs web` and whether host port 8080 is free |
| API returns 503 | `docker-compose logs api`, upstream CSV access, `GET /api/v1/sync/status` |
| Data looks old | Distinguish the last observation date from `fetchedAt`; inspect source availability |
| History responds slowly | The first request may download and parse the full historical CSV |
| Map has markers but no background | Browser connectivity to the OpenStreetMap tile server |
| Saved data disappears | Whether the named volume was deleted or cache paths changed |

A remote CI/CD deployment pipeline is not configured; deployment credentials and target infrastructure must be supplied separately.
