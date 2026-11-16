# Testing_16_Nov
## Restaurant listings (Platform API)

- `DATABASE_URL` — PostgreSQL connection string, read by the API (and the worker).
- `pnpm run migrate` (in `services/api`) applies `services/api/migrations/*.sql` once each; run it before starting the API.
- Interim actor seam: no sign-in exists yet, so `services/api/src/auth/actor.guard.ts` reads `x-user-id` and `x-user-role` (`partner`, `admin`, `customer`) request headers. These are spoofable and must be replaced by real authentication before release. The web app sends them from `VITE_ACTOR_ID` / `VITE_ACTOR_ROLE` (and `VITE_API_URL` for the API base URL).
