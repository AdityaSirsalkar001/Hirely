# Hirely

This monorepo is maintained for task and assessment purposes.

It contains:

- `Zelosify-Backend` for backend services and APIs
- `Zelosify-Frontend` for frontend application code

The repository is intended to organize and submit task-related implementation work in one place.

## Local ports (do not change these)

| Service | Port | URL |
| --- | --- | --- |
| Frontend (Next.js) | `5173` | http://localhost:5173 |
| Backend (Node/Express) | `5000` | http://localhost:5000 |
| Keycloak | `8080` | http://localhost:8080/auth |
| PostgreSQL (Docker) | `5445` | `localhost:5445` |

If a previous run was left running, free those ports before starting again. Example on Linux:

```bash
# Stop leftover Node processes on the app ports
fuser -k 5173/tcp 5000/tcp 2>/dev/null || true

# Optional: if Prisma Studio was left open
fuser -k 5555/tcp 2>/dev/null || true
```

Leave `8080` and `5445` to Docker unless you intend to restart the compose stack.

## Prerequisites

- Node.js v22.x and npm
- Docker and Docker Compose
- Git

## 1. Start Postgres and Keycloak

```bash
cd Zelosify-Backend/Server
docker compose up -d
```

Wait until `recruit-postgres` and `recruit-keycloak` are healthy. Keycloak admin UI:

- URL: http://localhost:8080
- Username: `admin`
- Password: `admin`

Create the `Zelosify` Keycloak realm, `dynamic-client` client, and realm roles (`IT_VENDOR`, `BUSINESS_USER`, `HIRING_MANAGER`, `VENDOR_MANAGER`) if they are not already present. The application is branded as Hirely; the realm name remains Zelosify for compatibility with the supplied identity configuration. Copy the client secret and RS256 public key into `Zelosify-Backend/Server/.env`.

## 2. Backend env and database

```bash
cd Zelosify-Backend/Server
cp .env.example .env   # only if .env does not already exist
```

Required values in `.env` (keep `PORT=5000` and `FRONTEND_URL=http://localhost:5173`):

- `DATABASE_URL` pointing at `localhost:5445`
- `KEYCLOAK_URL=http://localhost:8080/auth`
- `KEYCLOAK_CLIENT_SECRET` and `KEYCLOAK_RS256_SIG` from the Keycloak console
- AWS S3 keys if profile upload is needed
- `GROQ_API_KEY` if AI recommendation analysis is needed

Then:

```bash
npm ci
npm run prisma:generate
npx prisma migrate deploy
npm run seed:openings   # optional; seeds Bruce Wayne Corp openings
npm run dev
```

Backend should log `Server running on port 5000...` and `GET http://localhost:5000/` should return `Server Connected!`.

## 3. Frontend

```bash
cd Zelosify-Frontend
cp .env.example .env    # only if .env does not already exist
```

`.env` must keep:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000/api/v1
```

Then:

```bash
npm ci
npm run dev
```

Open http://localhost:5173. Do not switch to another port; CORS and cookies are configured for `5173`.

## 4. First login (from the setup guide)

1. Create a tenant in Prisma Studio (`npm run prisma:studio` in `Zelosify-Backend/Server`).
2. Register a user with `POST http://localhost:5000/api/v1/auth/register` (roles such as `IT_VENDOR` or `HIRING_MANAGER`).
3. Scan the returned TOTP QR code in an authenticator app.
4. Sign in at http://localhost:5173/login with username, password, and TOTP.

Hiring manager UI: `/business-user/hiring`
Vendor openings UI: `/vendor/openings`

## Stop locally

```bash
# App processes
fuser -k 5173/tcp 5000/tcp 2>/dev/null || true

# Docker stack (keeps volumes)
cd Zelosify-Backend/Server
docker compose stop
```

Regards,
Hirely
