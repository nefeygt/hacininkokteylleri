# Hacı'nın Kokteylleri — agent instructions

Before doing anything, read in order:
1. `plan.md` — the single source of truth (status, product, architecture, milestones)
2. `next_session.md` — the current task, open questions, things that bite
3. `adr.md` — closed decisions; apply them, don't relitigate them

Rules that hold in every session:
- Everything you write in the repository is English; everything visitors or admins read is Turkish (ADR-002). The user may chat in Turkish.
- Every table has Row Level Security and every permission is a policy. No secret key in the app (ADR-007).
- Schema changes: apply with the Supabase MCP, mirror as `supabase/migrations/{version}_{name}.sql`, regenerate `src/lib/supabase/database.types.ts`, run the advisors (ADR-009). Supabase project ref: `qwvnhdghwycqlvsnlvlt`.
- `npm run build` passes before every push; `main` deploys to production.
- Browser work for this project goes through Claude in Chrome (the user's signed-in Chrome).
- Ideas outside the active milestone go to `plan.md` §9 Icebox, not into code.

At the end of every session — before context fills, even with work unfinished: update `plan.md`
(status board, milestones, session log), rewrite `next_session.md`, add an ADR for any lasting
decision, commit.
