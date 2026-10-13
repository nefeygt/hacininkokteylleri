# Hacı'nın Kokteylleri

A cinematic cocktail archive — Hacı's recipes, written like prescriptions.

**Site:** [hacininkokteylleri.tech](https://hacininkokteylleri.tech) · **Admin:** `admin.hacininkokteylleri.tech`
**Stack:** Next.js 16 (App Router) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage — Frankfurt) · Vercel

---

## Documentation

This project is built for **multi-session, multi-agent** work. Three files carry that load:

| File | Role |
|---|---|
| **[plan.md](plan.md)** | Single source of truth — status, product, architecture, milestones, risks |
| **[next_session.md](next_session.md)** | The starting prompt and task for the next session |
| **[adr.md](adr.md)** | Decisions made, their rationale, and the alternatives rejected |

**Starting a new session?** Copy the prompt from [next_session.md](next_session.md) and
paste it. You shouldn't need to explain anything else.

---

## Setup

```bash
git clone https://github.com/nefeygt/hacininkokteylleri
cd hacininkokteylleri
npm install
npm run dev
```

- Site: http://localhost:3000
- Admin panel: http://admin.localhost:3000 (sign in with an admin account)

No secrets are needed: `.env` holds only public values and is committed (ADR-008).

---

## Conventions

- **English in the repository, Turkish in the product** (ADR-002).
- **The database is the gatekeeper.** Every table has Row Level Security; app code never
  replaces a policy (ADR-007).
- **Schema changes are migrations**, mirrored in `supabase/migrations/` with the version
  Supabase applied (ADR-009). Content edits go through the admin panel.
- Photos are WebP in the `cocktail-images` bucket and are never overwritten in place (ADR-006).
