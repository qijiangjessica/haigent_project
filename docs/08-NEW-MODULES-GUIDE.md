# Guide: Adding a New AI Agent Module

This guide walks through adding a new AI Agent module (e.g., Onboarding, Benefits, Payroll) to the platform. The process is designed to be straightforward — each module follows the same pattern.

## Overview

Adding a module involves 4 steps:
1. Register the module in the config
2. Create the route files
3. Add hardcoded data
4. Build the UI components

---

## Step 1: Register the Module

Edit `src/lib/modules.ts` and add your module to the `AI_MODULES` array:

```typescript
// In AI_MODULES array, change enabled from false to true and add subPages:
{
  name: "Onboarding",
  slug: "onboarding",
  icon: UserPlus,              // Lucide icon
  accentColor: "brand-teal",   // Pick a brand color for this module
  enabled: true,               // Change from false to true
  description: "Automated employee onboarding workflows",
  subPages: [
    { name: "Dashboard", path: "/onboarding", icon: "analytics-dashboard" },
    { name: "Tasks", path: "/onboarding/tasks", icon: "checklist" },
    { name: "Documents", path: "/onboarding/documents", icon: "HR" },
    { name: "Checklists", path: "/onboarding/checklists", icon: "team" },
  ],
},
```

This single change will:
- Show the module as active (not locked) in the sidebar
- Display the sub-navigation when the module is active
- Use the correct accent color for active state highlighting

---

## Step 2: Create Route Files

Create a directory under `src/app/(dashboard)/` matching your module slug:

```
src/app/(dashboard)/onboarding/
├── page.tsx              # Dashboard (required)
├── tasks/
│   ├── page.tsx          # Tasks list
│   └── [id]/
│       └── page.tsx      # Task detail
├── documents/
│   └── page.tsx          # Documents list
└── checklists/
    └── page.tsx          # Checklists list
```

### Dashboard Template

Every module dashboard follows this pattern:

```tsx
// src/app/(dashboard)/onboarding/page.tsx
import { HeroBanner } from "@/components/shared/hero-banner";
import { StatsCard } from "@/components/shared/stats-card";

// Import your hardcoded data
import { ONBOARDING_TASKS } from "@/data/onboarding/tasks";

export default function OnboardingDashboard() {
  const activeTasks = ONBOARDING_TASKS.filter(t => t.status === "active").length;

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <HeroBanner
        title="Onboarding Haigent"
        subtitle="Automated employee onboarding workflows with AI task management"
        bgColor="bg-brand-teal"        // Your module's accent color
        badgeColor="bg-brand-pink"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Active Onboardings"
          value={activeTasks}
          bgColor="bg-brand-teal"
          href="/onboarding/tasks"
        />
        <StatsCard label="Pending Tasks" value={12} bgColor="bg-brand-pink" />
        <StatsCard label="Completion Rate" value="85%" bgColor="bg-brand-green" />
        <StatsCard label="Avg. Days" value={14} bgColor="bg-brand-gold" />
      </div>

      {/* Module-specific content sections */}
      {/* ... */}
    </div>
  );
}
```

### List Page Template

```tsx
// src/app/(dashboard)/onboarding/tasks/page.tsx
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ONBOARDING_TASKS } from "@/data/onboarding/tasks";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding Tasks"
        description="Manage onboarding task assignments and progress"
        actionLabel="Create Task"
        actionHref="/onboarding/tasks/new"
      />

      {/* Stats row */}
      {/* Data table or card grid */}
      {/* Empty state if no data */}
    </div>
  );
}
```

---

## Step 3: Add Hardcoded Data

Create a data directory for your module:

```
src/data/onboarding/
├── tasks.ts
├── documents.ts
└── checklists.ts
```

Example data file:

```typescript
// src/data/onboarding/tasks.ts
export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: "pending" | "in_progress" | "completed";
  dueDate: string;
  category: string;
}

export const ONBOARDING_TASKS: OnboardingTask[] = [
  {
    id: "task-1",
    title: "Complete tax forms",
    description: "Fill out W-4 and state tax forms",
    assignee: "Sarah Chen",
    status: "pending",
    dueDate: "2026-02-15",
    category: "Compliance",
  },
  {
    id: "task-2",
    title: "Set up workstation",
    description: "IT will prepare laptop, accounts, and access badges",
    assignee: "IT Department",
    status: "in_progress",
    dueDate: "2026-02-12",
    category: "IT Setup",
  },
  // Add more realistic sample data...
];
```

---

## Step 4: Build Module-Specific Components (Optional)

If your module needs custom UI components beyond the shared ones, create them in:

```
src/components/onboarding/
├── task-card.tsx
├── checklist-builder.tsx
└── progress-tracker.tsx
```

---

## Checklist

Use this checklist when adding a new module:

- [ ] Module registered in `src/lib/modules.ts` with `enabled: true`
- [ ] Dashboard page created at `src/app/(dashboard)/<slug>/page.tsx`
- [ ] Sub-pages created for each item in `subPages` config
- [ ] Hardcoded data files created in `src/data/<slug>/`
- [ ] TypeScript interfaces defined for data types
- [ ] Dashboard uses `HeroBanner` and `StatsCard` shared components
- [ ] List pages use `PageHeader` and appropriate data display
- [ ] Empty states shown where no data exists
- [ ] Navigation works: sidebar highlights correctly, sub-nav renders

---

## Tips

- **Follow existing patterns** — look at how Schedule and Sourcing are built
- **Keep data minimal** — 2-5 records per entity is enough for a demo
- **Use shared components** — `HeroBanner`, `StatsCard`, `PageHeader`, `StatusBadge`, `EmptyState`
- **Pick a brand color** — each module uses one of the 5 brand colors as its accent
- **Ask Claude Code** — use Claude Code to help scaffold the module. The `CLAUDE.md` file in the project root has context for AI-assisted development

## Brand Colors Available

| Color | Token | Used By |
|---|---|---|
| Pink | `brand-pink` | Schedule |
| Gold | `brand-gold` | Sourcing |
| Teal | `brand-teal` | Available |
| Green | `brand-green` | Available |
| Charcoal | `brand-charcoal` | Sidebar (reserved) |

When adding a new module, pick an unused accent color or reuse one that makes sense for the module's theme.
