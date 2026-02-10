# Application Architecture

## Next.js App Router Structure

```
app/
├── layout.tsx                    # Root layout (fonts, body, providers)
├── page.tsx                      # Redirects to /schedule
│
└── (dashboard)/                  # Dashboard route group (sidebar layout)
    ├── layout.tsx                # Sidebar + header + main content area
    │
    ├── schedule/                 # Schedule AI Agent module
    │   ├── page.tsx              # Dashboard
    │   ├── jobs/
    │   │   ├── page.tsx          # Jobs list
    │   │   └── [id]/page.tsx     # Job detail
    │   ├── candidates/page.tsx
    │   ├── interviews/page.tsx
    │   ├── interviewers/page.tsx
    │   └── settings/page.tsx
    │
    ├── sourcing/                 # Sourcing AI Agent module
    │   ├── page.tsx              # Dashboard
    │   ├── roles/
    │   │   ├── page.tsx          # Roles list
    │   │   └── [id]/page.tsx     # Role detail
    │   ├── candidates/page.tsx
    │   ├── outreach/page.tsx
    │   └── meetings/page.tsx
    │
    ├── reference/page.tsx        # Placeholder — "Coming Soon"
    ├── onboarding/page.tsx       # Placeholder — "Coming Soon"
    ├── benefits/page.tsx         # Placeholder — "Coming Soon"
    ├── payroll/page.tsx          # Placeholder — "Coming Soon"
    └── engee/page.tsx            # Placeholder — "Coming Soon"
```

## Layout Hierarchy

```
RootLayout (fonts, global CSS, ToastProvider)
└── (dashboard) group → sidebar + header + content layout
    ├── Sidebar (fixed left, navigation)
    ├── Header (sticky top, search, notifications)
    └── <main> content area
        └── Module pages
```

## Data Flow

There is no database. All data is served from TypeScript files:

```
src/data/schedule/jobs.ts → exports JOBS array
↓
app/(dashboard)/schedule/jobs/page.tsx → imports JOBS, renders table
```

For pages that need to "create" or "edit" data, the form can either:
- Show a toast message ("This is a demo — data is not persisted")
- Use React state to temporarily hold changes during the session

## Sidebar Navigation System

The sidebar is driven by a configuration object in `src/lib/modules.ts`:

```typescript
export const AI_MODULES = [
  {
    name: "Schedule",
    slug: "schedule",
    icon: Calendar,
    accentColor: "brand-pink",
    enabled: true,
    subPages: [
      { name: "Dashboard", path: "/schedule", icon: "analytics-dashboard" },
      { name: "Jobs", path: "/schedule/jobs", icon: "HR" },
      // ...
    ],
  },
  {
    name: "Sourcing",
    slug: "sourcing",
    icon: Search,
    accentColor: "brand-gold",
    enabled: true,
    subPages: [ /* ... */ ],
  },
  {
    name: "Reference",
    slug: "reference",
    icon: ClipboardCheck,
    enabled: false,  // Shows as locked
    subPages: [],
  },
  // ... remaining modules
];
```

The sidebar component reads this config and:
- Renders all modules in the primary nav
- Shows locked state for `enabled: false` modules
- Shows sub-navigation for the currently active module
- Highlights the active page

**To add a new module**, a contributor:
1. Adds an entry to `AI_MODULES` with `enabled: true`
2. Creates the route files under `app/(dashboard)/<slug>/`
3. Creates hardcoded data files under `src/data/<slug>/`

## Component Architecture

### Shared Components (`src/components/`)

```
components/
├── ui/                    # shadcn/ui primitives (auto-generated)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   ├── table.tsx
│   ├── dropdown-menu.tsx
│   └── ...
│
├── layout/                # Layout components
│   ├── sidebar.tsx        # Full sidebar with navigation
│   ├── header.tsx         # Sticky header bar
│   └── mobile-menu.tsx    # Mobile hamburger toggle
│
└── shared/                # Reusable business components
    ├── hero-banner.tsx    # Module dashboard banner
    ├── stats-card.tsx     # Metric card (icon, label, value)
    ├── page-header.tsx    # Title + description + action button
    ├── status-badge.tsx   # Active/Draft/Closed badges
    ├── empty-state.tsx    # "No data" placeholder
    └── coming-soon.tsx    # Placeholder for unbuilt modules
```

### Module-Specific Components

Each module can have its own components directory:

```
components/
├── schedule/
│   ├── campaign-stats.tsx
│   └── activity-feed.tsx
└── sourcing/
    ├── campaign-card.tsx
    └── top-roles.tsx
```

## Key Design Decisions

1. **No database** — hardcoded TypeScript data files are simpler for contributors to modify and understand
2. **No auth** — the app loads directly into the dashboard; no login, no user profiles
3. **Module config object** — centralized navigation config makes adding modules mechanical
4. **shadcn/ui** — matches the original app's component library; provides accessible, customizable components
5. **Placeholder pages** — unbuilt modules show "Coming Soon" with the module's description, not a 404
