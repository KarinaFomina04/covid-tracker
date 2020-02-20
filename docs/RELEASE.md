# Release checklist

## Prerequisites

- Node.js 14 and npm 6 for running the project outside containers.
- Docker Engine and Docker Compose for production packaging.
- Network access to the npm registry and the configured statistics source.
- An HTTPS reverse proxy when exposing the application to the internet.

## Pre-release verification

Run from the repository root:

```sh
sh scripts/verify-release.sh
```

The script installs dependencies, runs frontend and backend tests, builds the applications, validates Compose configuration, and builds the Docker images. It requires access to the package registry and Docker daemon. A failed command stops the script; don't release a build with failed checks.

## Deployment

```sh
WEB_PORT=8080 docker-compose up -d --build

docker-compose ps
curl --fail http://localhost:8080/api/v1/health
curl --fail http://localhost:8080/api/v1/sync/status
```

The `/health` endpoint verifies that the API process responds; it does **not** verify the freshness or availability of the external statistics source. Use `/sync/status` and review the reported observation dates before assessing data health.

Both services have Docker healthchecks. The backend is given up to 30 seconds to terminate on container shutdown, and the statistics volume persists across service recreation. Do not remove volumes when updating a deployment that must preserve its last successful data snapshot.

## Rollback

Keep the previous successfully built images available and record their image tags or digests before replacing them. To roll back, restore the previous compose configuration and image references, then recreate the services. Application data is persisted in the `statistics_data` volume; avoid `docker-compose down -v`.

## Operational notes

- Inspect failures with `docker-compose logs --tail=200 api web`.
- Check `docker-compose ps` for health status.
- Configure HTTPS and backup/monitoring for public installations; these are infrastructure responsibilities.
- The CI workflow validates builds but does not publish images or deploy automatically.
- Statistical data freshness depends on the upstream source and must not be inferred from API availability alone.
