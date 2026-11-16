summary: |
  Build the single Dashboard screen in `apps/web` (React + Vite + Tailwind, vitest + Testing Library) as a layout of four independent section containers (index, SIP, watchlist, IPO) under a top bar (product name, user menu) with the period selector in the page head, exactly as the approved prototype shows. Each section loads on its own and in parallel (answers the open intake question: yes), and owns its loading (skeleton), empty (empty-state) and error (alert + Try again) views. Try again reloads only that section, is unlimited (project decision: no cap, no extra message), and shows the loading view until the reload ends. The whole-dashboard empty state shows only when watchlist and SIPs are both loaded-and-empty (never when either is loading or errored). Returning to the Dashboard after Buy, Apply, Add stock or Start a SIP reloads only the affected sections via a small stale-section registry. Section CONTENT (index data, SIP summary, watchlist rows, IPO rows) belongs to sibling epics; this plan builds the container, a typed per-section source seam they plug into, and minimal presentational renderers so the screen works end to end.

scope:
  - description: |
      Load the design system once in the app's entry stylesheet. `apps/web/src/index.css` currently holds only `@import "tailwindcss";` (read), and `main.tsx` line 3 imports it, so this is the one place to add:
      ```css
      @import "tailwindcss";
      @import "../../../design-system/tokens.css";
      @import "../../../design-system/prototype-utils.css";
      @import "./dashboard/dashboard.css";
      ```
      `tokens.css` supplies the `--space-*`, `--color-*`, `--font-size-*`, `--control-height-*`, `--tap-target`, `--content-max-width` tokens; `prototype-utils.css` defines the classes the prototype uses (`.card`, `.btn`, `.btn-primary`, `.btn-secondary`, `.alert`, `.alert-danger`, `.empty-state`, `.skeleton`, `.badge`, `.table`, `.table-wrap`, `.input`, `.avatar`, `.dropdown`, `.dropdown-menu`, `.dropdown-item`, `.stack`, `.cluster`, `.text-muted`, `.text-bold`).
    files:
      - apps/web/src/index.css
    rationale: |
      The app does not load the tokens today; every UI step below styles only with those tokens and classes. If Vite dev refuses the file outside the app root, add `server.fs.allow: ['../..']` in `apps/web/vite.config.ts`.

  - description: |
      Dashboard-only styles, copied from the prototype's own inline `<style>` (they are not in `design-system/`) and written only on tokens: `.tools` (flex row, `gap: var(--space-3)`, bottom border `var(--border-width) solid var(--color-border)`), `.tools .product` (`--font-size-lg`, `--font-weight-bold`, `margin-right:auto`), `.user-btn` (`--tap-target` square), `.menu-note`, `.page-head`, `.page-actions`, `.period`, `.dash` (grid, `gap: var(--space-3)`), `.dash-row` (flex-wrap), `.dash-slot`, `.dash-head`, `.dash-title`, `.dash-note`, `.state-box`, `.sk-grid`, `.sk-lg`, `.sk-md`, `.sk-block`, `.banner-wrap`, plus the row flex ratios per slot and the `max-width: 47.99em` rule that stacks the slots on phones. Content is capped with `--content-max-width`. No hex, rgb or raw px literals.
    files:
      - apps/web/src/dashboard/dashboard.css
    rationale: Reuses the approved layout; tokens only.

  - description: |
      Section state machine. Types and hook:
      ```ts
      export type SectionId = 'index' | 'sip' | 'watchlist' | 'ipo'
      export type SectionState<T> =
        | { status: 'loading' }
        | { status: 'error' }
        | { status: 'empty' }
        | { status: 'loaded'; data: T }
      export interface SectionSource<T> {
        load(signal: AbortSignal, ctx: { period: Period }): Promise<T>
        isEmpty(data: T): boolean
      }
      export function useSection<T>(source: SectionSource<T>, deps?: unknown[]):
        { state: SectionState<T>; retry(): void; reload(): void }
      ```
      Starts in `loading` on mount, loads independently of every other section, and ignores a stale response (request counter plus `AbortController`). `retry()` and `reload()` set `loading` immediately, then `loaded`/`empty`/`error`. There is deliberately NO failure counter, so Try again is unlimited and a failed reload returns to plain `error` (project decision from EPIC-012; AC6, AC7, AC8). A second press while loading is ignored.
    files:
      - apps/web/src/dashboard/useSection.ts
      - apps/web/src/dashboard/types.ts
    rationale: One hook per section keeps the four sections isolated (AC9) and parallel.

  - description: |
      `SectionSlot` container component. Props: `{ title: string; state: SectionState<T>; empty: { heading; body; actionLabel; onAction? }; onRetry(): void; children(data: T): ReactNode; leader?: boolean }`. Renders, per the prototype:
      - loading: `<h2 class="dash-title">`, a `role="status"` stack with "Loading {title}…" and `.skeleton` blocks (`.sk-grid` of four `.sk-block` for index), `aria-busy="true"` on the section;
      - empty: `.empty-state` with heading, body text and one `btn-secondary` action (copy from the prototype: "No index data for this period", "No SIPs yet" with "Start a SIP", "Your watchlist is empty" with "Add stock", "No IPOs open or upcoming" with "View all IPOs");
      - error: `.alert .alert-danger` "{title} could not be loaded" / "Check your connection and try again." and a `btn btn-secondary` "Try again";
      - loaded: `children(data)`.
      The section element has `tabindex="-1"` and `aria-live="polite"`. After a retry it moves focus to the Try again button on failure and to the section on success. Index and SIP each span two slots (cards plus chart; summary plus list): only the leader slot shows loading/empty/error and the follower slots are hidden, as in the prototype.
    files:
      - apps/web/src/dashboard/SectionSlot.tsx
    rationale: Owns empty, loading, error and Try again for every section (AC2 to AC9, AC15 to AC17).

  - description: |
      Page composition. `DashboardPage` calls `useSection` four times and lays out: tools row (`TopBar`), page head (`h1` "Dashboard", `PeriodSelector`, primary "Add stock" button, the single `btn-primary` per view), then `index` cards, a row of chart + SIP summary, a row of watchlist + SIP list, and the IPO section. Banner `.alert-danger role="alert"` reading "{n} of 4 sections could not be loaded. The other sections are up to date." appears only while n is above 0 (prototype; it is not in the ACs, see open questions). `isWholeDashboardEmpty = watchlist.status === 'empty' && sip.status === 'empty'`; when true the four sections are replaced by the prototype's `.empty-state` ("No stocks or SIPs yet", actions "Add stock" and "Start a SIP"). Loading and error never count as empty (AC10 to AC13). Changing the period reloads only the index section.
      ```ts
      export const isWholeDashboardEmpty = (w: SectionState<unknown>, s: SectionState<unknown>) =>
        w.status === 'empty' && s.status === 'empty'
      ```
    files:
      - apps/web/src/dashboard/DashboardPage.tsx
      - apps/web/src/dashboard/PeriodSelector.tsx
      - apps/web/src/dashboard/WholeDashboardEmpty.tsx
    rationale: Layout and the whole-dashboard rule (AC1, AC10 to AC13, AC19).

  - description: |
      `TopBar`: `<header>` with `<strong class="product">` product name, and the user menu (`.dropdown` with `.avatar.user-btn` trigger, `aria-haspopup="menu"`, `aria-expanded`, `aria-label="User menu for {name}"`, menu note "Signed in as {email}", items "Account settings" and "Sign out"; Esc and outside click close it, arrow keys move). Props `{ productName: string; user: { name: string; email: string } }`. The prototype also has a search input in this row; it is not in any AC and is left out (see open questions). The product name is a constant `PRODUCT_NAME = 'Market Dashboard'` taken from the prototype.
    files:
      - apps/web/src/dashboard/TopBar.tsx
    rationale: AC14, AC18.

  - description: |
      Stale-section registry for AC20. Module-level store, no router needed:
      ```ts
      export type DashboardAction = 'buy' | 'apply' | 'add-stock' | 'start-sip'
      export const AFFECTED: Record<DashboardAction, SectionId[]> = {
        buy: ['watchlist'], apply: ['ipo'], 'add-stock': ['watchlist'], 'start-sip': ['sip'],
      }
      export function markStale(action: DashboardAction): void
      export function takeStale(): SectionId[]   // returns and clears
      ```
      Sibling flows call `markStale(action)` when they finish. `DashboardPage` calls `takeStale()` on mount and on `visibilitychange` back to visible, and calls `reload()` only for those sections. The reload shows that section's loading view, then the new content.
    files:
      - apps/web/src/dashboard/staleSections.ts
    rationale: Gives the four actions one tested entry point; unaffected sections do not reload.

  - description: |
      Source seam and minimal renderers. `sources.ts` exports `dashboardSources: { index; sip; watchlist; ipo }`, each a `SectionSource` whose `load` does `fetch` against the sibling epic's endpoint and throws on a non-2xx response (the real request/response shapes are owned by Market data and indices, SIP management, Watchlist and stock buying, IPO listings). `content.tsx` holds the minimal presentational renderers from the prototype (index cards with `.badge`, SIP summary and list, watchlist `.table` inside `.table-wrap`, IPO `.table`) so the screen renders loaded data. Replace the stub `App` heading with `DashboardPage`, and update the existing test that expects the "Web App" heading.
    files:
      - apps/web/src/dashboard/sources.ts
      - apps/web/src/dashboard/content.tsx
      - apps/web/src/App.tsx
      - apps/web/src/App.test.tsx
    rationale: Production data path with no fixtures; content depth stays with sibling epics.

tests:
  - |
    useSection.test.ts (write first). AC4, AC15: `const { result } = renderHook(() => useSection(src))` then `expect(result.current.state.status).toBe('loading')`; after a rejected load, `expect(result.current.state.status).toBe('error')`; calling `act(() => result.current.retry())` gives `expect(result.current.state.status).toBe('loading')` synchronously, before the promise settles.
  - |
    useSection.test.ts. AC5, AC6: reject first, resolve on retry gives `loaded`; reject on retry gives `error` again. AC7: reject 10 times via `for (let i = 0; i < 10; i++) { await act(async () => result.current.retry()) }`, then `act(() => result.current.retry())` and `expect(result.current.state.status).toBe('loading')` and `expect(load).toHaveBeenCalledTimes(12)`. Also a stale-response test: an older slow request that resolves after a newer one does not overwrite the state.
  - |
    SectionSlot.test.tsx. AC2, AC3, AC4: `render(<SectionSlot state={{status:'error'}} .../>)` and `expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()`; empty state renders `getByText('Your watchlist is empty')` with one action button; loading renders `getByRole('status')` and `container.querySelectorAll('.skeleton').length > 0`.
  - |
    SectionSlot.test.tsx. AC8: in the error state `expect(container.querySelectorAll('.alert').length).toBe(1)` and `expect(screen.getAllByRole('button')).toHaveLength(1)`, with no other message; the same after 10 failed presses (rendered through `DashboardPage` below).
  - |
    DashboardPage.test.tsx (sources mocked with vi.fn). AC1, AC14: all four sections present, `expect(screen.getByRole('heading', { name: 'Market indices' })).toBeInTheDocument()` and likewise SIP summary, Watchlist and IPO details; the banner or tools row precedes the sections via `compareDocumentPosition`.
  - |
    DashboardPage.test.tsx. AC9: index and watchlist both rejected, press Try again inside the index section only (`within(indexSection).getByRole('button', { name: 'Try again' })`), then `expect(within(watchlistSection).getByText('Watchlist could not be loaded')).toBeInTheDocument()` and `expect(watchlistSource.load).toHaveBeenCalledTimes(1)`. Also: a never-resolving IPO load does not stop the other three sections rendering (parallel, independent).
  - |
    DashboardPage.test.tsx. AC10 to AC13, AC16, AC17: watchlist and SIP both empty gives `getByText('No stocks or SIPs yet')`; watchlist error + SIP empty gives `expect(screen.queryByText('No stocks or SIPs yet')).not.toBeInTheDocument()`; SIP error + watchlist empty gives the same; watchlist with items + SIP empty gives no whole-dashboard empty and `within(sipSection).getByText('No SIPs yet')`; SIPs with items + watchlist empty gives `within(watchlistSection).getByText('Your watchlist is empty')`. Also: while either is still loading, the whole-dashboard empty is not shown.
  - |
    TopBar.test.tsx. AC18: `expect(screen.getByText('Market Dashboard')).toBeInTheDocument()` and `expect(screen.getByRole('button', { name: 'User menu for Anika Kapoor' })).toBeInTheDocument()`; clicking it shows `Signed in as anika.kapoor@example.com` (test data only); Esc closes it.
  - |
    PeriodSelector placement test in DashboardPage.test.tsx. AC19 as the prototype reads it: `expect(screen.getByRole('combobox', { name: 'Period' })).toBeInTheDocument()` inside the page head region directly under the top bar. Changing it reloads only the index source: `expect(indexSource.load).toHaveBeenLastCalledWith(expect.anything(), { period: '1 year' })` and `expect(watchlistSource.load).toHaveBeenCalledTimes(1)`.
  - |
    staleSections.test.ts and DashboardPage.test.tsx. AC20: `markStale('buy'); markStale('apply'); render(<DashboardPage />)` then wait for the initial loads and assert that `watchlistSource.load` and `ipoSource.load` were called a second time while `indexSource.load` and `sipSource.load` were called once; `takeStale()` returns `[]` afterwards. One case each for `add-stock` (watchlist) and `start-sip` (sip). The reloaded section shows the changed data.
  - |
    App.test.tsx updated. `render(<App />)` then `expect(await screen.findByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument()`.
  - |
    Narrow run per task, derived from the project command: `(cd apps/web && pnpm test src/dashboard/useSection.test.ts)`, then the other test files by name; the full command runs once at the end.

assumptions_or_open_questions:
  - |
    Prototype vs AC19 conflict. AC19 says the period selector is shown within the top bar. In the approved prototype it sits in the page head directly under the top bar/tools row (its own design note says "as in the approved wireframe", and `data-ac="19"` is on that page head). The plan follows the prototype. Moving it into the tools row is a one-line layout change if the reviewer prefers the AC wording.
  - |
    Top bar. The prototype has two bars: the shell header ("Console", Account) and the dashboard tools row (product name, search, user menu). The plan builds the tools row as "the top bar" for AC14 and AC18, and does not build the shell header, the sidebar nav (UI guidelines list Dashboard, Projects, Activity, Settings) or routing, since no AC covers them. Confirm whether the app shell belongs to this story or to another.
  - |
    Signed-in user and product name. The web app has no auth or session code today (App.tsx, main.tsx and index.css are the whole app). `DashboardPage` takes `user` as a prop, with the real session coming from whichever story owns sign-in. The product name "Market Dashboard" is from the prototype and is assumed final.
  - |
    Sibling endpoints. `services/api/src` holds only the health controller. The index, SIP, watchlist and IPO endpoints are owned by sibling epics, so `sources.ts` encodes assumed URLs and response shapes (to be aligned with them) and no backend is built here. Until they land, the live Dashboard will show each section in its error state. No fixtures are shipped.
  - |
    Prototype extras not in any AC and left out: the search input, the "Manage", "View all SIPs", "View all IPOs" buttons' destinations and the toasts. The "Add stock" page-head button and the empty-state actions are kept as buttons that call `onAction` props; what they open belongs to sibling epics.
  - |
    The "N of 4 sections could not be loaded" banner comes from the prototype but not from an AC. It does not suggest another action, so AC8 holds, but a reviewer may prefer to drop it. It is easy to remove.
  - |
    Open project-wide question (CHORE-023): market feed freshness and refresh rate. This story only reloads on mount, on Try again, on period change and after the four actions; no polling is planned. Any interval refresh is out of scope until that question is answered.
  - |
    Unlimited Try again is applied per the EPIC-012 decision: no failure counter, no cap, no extra message. The "10 consecutive failures" ACs (7 and 8) are therefore satisfied by the absence of any special case, and are tested explicitly.
  - |
    Index and SIP each have two slots (cards plus chart, summary plus list) that share one state, as in the prototype. Whether the chart and the SIP list render their own empty or loading views is left to the sibling epics; only the leader slot does.
  - |
    Tokens: the plan uses only token names read in the prototype's inlined tokens.css; `design-system/tokens.css` and `prototype-utils.css` were found by listing but the implementer should confirm the names match when importing. Widths such as the 5x/10x multiples of `--space-6` used for flex bases are token expressions copied from the prototype, not new literals.

estimated_points: 5

package_dependencies: []

notes: |
  ### Data & rollout
  None — front-end only: no schema, stored data, seed or env var changes. No backend change in this story (sibling epics own the data endpoints), so nothing to migrate and nothing to roll back beyond reverting the commit.

  How the design system reaches the app: `apps/web/src/main.tsx` line 3 imports `./index.css`; `index.css` currently has only `@import "tailwindcss";`, and `vite.config.ts` uses `@tailwindcss/vite`. The plan adds the token and component imports there once (first scope item). Styling uses the design-system tokens and classes plus `dashboard.css`, not Tailwind utility classes, to match the prototype class for class.

  Design sources read: the approved prototype (tools row, page head with Period select and "Add stock", `.dash` rows with `data-slot` sections, state views: default, loading, empty, error, sips-empty, watchlist-empty, sip-error, index-ipo-empty, and its behaviour script for retry and action-driven reloads) and `design-system/` file list.

  The intake question "should each section load independently and in parallel" is answered yes: one `useSection` per section, no shared promise.

  ```mermaid
  flowchart TD
    main[main.tsx] --> App[App.tsx]
    main --> css[index.css]
    App --> Page[DashboardPage]
    Page --> Top[TopBar]
    Page --> Period[PeriodSelector]
    Page --> Slot[SectionSlot]
    Page --> Hook[useSection]
    Page --> Stale[staleSections]
    Page --> Empty[WholeDashboardEmpty]
    Hook --> Src[sources.ts]
    Slot --> Content[content.tsx]
    css --> DS[design-system tokens and utils]
    css --> DashCss[dashboard.css]
    classDef touched fill:#f96,color:#000
    class App,css,Page,Top,Period,Slot,Hook,Stale,Empty,Src,Content,DashCss touched
  ```

review_focus: |
  Hold the plan to the containers and their states: independent parallel loading per section, unlimited Try again that reloads only its own section, and the whole-dashboard empty rule (watchlist AND SIPs both empty, never while loading or errored). Riskiest parts: the stale-response handling in `useSection` and the AC20 reload-on-return path. Deliberate decisions: the period selector follows the prototype (page head) rather than AC19's "within the top bar", there is no failure counter on purpose, and section content, endpoints, the app shell/nav and sign-in are sibling work, not this plan.
