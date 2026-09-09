# Office Attendance Planner

Personal tool to track office attendance against a rolling "best 8 of the last 12 weeks
≥ 24 days" policy, and to dynamically suggest the minimum future office days needed to
stay compliant.

- `domain/` -- pure TypeScript compliance/suggestion logic, fully unit tested
- `backend/` -- Fastify + Prisma API (deploys to Render, DB on Neon)
- `frontend/` -- Next.js dashboard (deploys to Vercel)

npm workspaces monorepo; a single root `package-lock.json` governs all three packages.

## Local development

```bash
npm install
npm run build            # builds domain, then backend
npm test                 # domain test suite

# backend (needs a local Postgres; see backend/.env.example)
cp backend/.env.example backend/.env
npm --prefix backend run prisma:migrate
npm run dev:backend

# frontend
cp frontend/.env.local.example frontend/.env.local
npm --prefix frontend run dev
```

## Deploying

### 1. Database -- Neon

1. Create a project at [neon.tech](https://neon.tech). Any region close to your Render
   region is fine.
2. Copy the pooled connection string (starts `postgresql://...`, includes
   `?sslmode=require`). This becomes `DATABASE_URL`.

### 2. Backend -- Render

Using the included `render.yaml` (Blueprint):

1. In the Render dashboard: **New > Blueprint**, point it at this GitHub repo.
2. Render reads `render.yaml` and creates the `eg-attendance-backend` web service.
3. Fill in the three secret env vars it leaves blank:
   - `DATABASE_URL` -- the Neon connection string from step 1
   - `APP_SECRET` -- a long random string (this is your app's password; generate one
     with `openssl rand -hex 32`)
   - `FRONTEND_ORIGIN` -- your Vercel URL once you have it (comma-separate if you add a
     custom domain later, e.g. `https://your-app.vercel.app,https://attendance.you.com`)
4. Deploy. The build command runs Prisma migrations automatically on every deploy
   (`prisma migrate deploy` is idempotent -- safe to re-run).
5. Confirm `https://<your-service>.onrender.com/health` returns `{"ok":true}`.

Without the Blueprint, create the service manually with the same values:
Root Directory blank, Build Command and Start Command copied from `render.yaml`,
Health Check Path `/health`.

### 3. Frontend -- Vercel

1. In Vercel: **New Project**, import this GitHub repo.
2. **Root Directory**: set to `frontend`.
3. Project Settings > General: enable **"Include source files outside of the Root
   Directory in the Build Step"** -- required so the build can see the sibling
   `domain/` package. (Vercel auto-detects the npm workspace root from the top-level
   `package-lock.json` once this is on.)
4. Environment Variables: add `NEXT_PUBLIC_API_URL` = your Render backend URL
   (e.g. `https://eg-attendance-backend.onrender.com`).
5. Deploy. Framework preset (Next.js) and build command (`npm run build`, which
   builds `domain` first, then `next build`) are auto-detected -- no overrides needed.
6. Once you have the Vercel URL, go back to Render and set `FRONTEND_ORIGIN` to it,
   then redeploy the backend (CORS needs to know your frontend's origin).

### 4. First run

Open the Vercel URL, enter the same `APP_SECRET` value as the access code, and start
logging attendance. Nothing else to configure -- the compliance and suggestion numbers
are computed fresh from whatever's in the database on every page load.

## Security notes

- This is a single-user tool. `APP_SECRET` is the only access control -- treat it like
  a password. There is no per-user auth, sessions, or rate limiting.
- The access code is stored in the browser's `localStorage`, not baked into the
  frontend's JS bundle.
