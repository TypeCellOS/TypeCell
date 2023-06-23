# Deployment & CI

TypeCell currently consists of

|                                     | development / CI | staging                     | prod                     |
| ----------------------------------- | ---------------- | --------------------------- | ------------------------ |
| React app (packages/editor)         | Local            | Vercel (branch-specific)    | Vercel                   |
| HocusPocus Server (packages/server) | Local            | Render (typecell-staging)   | Render (typecell-prod)   |
| Supabase DB infra (packages/server) | Docker           | Supabase (typecell-staging) | Supabase (typecell-prod) |

A few principles:

- All Github Actions run against `local` (i.e.: no external dependencies)
- All components should be easy to self-host, we don't want forced dependencies on any cloud provider (note that both supabase and the server are self-hostable).
- Only www.typecell.org is considered `prod`. All Vercel branch-preview environments are considered `staging`, except the main branch which is `prod`.
- Preview environments all share the same `staging` database. This means feature-branches must be compatible in terms of database schema.
- Preview environments all share the same `HocusPocus backend server` (`packages/server`). This means feature-branches must be compatible to run against the same `packages/server`.
- DB Migrations are deployed to `staging` / `prod` when they are pushed to the `staging` / `main` branch (see github workflows).

## Self-host

It should be fairly straightforward to host TypeCell yourself, at this moment we don't have a guide for this yet.
