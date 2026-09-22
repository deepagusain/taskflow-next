# TaskFlow (Next.js)

Same app as the Python version, rebuilt in Next.js (App Router, TypeScript) with a small React
frontend. A task-management app for teams: sign up, create tasks, track status, upgrade to Pro
when you outgrow the free plan.

## Plans

- **Free** — up to 10 open tasks, single user
- **Pro** — unlimited tasks

## Running locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`.

## API routes

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register | Create an account |
| POST | /api/auth/login | Get an access token |
| GET | /api/auth/me | Current user + plan |
| GET | /api/tasks | List your tasks (filter with ?status=) |
| POST | /api/tasks | Create a task (blocked on Free plan past the limit) |
| GET | /api/tasks/:id | Get one task |
| PUT | /api/tasks/:id | Update a task |
| DELETE | /api/tasks/:id | Delete a task |
| POST | /api/billing/upgrade | Upgrade the current user to Pro |
| GET | /api/billing/plan | Current plan and usage |

## Tests

```bash
npm test
```
