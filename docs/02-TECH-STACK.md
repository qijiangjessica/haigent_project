# Tech Stack

## Core Framework

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15 (App Router) | Full-stack React framework |
| **React** | 19 | UI library |
| **TypeScript** | 5.x | Type safety |

Next.js was chosen because the original app uses it. The App Router provides file-based routing, layouts, and server/client component separation.

## Styling

| Technology | Purpose |
|---|---|
| **Tailwind CSS** | Utility-first CSS framework |
| **shadcn/ui** | Pre-built accessible components (Card, Button, Input, Badge, Table, etc.) |
| **Radix UI** | Underlying primitives for shadcn/ui (Dropdown Menu, etc.) |
| **Lucide React** | Icon library |
| **clsx + tailwind-merge** | Class name utility (`cn()` helper) |

## Fonts

| Font | Usage |
|---|---|
| **Lato** | Primary UI font |
| **Source Sans 3** | Secondary font |

Both loaded via `next/font/google` for optimal performance.

## Brand Colors

Defined as custom Tailwind colors in the config:

| Token | Hex (approximate) | Usage |
|---|---|---|
| `brand-charcoal` | `#2D2D2D` | Sidebar background, dark text |
| `brand-pink` | `#E91E8C` | Schedule accent, active states, notifications |
| `brand-gold` | `#F5A623` | Sourcing accent, CTA buttons, user avatars |
| `brand-teal` | `#00BFA5` | "AI-Powered" badges, focus rings, links |
| `brand-green` | `#4CAF50` | Success states, online indicators |

## Data Layer

**No database.** All data lives in TypeScript files under `src/data/`:

```
src/data/
├── schedule/
│   ├── jobs.ts          # Hardcoded job listings
│   ├── candidates.ts    # Hardcoded candidates with AI scores
│   ├── interviews.ts    # Hardcoded interviews
│   └── interviewers.ts  # Hardcoded interviewers
├── sourcing/
│   ├── roles.ts         # Hardcoded sourcing roles
│   ├── candidates.ts    # Hardcoded sourced candidates
│   └── campaigns.ts     # Hardcoded campaign data
```

This approach means:
- `npm install && npm run dev` is all you need
- No Docker, no database setup, no environment variables, no authentication
- Contributors can focus on building UI, not configuring infrastructure

## Dev Tools

| Tool | Purpose |
|---|---|
| **ESLint** | Code linting (Next.js default config) |
| **Prettier** | Code formatting |
| **Turbopack** | Next.js dev server bundler (built-in) |

## What We Intentionally Omit

| Original Feature | Why Omitted |
|---|---|
| Supabase | Adds setup complexity; hardcoded data is simpler |
| Cal.com integration | External service; not needed for demo shell |
| AI scoring engine | External service; scores are hardcoded |
| Real-time subscriptions | Requires Supabase; loading states shown as static UI |
| File uploads | Requires storage backend; not needed for demo |
| Email templates | Requires email service; not needed for demo |
