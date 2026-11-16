summary: |
  Build the restaurant listing lifecycle end to end. A signed-in restaurant partner creates exactly one listing (name, cuisine, address/city, description), sees its status (pending approval, approved, rejected), edits it (any edit sends it back to pending approval, which also hides it from customers), and resubmits after a rejection. An admin sees a queue of pending listings and approves or rejects each. Customers only ever see approved listings. Work spans the Platform API (NestJS + PostgreSQL: migration, domain service, role-guarded endpoints, customer-visible query) and the Web App (React + Vite: the "Restaurant listing" and "Listing approvals" screens from the approved prototype, built on the design-system tokens). The repo is a bare scaffold (health endpoint and a placeholder App only), so this item also creates the minimal persistence and actor/role seam it needs.
scope:
  - description: |
      API schema and migration. Add a plain SQL migration creating `restaurant_listings` and a tiny migration runner using the existing `pg` dependency (no ORM, none is in the stack).
      Columns: id uuid primary key, owner_id text NOT NULL UNIQUE (one listing per partner account, AC 12, enforced in the database as well as in the service), name, cuisine, address_city, description (all text NOT NULL with a CHECK that btrim(value) <> ''), status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')), created_at, updated_at timestamptz.
      Runner signature: `export async function migrate(pool: pg.Pool, dir?: string): Promise<string[]>` returning applied file names, recording them in a `schema_migrations` table so it is idempotent.
    files:
      - services/api/migrations/001_restaurant_listings.sql
      - services/api/src/db/migrate.ts
      - services/api/src/db/migrate.spec.ts
      - services/api/package.json
    rationale: |
      No schema, migration tool or user table exists in the repo (searched services/, apps/). Plain SQL keeps to the confirmed stack (PostgreSQL, pg). package.json gets a `migrate` script (`tsc -p tsconfig.build.json && node dist/db/migrate.js`); no new dependency.
  - description: |
      Domain service with a repository port, so the rules are unit-testable without a database.
      ```ts
      export type ListingStatus = 'pending' | 'approved' | 'rejected';
      export interface Listing { id: string; ownerId: string; name: string; cuisine: string; addressCity: string; description: string; status: ListingStatus; }
      export interface ListingInput { name: string; cuisine: string; addressCity: string; description: string; }
      export interface ListingRepository {
        insert(ownerId: string, input: ListingInput): Promise<Listing>;   // throws DuplicateOwnerError on unique violation (23505)
        findByOwner(ownerId: string): Promise<Listing | null>;
        updateByOwner(ownerId: string, input: ListingInput, status: ListingStatus): Promise<Listing | null>;
        findById(id: string): Promise<Listing | null>;
        setStatus(id: string, from: ListingStatus, to: ListingStatus): Promise<Listing | null>; // conditional UPDATE ... WHERE status = from
        listByStatus(status: ListingStatus): Promise<Listing[]>;
      }
      export class ListingService {
        create(actor: Actor, input: ListingInput): Promise<Listing>;      // partner only, all four fields non-blank, no existing listing
        getMine(actor: Actor): Promise<Listing>;                          // 404 when none
        updateMine(actor: Actor, input: ListingInput): Promise<Listing>;  // always sets status 'pending' (AC 9, 10, 14)
        listPending(actor: Actor): Promise<Listing[]>;                    // admin only
        approve(actor: Actor, id: string): Promise<Listing>;              // admin only, pending -> approved
        reject(actor: Actor, id: string): Promise<Listing>;               // admin only, pending -> rejected
        listVisibleToCustomers(): Promise<Listing[]>;                     // status = 'approved' only
      }
      ```
      Errors map to HTTP: not partner/admin -> ForbiddenException (403), unauthenticated -> UnauthorizedException (401), blank field -> BadRequestException (400) naming each empty field, duplicate -> ConflictException (409), approve/reject of a non-pending or unknown listing -> ConflictException (409) / NotFoundException (404).
      Provide `InMemoryListingRepository` (used by unit tests) and `PgListingRepository` (parameterised queries on a `pg.Pool`, injected via a `PG_POOL` provider reading `DATABASE_URL`, same pattern as services/worker/src/db.ts).
    files:
      - services/api/src/restaurants/listing.types.ts
      - services/api/src/restaurants/listing.repository.ts
      - services/api/src/restaurants/pg-listing.repository.ts
      - services/api/src/restaurants/in-memory-listing.repository.ts
      - services/api/src/restaurants/listing.service.ts
      - services/api/src/restaurants/listing.service.spec.ts
      - services/api/src/restaurants/pg-listing.repository.spec.ts
    rationale: |
      Concentrates every acceptance rule (one per partner, edit resets to pending, only admins moderate, customers see approved only) in one tested place. `setStatus` is a conditional UPDATE so two admins racing cannot flip an already-decided listing.
  - description: |
      HTTP layer and actor seam. `Actor = { id: string; role: 'partner' | 'admin' | 'customer' }`. An `ActorGuard`/`@CurrentActor()` decorator resolves the actor from the request; the service does the role checks. Endpoints (all JSON):
      - POST /restaurant-listings (create, AC 1, 6, 12, 15)
      - GET /restaurant-listings/mine and PUT /restaurant-listings/mine (view and edit/resubmit, AC 2, 9, 11, 13, 14)
      - GET /admin/restaurant-listings?status=pending, POST /admin/restaurant-listings/:id/approve, POST /admin/restaurant-listings/:id/reject (AC 4, 5, 7, 8)
      - GET /restaurants (customer-visible: approved listings only, AC 3, 4, 5, 10). This is the minimum visibility query the ACs need; the customer browsing UI, search and filters stay a separate story.
      Register `RestaurantsModule` in app.module.ts alongside HealthController. Responses expose `{ id, name, cuisine, addressCity, description, status }` and never `ownerId` on the customer endpoint.
    files:
      - services/api/src/auth/actor.ts
      - services/api/src/auth/actor.guard.ts
      - services/api/src/restaurants/restaurants.controller.ts
      - services/api/src/restaurants/admin-listings.controller.ts
      - services/api/src/restaurants/restaurants.module.ts
      - services/api/src/restaurants/restaurants.controller.spec.ts
      - services/api/src/app.module.ts
    rationale: |
      The repo has no authentication yet (ADR-0008 names Microsoft Entra ID as the outbound identity integration, but nothing is implemented). Actor resolution is isolated in one guard so the later sign-in work replaces only that file. See assumptions for the interim mechanism.
  - description: |
      Web: load the design system once. Import `design-system/tokens.css` and `design-system/prototype-utils.css` (this file defines the prototype's `.btn`, `.btn-primary`, `.btn-secondary`, `.card`, `.field`, `.input`, `.select`, `.textarea`, `.field-hint`, `.field-error`, `.is-invalid`, `.badge-*`, `.alert-*`, `.empty-state`, `.skeleton`, `.toast`, `.stack`, `.cluster`) at the top of apps/web/src/index.css, after `@import "tailwindcss";` (currently line 1, which imports only Tailwind). main.tsx already imports `./index.css` (line 3), so no entry change is needed. Add `server.fs.allow` for the repo root in vite.config.ts because the css lives outside apps/web. Add `apps/web/src/shell.css` defining the prototype's inline-only classes on tokens: `.shell*`, `.nav-link` (taken from the design-system app-shell.html), plus `.panel` (max-width 40rem), `.actions`, `.head-row`, `.facts`, `.lede`, `.queue`, `.queue-item`, `.sr-only`.
    files:
      - apps/web/src/index.css
      - apps/web/src/shell.css
      - apps/web/vite.config.ts
    rationale: |
      Tailwind is the confirmed styling tool, but the approved prototype is built on design-system classes and tokens, which is what UI-GUIDELINES.md requires. Tailwind utilities remain available; components here use the design-system classes. No colour or pixel literals are introduced: only var(--token) values (--space-1..5, --color-*, --radius-*, --font-size-*, --content-max-width, --nav-width, --tap-target, --border-width).
  - description: |
      Web: API client and screens. Replace the placeholder App.tsx with the shell from the prototype (header with brand and Account link, left nav Dashboard/Projects/Activity/Settings with `aria-current="page"` on Dashboard, menu button below 48em, `<main class="shell-main">` containing `.shell-content`). Both screens sit under Dashboard, as the prototype notes (the shell has no restaurant entries). A small in-app switch (no router dependency) shows the partner screen or the admin screen by actor role.
      Screen "Restaurant listing" (`RestaurantListingPage`), h1 "My restaurant listing", states from the prototype: loading (a `.card` with four `.skeleton` lines, `role="status"`), default/create (lede "Create your restaurant. An admin reviews it before customers can see it.", `.card.stack.panel` form with Restaurant name input, Cuisine select ("Select a cuisine" plus Indian, Italian, Thai, Chinese, Lebanese, Mexican), Address / city input, Description textarea, Cancel `.btn-secondary` and "Submit for approval" `.btn-primary`), error (`.alert-danger role="alert"` "Fill in every field: name, cuisine, address / city and description. Nothing was submitted.", typed values kept, each empty field `.is-invalid` with `aria-invalid` and `.field-error` such as "Name is required. Enter your restaurant's name."), not-partner (`.empty-state role="alert"` "You can't create a listing"), exists (`.empty-state` "You already have a listing" with "View my listing"), pending (`.alert-warning` "Status: pending approval. Customers can't see this restaurant until an admin approves it.", card with `.badge-warning` "Pending approval", `<dl class="facts">` Cuisine / Address / city / Description / Shown to customers "Hidden until approved", "Edit listing"), approved (`.alert-success`, `.badge-success`, "Visible"), editing (prefilled form, hint "Saving sends the listing back for approval. Customers won't see the changes, or the restaurant, until an admin approves it.", Cancel and "Save and submit for approval"), rejected (`.alert-danger`, `.badge-danger`, "Hidden", primary "Edit and resubmit"). A success `toast` "Listing submitted for approval" follows a save.
      Screen "Listing approvals" (`ListingApprovalsPage`), h1 "Restaurant listings awaiting approval": loading (two `.card.queue-item` with skeletons), default (`ul.queue.stack` of `.card.queue-item`, each with name, "cuisine, address", `.badge-warning` "Pending approval", primary "Approve" and secondary "Reject"), empty (`.empty-state` "Nothing to review"), approved and rejected confirmations (`.alert-success` "<name> is approved and now visible to customers." / `.alert-danger` "<name> is rejected. It stays hidden from customers until the partner edits and resubmits it." and the updated list, "Back to queue"), not-admin (`.empty-state role="alert"` "Admins only"). Reject has no confirm modal, matching the prototype note (reversible by edit and resubmit); only one `.btn-primary` per row is the prototype's choice and is kept.
      Data comes from the API (no seed data in production code): `listingsApi.ts` exposes `createListing`, `getMyListing`, `updateMyListing`, `listPending`, `approveListing`, `rejectListing`, mapping 403 to the not-partner/not-admin states, 409 on create to the exists state, 400 to the error state, 404 on getMine to the create form.
    files:
      - apps/web/src/App.tsx
      - apps/web/src/api/listingsApi.ts
      - apps/web/src/pages/RestaurantListingPage.tsx
      - apps/web/src/pages/ListingApprovalsPage.tsx
      - apps/web/src/components/ListingForm.tsx
      - apps/web/src/components/StatusBadge.tsx
      - apps/web/src/pages/RestaurantListingPage.test.tsx
      - apps/web/src/pages/ListingApprovalsPage.test.tsx
      - apps/web/src/App.test.tsx
    rationale: |
      Builds the approved prototype's two screens and all their listed states against the real API. Sample data in the prototype's `#seed` block (Saffron & Spice, Bella Napoli) is not carried into production code; it is used only as test fixture values. The existing App.test.tsx asserts the placeholder heading and must be updated to match the new shell.
tests:
  - |
    AC 1 (create). Write first in listing.service.spec.ts, fails because ListingService does not exist:
    ```ts
    const svc = new ListingService(new InMemoryListingRepository());
    const created = await svc.create({ id: 'p1', role: 'partner' }, { name: 'Saffron & Spice', cuisine: 'Indian', addressCity: '12 High Street, Leeds', description: 'Family-run kitchen' });
    expect(created.id).toBeTruthy();
    expect(created.status).toBe('pending');
    ```
    Also a controller spec: `POST /restaurant-listings` as partner returns 201.
  - |
    AC 2 (view shows entered fields).
    ```ts
    const mine = await svc.getMine(partner);
    expect(mine).toMatchObject({ name: 'Saffron & Spice', cuisine: 'Indian', addressCity: '12 High Street, Leeds', description: 'Family-run kitchen' });
    ```
    Web: RestaurantListingPage test mocks `fetch` to return that listing and asserts `screen.getByText('Saffron & Spice')`, `getByText('Indian')`, `getByText('12 High Street, Leeds')`, and the description in the facts list.
  - |
    AC 3 (pending is hidden from customers).
    ```ts
    await svc.create(partner, input);
    expect(await svc.listVisibleToCustomers()).toEqual([]);
    ```
    Controller spec: GET /restaurants returns `[]` while the only listing is pending.
  - |
    AC 4 (approve shows to customers; admin UI).
    ```ts
    const approved = await svc.approve({ id: 'a1', role: 'admin' }, created.id);
    expect(approved.status).toBe('approved');
    expect((await svc.listVisibleToCustomers()).map(l => l.id)).toEqual([created.id]);
    ```
    Web: ListingApprovalsPage test clicks "Approve" on "Saffron & Spice", asserts POST to `/admin/restaurant-listings/<id>/approve` and the text "Saffron & Spice is approved and now visible to customers."
  - |
    AC 5 (reject hides).
    ```ts
    const rejected = await svc.reject(admin, created.id);
    expect(rejected.status).toBe('rejected');
    expect(await svc.listVisibleToCustomers()).toEqual([]);
    ```
    Web: clicking "Reject" shows "is rejected. It stays hidden from customers until the partner edits and resubmits it."
  - |
    AC 6 (non-partner create refused).
    ```ts
    await expect(svc.create({ id: 'c1', role: 'customer' }, input)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.create({ id: 'a1', role: 'admin' }, input)).rejects.toBeInstanceOf(ForbiddenException);
    ```
    Controller spec: no actor headers gives 401; customer gives 403 and nothing is stored. Web: a 403 response renders the heading "You can't create a listing" with `role="alert"`.
  - |
    AC 7 (non-admin approve refused).
    ```ts
    await expect(svc.approve(partner, created.id)).rejects.toBeInstanceOf(ForbiddenException);
    expect((await repo.findById(created.id))!.status).toBe('pending');
    ```
    Web: 403 on approve renders "Admins only".
  - |
    AC 8 (non-admin reject refused).
    ```ts
    await expect(svc.reject(partner, created.id)).rejects.toBeInstanceOf(ForbiddenException);
    expect((await repo.findById(created.id))!.status).toBe('pending');
    ```
  - |
    AC 9 (edit approved goes to pending, shown to partner).
    ```ts
    await svc.approve(admin, created.id);
    const edited = await svc.updateMine(partner, { ...input, description: 'New menu focus' });
    expect(edited.status).toBe('pending');
    expect((await svc.getMine(partner)).status).toBe('pending');
    ```
    Parametrise over each of the four fields (`it.each(['name','cuisine','addressCity','description'])`). Web: after saving in the editing state the page shows the "Pending approval" badge and "Status: pending approval."
  - |
    AC 10 (edit approved hides from customers).
    ```ts
    await svc.approve(admin, created.id);
    await svc.updateMine(partner, { ...input, cuisine: 'Thai' });
    expect(await svc.listVisibleToCustomers()).toEqual([]);
    ```
  - |
    AC 11 (name change is saved and shown).
    ```ts
    await svc.updateMine(partner, { ...input, name: 'Saffron & Spice Kitchen' });
    expect((await svc.getMine(partner)).name).toBe('Saffron & Spice Kitchen');
    ```
    Web: editing the name field and clicking "Save and submit for approval" PUTs `/restaurant-listings/mine` with the new name and the heading shows "Saffron & Spice Kitchen".
  - |
    AC 12 (second listing refused).
    ```ts
    await svc.create(partner, input);
    await expect(svc.create(partner, input)).rejects.toBeInstanceOf(ConflictException);
    ```
    pg-listing.repository.spec.ts (runs against a real PostgreSQL when `DATABASE_URL` is set, skipped otherwise): a second insert for the same owner_id raises DuplicateOwnerError. Web: a 409 shows "You already have a listing" with a "View my listing" button.
  - |
    AC 13 (rejected status shown to partner).
    ```ts
    await svc.reject(admin, created.id);
    expect((await svc.getMine(partner)).status).toBe('rejected');
    ```
    Web: status rejected renders "Status: rejected." and the `Rejected` badge.
  - |
    AC 14 (edit and resubmit after rejection).
    ```ts
    await svc.reject(admin, created.id);
    const resubmitted = await svc.updateMine(partner, { ...input, description: 'Updated' });
    expect(resubmitted.status).toBe('pending');
    expect((await svc.listPending(admin)).map(l => l.id)).toContain(created.id);
    ```
    Web: the "Edit and resubmit" button opens the prefilled form.
  - |
    AC 15 (any empty field refused).
    ```ts
    it.each(['name', 'cuisine', 'addressCity', 'description'] as const)('refuses empty %s', async (field) => {
      await expect(svc.create(partner, { ...input, [field]: '   ' })).rejects.toBeInstanceOf(BadRequestException);
      expect(await repo.findByOwner('p1')).toBeNull();
    });
    ```
    Web: submitting the empty create form shows the `role="alert"` banner "Fill in every field", "Name is required. Enter your restaurant's name." beside the name input (`aria-invalid="true"`), keeps typed values, and issues no POST.
  - |
    Migration (existing rows and idempotency), migrate.spec.ts: running `migrate(pool)` twice returns the file list the first time and `[]` the second. Against a real PostgreSQL (when `DATABASE_URL` is set), a bare insert with a blank name fails the CHECK and a duplicate owner_id fails the UNIQUE constraint. The migration only creates new objects, so no existing rows are affected.
  - |
    Web shell (App.test.tsx updated): `render(<App />)`; `expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')` and the nav lists Dashboard, Projects, Activity, Settings in that order.
assumptions_or_open_questions:
  - |
    Sign-in does not exist in the repo and ADR-0008 (Microsoft Entra ID) is not implemented. This plan resolves the actor in a single ActorGuard from request headers `x-user-id` and `x-user-role` as an interim, test-friendly seam, and the web client sends them from a dev-only config. These headers are spoofable and MUST NOT ship to production: needs a decision on the real session/token mechanism (and how roles partner/admin are assigned) before release. Is a separate sign-in story planned?
  - |
    Customer look-up (AC 3, 4, 5, 10) is covered only by the minimal GET /restaurants returning approved listings. The customer browsing screen, search and filters are out of scope per the item's Scope text.
  - |
    One listing per partner account is keyed by owner_id (the actor id). A partner organisation with several accounts or several locations is not modelled.
  - |
    Cuisine is stored as free text; the web select offers the prototype's six values (Indian, Italian, Thai, Chinese, Lebanese, Mexican), which the prototype itself marks as invented sample data. Confirm the real cuisine list, and whether the API should validate against it.
  - |
    ADR-0011 (tenant isolation) is accepted but its content was not available to this plan; listings are owner-scoped only. Confirm whether a tenant/city column is needed on restaurant_listings.
  - |
    The prototype files the screens under Dashboard because the shell has no restaurant entries; the plan follows that and does not add nav items (the guidelines cap the sidebar at four).
  - |
    Prototype vs AC: the prototype's admin queue shows only pending listings, so an admin cannot re-review an approved or rejected listing until the partner edits it. This matches the ACs (no re-open step is asked for).
  - |
    No notification (email) is sent to the partner on approve/reject; none is requested.
  - |
    Project-wide deferred questions (data retention and backup targets; launch order volume and concurrent users) do not change this item's design. ADR-0005 (1,000 concurrent users, 50 req/s) is met by simple indexed queries; the unique owner_id and a status index cover every query here. Left open for the project owner.
  - |
    Playwright e2e is not planned for this item because the API has no database provisioned in the test environment; unit and component tests carry the ACs, and the pg repository spec runs only when DATABASE_URL is set.
estimated_points: 8
package_dependencies: []
notes: |
  ### Data & rollout
  - **Existing data**: None. The migration only creates the new `restaurant_listings` and `schema_migrations` tables; no existing table or row is altered (repo has no prior schema).
  - **Backfill / seed**: None needed. The migration runner is idempotent (skips files already recorded in `schema_migrations`). No seed data; the prototype's sample listings are not seeded.
  - **Settings**: `DATABASE_URL` (already read by services/worker/src/db.ts) is now also read by the API; unset means the API cannot reach the database, and the pg repository spec is skipped. Interim actor headers: no env var, see the open question. Document `DATABASE_URL` and the `migrate` script in README.md.
  - **Provisioning**: A PostgreSQL database reachable through `DATABASE_URL` (ADR-0004, RDS). `pnpm run migrate` in services/api creates the tables.
  - **Order and rollback**: Run the migration before starting the new API code. Rollback: the change is additive, so leaving the tables in place is safe; to undo, `DROP TABLE restaurant_listings;` (and remove the row from `schema_migrations`).

  Findings: services/api has only HealthController and AppModule; apps/web has only the placeholder App.tsx and `index.css` containing `@import "tailwindcss";`. `design-system/tokens.css` and `prototype-utils.css` exist but are not yet imported by the app. Test runners: vitest for API (`src/**/*.spec.ts`) and web (`src/**/*.test.{ts,tsx}`, jsdom, RTL).

  UI rules applied from design-system/UI-GUIDELINES.md: one primary button per view, status always a `badge` with a label (never colour alone), errors in the "what went wrong, how to fix" voice, `field-error` plus `is-invalid`, `skeleton` for loading, `empty-state` for empty lists, `toast` for completed actions, `alert` for problems, sentence case, no exclamation marks.

  ```mermaid
  flowchart TD
    main[main.ts] --> AppModule
    AppModule --> HealthController
    AppModule --> RestaurantsModule
    RestaurantsModule --> RC[restaurants.controller.ts]
    RestaurantsModule --> AC[admin-listings.controller.ts]
    RC --> Guard[actor.guard.ts]
    AC --> Guard
    RC --> Svc[listing.service.ts]
    AC --> Svc
    Svc --> Repo[PgListingRepository]
    Repo --> DB[(restaurant_listings)]
    Mig[db/migrate.ts] --> DB
    WebMain[web main.tsx] --> WApp[App.tsx]
    WebMain --> Css[index.css imports design-system tokens]
    WApp --> P1[RestaurantListingPage]
    WApp --> P2[ListingApprovalsPage]
    P1 --> Client[api/listingsApi.ts]
    P2 --> Client
    Client -->|HTTP| RC
    Client -->|HTTP| AC
    classDef touched fill:#f96,color:#000
    class AppModule,RestaurantsModule,RC,AC,Guard,Svc,Repo,Mig,WApp,Css,P1,P2,Client touched
  ```
review_focus: |
  In scope: listing create/view/edit/resubmit for a partner, admin approve/reject of pending listings, and a minimal approved-only customer query; out of scope are menus, hours, customer browsing UI and real sign-in. Riskiest areas: the edit-resets-to-pending rule (must hold for every field and from both approved and rejected states, ACs 9, 10, 14), role enforcement living in the service rather than only the UI, and the database constraints (unique owner_id, non-blank CHECKs, conditional status update). The header-based actor guard is a deliberate interim seam because no authentication exists in the repo; reviewers should not expect real sign-in here but should check it is isolated to one file.
