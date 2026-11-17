summary: |
  A restaurant partner sets several open time slots per weekday (in the local time of the restaurant's city, stored as an IANA timezone) and flips a temporarily-closed switch. The Platform API stores the hours and the switch, exposes partner endpoints to read/save/close/reopen, and enforces them when a customer places an order: refused if temporarily closed or if the restaurant-local time is not inside a slot (start inclusive, end exclusive), accepted otherwise. Already-placed orders are never touched by closing. The Web App gets the approved "Opening hours" page (status card, weekly day rows with removable slot chips, Add slot modal, Save hours, closed banner, error and loading states). The repo is a bare scaffold (health controller and a placeholder App only), so the plan also creates the minimal restaurant, slot and order tables the rules need.
scope:
  - description: |
      Pure domain rules, written first. `isOpenAt(hours, closed, now, timezone)` converts the instant to restaurant-local weekday and minutes using `Intl.DateTimeFormat` with the restaurant's IANA timezone (no new package), then tests `opensAt <= t < closesAt` over that weekday's slots. Also `validateWeek(days)`: every weekday must have at least one slot, `HH:mm` format, close after open, no overlap within a day, no crossing midnight.
      ```ts
      export type Weekday = 'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun';
      export interface Slot { opensAt: string; closesAt: string } // 'HH:mm', closesAt exclusive
      export type WeekHours = Record<Weekday, Slot[]>;
      export function isOpenAt(hours: WeekHours, temporarilyClosed: boolean, now: Date, timeZone: string): boolean;
      export function validateWeek(hours: WeekHours): { weekday: Weekday; reason: 'NO_SLOTS'|'INVALID_SLOT'|'OVERLAP' }[];
      ```
    files:
      - services/api/src/opening-hours/opening-hours.domain.ts
      - services/api/src/opening-hours/opening-hours.domain.spec.ts
    rationale: Covers AC 5-9 with no I/O, so the time-zone and end-exclusive edge cases are tested in isolation.
  - description: |
      Schema and migration runner. The repo has no migrations or runner, so add `services/api/migrations/0001_opening_hours.sql` and a small `services/api/src/db/migrate.ts` (applies unapplied `.sql` files in order inside a transaction, tracked in a `schema_migrations` table; `pnpm migrate` script). Tables follow ADR-0011 (shared tables with a tenant_id column):
      ```sql
      create table restaurants (
        id uuid primary key, tenant_id uuid not null, name text not null,
        city text not null, time_zone text not null,           -- IANA, e.g. America/Bogota
        temporarily_closed boolean not null default false);
      create table opening_slots (
        restaurant_id uuid not null references restaurants(id) on delete cascade,
        weekday smallint not null check (weekday between 1 and 7), -- ISO, 1 = Monday
        opens_at time not null, closes_at time not null check (closes_at > opens_at),
        primary key (restaurant_id, weekday, opens_at));
      create table orders (
        id uuid primary key, restaurant_id uuid not null references restaurants(id),
        status text not null default 'placed', placed_at timestamptz not null default now());
      ```
      `create table if not exists` is used because STORY-019/020 (listing, menu) may land a `restaurants` table first; whichever merges second reconciles columns (see open questions).
    files:
      - services/api/migrations/0001_opening_hours.sql
      - services/api/src/db/migrate.ts
      - services/api/package.json
    rationale: Persistence is needed for hours, the switch and the placed-order guarantee (AC 1, 2, 10).
  - description: |
      Repository plus service. `OpeningHoursRepository` (pg) with `getWeek(restaurantId)`, `replaceWeek(restaurantId, hours)` (delete and insert in one transaction, so a failed save leaves the old hours), `setTemporarilyClosed(restaurantId, closed)`. `OpeningHoursService` calls `validateWeek` and throws a 400 naming the weekdays that have no slots (AC 9). The service never reads or writes `orders`.
      ```ts
      class OpeningHoursService {
        getHours(restaurantId: string): Promise<OpeningHoursDto>;
        saveHours(restaurantId: string, week: WeekHours): Promise<OpeningHoursDto>; // BadRequestException on invalid
        setTemporarilyClosed(restaurantId: string, closed: boolean): Promise<OpeningHoursDto>;
      }
      ```
    files:
      - services/api/src/opening-hours/opening-hours.repository.ts
      - services/api/src/opening-hours/opening-hours.service.ts
      - services/api/src/opening-hours/opening-hours.service.spec.ts
    rationale: AC 1, 2, 9. Unit-tested against an in-memory fake repository, matching the existing plain vitest style (see health.controller.spec.ts).
  - description: |
      Partner HTTP surface and access control. Controller routes (all scoped to the signed-in partner's own restaurant, with the tenant check in the access-control layer per ADR-0011):
      ```
      GET /partner/restaurant/opening-hours
      PUT /partner/restaurant/opening-hours        body { days: { weekday, slots: [{opensAt, closesAt}] }[] }
      PUT /partner/restaurant/temporary-closure    body { closed: boolean }
      ```
      A `PartnerGuard` rejects unauthenticated callers with 401 and non-partners with 403 and attaches `restaurantId` to the request. Authentication (Entra ID, ADR-0008) does not exist in the repo yet; the guard reads an injected `PrincipalResolver` so the real resolver can be dropped in later (open question).
    files:
      - services/api/src/opening-hours/opening-hours.controller.ts
      - services/api/src/opening-hours/opening-hours.controller.spec.ts
      - services/api/src/auth/partner.guard.ts
      - services/api/src/opening-hours/opening-hours.module.ts
      - services/api/src/app.module.ts
    rationale: AC 1, 2, 9 end to end at the API; "signed-in restaurant partner" is a stated precondition of those ACs.
  - description: |
      Order gate. `OrdersService.placeOrder(restaurantId, now = clock.now())` reads the restaurant row (closed flag, time zone) and its slots in ONE transaction at the moment of the request (no caching, so a close is effective immediately for AC 3), calls `isOpenAt`, and either inserts an `orders` row with status `placed` or throws a 409 `RESTAURANT_CLOSED` (code `TEMPORARILY_CLOSED` or `OUTSIDE_OPENING_HOURS`). `Clock` is an injectable provider so tests pin the instant. Route: `POST /restaurants/:restaurantId/orders`. Order content (items, payment) is out of scope; this only records the placement and the guard.
    files:
      - services/api/src/orders/orders.service.ts
      - services/api/src/orders/orders.controller.ts
      - services/api/src/orders/orders.service.spec.ts
      - services/api/src/orders/orders.module.ts
      - services/api/src/common/clock.ts
      - services/api/src/app.module.ts
    rationale: AC 3-8 and 10. Closing only sets a flag, so orders already placed stay `placed` (AC 10).
  - description: |
      Load the design tokens and component styles in the web app, once. `apps/web/src/index.css` currently holds only `@import "tailwindcss";` and `main.tsx` imports it (line 3). Add, after the tailwind import, `@import "../../../design-system/tokens.css";` and `@import "../../../design-system/prototype-utils.css";` (these define the `.btn*`, `.card`, `.badge*`, `.alert*`, `.field*`, `.input`, `.select`, `.modal`, `.backdrop`, `.toast`, `.skeleton` classes the prototype uses). Check `vite.config.ts` still serves files outside the app root (`server.fs.allow`) and add it if the build or dev server rejects the path.
    files:
      - apps/web/src/index.css
      - apps/web/vite.config.ts
    rationale: The app does not load the design-system tokens yet, so every token named below would be undefined.
  - description: |
      Opening hours page, built from the approved prototype ("Opening hours" screen). Elements: page head (h1 "Opening hours" and the lede "Times are in the local time of your restaurant's city, {city} (UTC−05:00)" with the offset computed from the restaurant's time zone, not hard-coded); status card (`card` with "Restaurant status: Open" plus `badge-success`, and a `btn-secondary` "Temporarily close"); weekly list (`card` with one `day-row` per weekday: day name, slot chips each with a remove button labelled "Remove {Day} slot {a – b}" at `--tap-target` size, and a `btn-secondary btn-sm` "Add slot"); one `btn-primary` "Save hours". Closed state: `alert-warning` banner "Restaurant is temporarily closed. Customers cannot place new orders. Orders already placed are not cancelled.", status card with `badge-danger` "Closed" and `btn-primary` "Reopen restaurant" (the single primary in that view), hours read-only. Error state: `alert-danger` (role="alert") "Your hours were not saved. {Days} has no open time slots. Add at least one slot to each weekday." and the offending `day-row` marked with `--color-danger-subtle` background and `--space-1` left border in `--color-danger`. Loading: `skeleton` cards with role="status" and aria-label "Loading opening hours". Add slot modal (`modal` + `backdrop`, Opens/Closes `input type=time`, inline `field-error` for missing time, close not after open, overlap) with focus trap and Esc to close. Success feedback via `toast` ("Hours saved." and the closed/reopened messages). Close and reopen are instant with no confirmation, as the design shows. A failed fetch shows an `alert-danger` with a "Try again" `btn-secondary`.
      Slot-chip and day-row are not in the design system; define them in `opening-hours.css` on tokens only: `--space-1/2/3`, `--border-width`, `--color-border`, `--color-border-strong`, `--radius-full`, `--color-bg`, `--color-fg-muted`, `--color-danger`, `--color-danger-subtle`, `--tap-target`, `--font-weight-medium`. No hex or pixel literals.
      Data hook `useOpeningHours` calls `api.ts` (`GET`/`PUT` above) and replaces the prototype's seed JSON; there is no fixture in production code. The prototype's "Check a customer order" card is a review aid and is NOT built; AC 3-8 are covered by API tests.
      Mounting: `App.tsx` renders `OpeningHoursPage` directly (no router in the repo; adding one is not needed for this story).
    files:
      - apps/web/src/App.tsx
      - apps/web/src/opening-hours/OpeningHoursPage.tsx
      - apps/web/src/opening-hours/DayRow.tsx
      - apps/web/src/opening-hours/SlotModal.tsx
      - apps/web/src/opening-hours/useOpeningHours.ts
      - apps/web/src/opening-hours/api.ts
      - apps/web/src/opening-hours/opening-hours.css
      - apps/web/src/opening-hours/OpeningHoursPage.test.tsx
      - apps/web/src/opening-hours/SlotModal.test.tsx
      - apps/web/e2e/opening-hours.spec.ts
    rationale: Delivers AC 1, 2, 9 to the partner with the approved layout and states.
tests:
  - |
    Domain (opening-hours.domain.spec.ts), written first. AC 7 and 5, restaurant 5 hours behind UTC, slot 18:00-22:00, order at 18:30 local = 23:30 UTC:
    ```ts
    const hours = weekWith('tue', [{ opensAt: '18:00', closesAt: '22:00' }]);
    expect(isOpenAt(hours, false, new Date('2026-11-17T23:30:00Z'), 'America/Bogota')).toBe(true);
    ```
  - |
    AC 8 end exclusive, and AC 6 outside slots (same fixture):
    ```ts
    expect(isOpenAt(hours, false, new Date('2026-11-18T03:00:00Z'), 'America/Bogota')).toBe(false); // 22:00 local Tue
    expect(isOpenAt(hours, false, new Date('2026-11-17T20:00:00Z'), 'America/Bogota')).toBe(false); // 15:00 local
    expect(isOpenAt(hours, false, new Date('2026-11-17T23:00:00Z'), 'America/Bogota')).toBe(true);  // 18:00 local start inclusive
    ```
    Plus a weekday-boundary case: 2026-11-18T03:30Z is Tuesday 22:30 in Bogota but Wednesday in UTC; it must be judged against Tuesday's slots.
  - |
    AC 4 temporarily closed inside a slot:
    ```ts
    expect(isOpenAt(hours, true, new Date('2026-11-17T23:30:00Z'), 'America/Bogota')).toBe(false);
    ```
  - |
    AC 9 validation, in domain and service specs:
    ```ts
    expect(validateWeek({ ...fullWeek, sun: [] })).toEqual([{ weekday: 'sun', reason: 'NO_SLOTS' }]);
    await expect(service.saveHours(rid, { ...fullWeek, sun: [] })).rejects.toBeInstanceOf(BadRequestException);
    expect((await service.getHours(rid)).days.sun.slots).toEqual(before.days.sun.slots); // nothing persisted
    ```
    Also rejects close <= open, overlap and midnight crossing.
  - |
    AC 1 (service spec and controller spec): saving two slots for Monday returns and then reads back both:
    ```ts
    await service.saveHours(rid, week);
    expect((await service.getHours(rid)).days.mon.slots).toEqual([{ opensAt: '11:00', closesAt: '14:30' }, { opensAt: '18:00', closesAt: '22:00' }]);
    ```
    Controller spec: unauthenticated request gets 401, partner of another restaurant cannot read or change this one (403/404).
  - |
    AC 2 close then reopen, service spec:
    ```ts
    await service.setTemporarilyClosed(rid, true);
    await service.setTemporarilyClosed(rid, false);
    expect((await service.getHours(rid)).temporarilyClosed).toBe(false);
    ```
    The saved slots are unchanged after the round trip.
  - |
    AC 3 close then order immediately (orders.service.spec.ts, fake clock pinned inside a slot, shared in-memory store):
    ```ts
    await expect(orders.placeOrder(rid)).resolves.toMatchObject({ status: 'placed' });
    await hours.setTemporarilyClosed(rid, true);
    await expect(orders.placeOrder(rid)).rejects.toMatchObject({ response: { code: 'TEMPORARILY_CLOSED' } });
    ```
  - |
    AC 4, 5, 6 at the order service (clock pinned; closed flag; inside slot; outside slot): closed gives 409 `TEMPORARILY_CLOSED` and no row inserted; inside a slot returns `{ status: 'placed' }`; outside gives 409 `OUTSIDE_OPENING_HOURS` and no row inserted (`expect(store.orders).toHaveLength(0)`).
  - |
    AC 7 and 8 again at the order service with a Bogota restaurant (`timeZone: 'America/Bogota'`, slot 18:00-22:00): clock 23:30Z is accepted, clock 03:00Z next day (22:00 local) is refused with `OUTSIDE_OPENING_HOURS`.
  - |
    AC 10 placed order survives closing (orders.service.spec.ts):
    ```ts
    const placed = await orders.placeOrder(rid);
    await hours.setTemporarilyClosed(rid, true);
    expect(store.orders.find(o => o.id === placed.id)?.status).toBe('placed');
    ```
  - |
    Web, OpeningHoursPage.test.tsx with a mocked `api.ts`. AC 1: renders one row per weekday with its slots as chips (`expect(screen.getByText('18:00 – 22:00')).toBeInTheDocument()`). AC 2: clicking "Temporarily close" shows the "Closed" badge and the warning banner, read-only rows, and "Reopen restaurant" brings back the "Open" badge. AC 9: when the save call rejects with a no-slots error, `screen.getByRole('alert')` contains "Sunday has no open time slots" and "Save hours" does not show the saved toast. Loading shows `getByRole('status', { name: 'Loading opening hours' })`. Fetch failure shows the alert and "Try again".
  - |
    Web, SlotModal.test.tsx: close time before open shows `field-error` "Closing time must be after opening time. A slot cannot cross midnight." and sets `aria-invalid` on both inputs; an overlapping slot shows the overlap message; Esc closes the modal and focus returns to the "Add slot" trigger.
  - |
    Playwright e2e (apps/web/e2e/opening-hours.spec.ts), partner journey against route-mocked API: add a slot to a day, save, reload and see it; close, see the banner; reopen. Run with `pnpm e2e` in apps/web.
  - |
    Narrow commands while developing: `(cd services/api && pnpm exec vitest run src/opening-hours src/orders)` and `(cd apps/web && pnpm exec vitest run src/opening-hours)`; full gate is the project test command.
assumptions_or_open_questions:
  - |
    The repo is a bare scaffold: no restaurant, authentication, order, migration or router code exists (searched services/api/src, services/worker/src, apps/web/src, and grepped the worktree for restaurant/order/migrat outside node_modules). Stories 019/020 (listing, menu) are referenced by the design but not merged. This plan creates a minimal `restaurants` table and an `orders` placement record; if 019 or a customer-ordering story lands first, reconcile columns and reuse its table instead. Please confirm the split.
  - |
    Sign-in: ADR-0008 says Entra ID SSO, but no auth code exists. The plan guards routes with a `PartnerGuard` over an injectable `PrincipalResolver` and tests it with a fake; the real Entra resolver and the partner-to-restaurant mapping are outside this story. Is that acceptable?
  - |
    One partner manages exactly one restaurant (the routes use `/partner/restaurant/...` with no id). Confirm, or the routes need `:restaurantId`.
  - |
    Time zone is stored per restaurant as an IANA name (for example America/Bogota), from the restaurant's city; the plan does not build a city-to-zone lookup. Who sets it, and is it already part of the listing story? DST handled by Intl, so the UTC-5 in the lede is derived, not fixed.
  - |
    Prototype conflicts with the UI guidelines: the guidelines call for a top bar plus left sidebar shell (Dashboard, Projects, Activity, Settings) while the prototype draws its own "Partner Portal" bar with Listing, Menu and Opening hours links and no sidebar. The plan builds the page content only and does not add a shell or nav; the prototype's partner bar links to screens that do not exist. Decide which shell wraps the page.
  - |
    Prototype assumptions kept as decided: slots end exclusive, cannot cross midnight, may not overlap; closing is instant with no confirmation; the closed state keeps hours read-only; a weekday with zero slots is refused on save (so every weekday needs a slot and a partner cannot mark a day closed all day; this follows AC 9 literally). The "Orders already placed" list in the closed state needs an orders-by-restaurant endpoint that no AC asks for, so it is left out.
  - |
    The "Check a customer order" card is a prototype review aid and is not shipped.
  - |
    Deferred project-wide questions (retention of order, payment and personal data; backup and recovery targets; launch order volume and concurrency) do not change this design. ADR-0005 (1,000 concurrent users, 50 req/s) is met by one indexed read per order; the order gate runs one transaction of two small queries.
  - |
    Order attempts that are refused are not stored or audited; add an audit row only if asked.
estimated_points: 8
package_dependencies: []
notes: |
  ### Data & rollout
  - **Existing data**: no tables exist in the repo today, so migration 0001 creates `restaurants`, `opening_slots` and `orders` fresh and touches no rows. If 019 has already created `restaurants` in a deployed database, `create table if not exists` leaves it alone, and a follow-up `alter table restaurants add column if not exists time_zone text not null default 'UTC'` / `temporarily_closed boolean not null default false` keeps existing rows readable. Existing restaurants with no slots count as refusing orders until the partner saves hours; this is deliberate (closed unless hours are set).
  - **Backfill / seed**: none required. The migration runner records applied files in `schema_migrations`, so re-running is safe. A restaurant needs its `time_zone` set at creation; no seed is shipped.
  - **Settings**: reuses the existing `DATABASE_URL` (see services/worker/src/db.ts). No new setting or env var.
  - **Provisioning**: PostgreSQL reachable by the API with permission to create tables; the migration runs once per environment via `pnpm migrate` in services/api before the new code starts.
  - **Order and rollback**: migrate first, then deploy API, then Web App. Rollback: redeploy the previous API and Web App; the new tables are additive and can stay in place (no down migration, nothing else reads them).
  - A test that old rows stay usable after migration: a migration spec applies 0001 to a database that already holds a pre-existing `restaurants` row (only id, tenant_id, name, city) and asserts it is still returned by `getHours` with default hours empty and `temporarily_closed = false`.

  ### Design notes
  Tokens come from `design-system/tokens.css` and component classes from `design-system/prototype-utils.css` (both read). The prototype's own inline styles (`.day-row`, `.slot`, `.slot-x`, `.status-text`, `.head-row`, `.time-pair`) are recreated in `opening-hours.css` using tokens only. The prototype uses `.chip`-like pills but defines its own `.slot`; the plan keeps `.slot`. `--tap-target` (44px) is the remove button size.

  ```mermaid
  flowchart TD
    Main[main.ts] --> AppModule[app.module.ts]
    AppModule --> OHModule[opening-hours.module.ts]
    AppModule --> OrdersModule[orders.module.ts]
    OHModule --> OHController[opening-hours.controller.ts]
    OHController --> Guard[partner.guard.ts]
    OHController --> OHService[opening-hours.service.ts]
    OHService --> Domain[opening-hours.domain.ts]
    OHService --> Repo[opening-hours.repository.ts]
    OrdersModule --> OrdersController[orders.controller.ts]
    OrdersController --> OrdersService[orders.service.ts]
    OrdersService --> Domain
    OrdersService --> Repo
    Repo --> PG[(PostgreSQL via pg)]
    Web[OpeningHoursPage.tsx] --> WebApi[api.ts]
    WebApi --> OHController
    App[App.tsx] --> Web
    CSS[index.css] --> Tokens[design-system/tokens.css]
    classDef touched fill:#f96,color:#000
    class AppModule,OHModule,OrdersModule,OHController,Guard,OHService,Domain,Repo,OrdersController,OrdersService,Web,WebApi,App,CSS touched
  ```
  The domain function is shared so the partner-facing save rules and the customer-facing order gate cannot drift. Orders and hours share one repository read so the gate sees the switch the instant it is set.
review_focus: |
  Hold the plan to the ten ACs only: weekly slots, the temporarily-closed switch, the order gate, and the Opening hours page. Holiday closures, order contents or payment, menu, the Entra sign-in implementation, the app shell and the prototype's "Check a customer order" card are OUT. The riskiest parts are the local-time conversion (weekday must come from restaurant-local time, not UTC; end time exclusive) and the order gate reading the closed flag and slots in one uncached transaction so a close is immediate. The repo has no restaurant, auth or order code, so the minimal tables and `PartnerGuard` are deliberate stand-ins, flagged in the open questions.
