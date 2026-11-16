# UI Guidelines

This product is a web console for managing projects and following their activity. It has no brand brief yet, so these rules favour a calm, work-focused tool.

## Navigation and information architecture
- **Top bar plus left sidebar on desktop; top bar with a menu button on phones.** A sidebar scales to more sections later, and the menu button keeps phones uncluttered.
- **Main sections, in this order:** Dashboard (`dashboard`), Projects (`projects`), Activity (`activity`), Settings (`settings`). Ordered by how often people use them.
- **Account (`account`) lives in the top bar, not the sidebar.** It is personal, not a workspace section.
- **Mark the current page with `aria-current="page"` on its nav link; nothing else shows location.** One signal avoids mismatched breadcrumbs.
- **Drill-down screens (a single project) sit under their section and carry a back link, not new nav items.** Keeps the sidebar to four entries.

## Layout and density
- **Data-dense, not spacious:** default to `--space-3` gaps and `font-size-md` body text. Users scan lists and tables all day.
- **Content is capped at `--content-max-width` and left-aligned.** Long lines of table data are hard to track.
- **Design phone-first; the layout switches to sidebar at 768px.** Phone is the narrowest case and the sidebar needs the width.
- **Page title is an `h1`, with the page's primary action on the same row, right-aligned.** One predictable place to act.

## Component usage
- **One `btn-primary` per view;** other actions are `btn-secondary` or `btn-ghost`. A single primary makes the next step obvious.
- **`btn-danger` only for destructive actions, always behind a `modal` confirmation.** Prevents accidental data loss.
- **`table` for records compared across columns (projects, activity);** `card` for a self-contained summary or a group of related fields; a plain `stack` list for short, single-line items. Tables aid comparison, cards aid grouping.
- **Wrap tables in `table-wrap`.** They scroll sideways on phones instead of breaking the page.
- **Forms use `field` with a visible label, a `field-hint`, and `field-error` plus `is-invalid` on failure.** Errors sit beside the control that caused them.
- **`drawer` for viewing or editing a record while keeping its list visible; `modal` only for short confirmations.** Drawers keep context, modals interrupt.
- **`toast` for confirming a finished action; `alert` for problems the user must act on.** Toasts disappear, alerts persist.
- **Status is always a `badge` (success, warning, danger, neutral), never colour alone.** The label carries the meaning.
- **Empty lists use `empty-state` with one action; loading uses `skeleton`, not a lone `spinner`.** Skeletons hold the layout steady.

## Theme
- **Light only.** One theme halves the review surface; dark mode can be added later as a second token set without changing components.

## Voice and tone
- **Plain, direct, sentence case.** The audience is busy and technical.
- **Buttons are verb + object ("Create project", "Save changes").** Says what will happen.
- **Errors say what went wrong and how to fix it, without blame ("Name is required").** Keeps the user moving.
- **No exclamation marks or jokes.** A console should feel dependable.
