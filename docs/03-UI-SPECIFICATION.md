# UI Specification

Detailed description of every UI element observed on the production app, to be replicated.

---

## Global Layout

The app uses a **fixed sidebar + scrollable main content** layout:

```
+--------------------+------------------------------------------------+
|                    |  HEADER (sticky, h-16)                         |
|  SIDEBAR (fixed)   |------------------------------------------------|
|  w-72 (288px)      |                                                |
|  bg-brand-charcoal |  MAIN CONTENT AREA (p-4 sm:p-6 lg:p-8)        |
|  full height       |                                                |
|                    |                                                |
+--------------------+------------------------------------------------+
```

- Sidebar is hidden on mobile (`-translate-x-full`), shown on `lg:` screens
- A hamburger button (`fixed top-4 left-4 z-50 lg:hidden`) toggles the sidebar on mobile
- Main content area is offset by `lg:pl-72`

---

## Sidebar Structure

### Logo Area (h-20, border-b)
- Gold square (`bg-brand-gold`, `w-10 h-10 rounded-xl`) with bold white "H"
- Small pulsing green dot indicator (top-right of logo)
- "Haigent" in bold white text
- "AI Platform" in small uppercase text (pink on Schedule pages, gold on Sourcing pages — matches the active module's accent color)
- Collapse chevron button (desktop only)

### Primary Navigation — "AI Agents" Section
Section label: "AI Agents" (tiny uppercase, `text-white/40`)

| Item | Icon (Lucide) | State |
|---|---|---|
| Schedule | `Calendar` | Active when on `/schedule/*` — pink background, charcoal text |
| Sourcing | `Search` | Active when on `/sourcing/*` — gold background, charcoal text |
| Reference | `ClipboardCheck` | Locked — `opacity-30`, `cursor-not-allowed`, lock icon |
| Onboarding | `UserPlus` | Locked |
| Benefits | `Heart` | Locked |
| Payroll | `DollarSign` | Locked |
| Engee | `Users` | Locked |

Active states use the module's accent color as background. Inactive items are `text-white/70` with hover effects. Locked items show a small `Lock` icon.

### Secondary Navigation — Module Sub-pages
Changes based on which module is active.

**Schedule sub-nav:**
| Item | Icon | Path |
|---|---|---|
| Dashboard | `/icons/analytics-dashboard.svg` | `/schedule` |
| Jobs | `/icons/HR.svg` | `/schedule/jobs` |
| Candidates | `/icons/team.svg` | `/schedule/candidates` |
| Interviews | `/icons/checklist.svg` | `/schedule/interviews` |
| Interviewers | `/icons/team.svg` | `/schedule/interviewers` |

**Sourcing sub-nav:**
| Item | Icon | Path |
|---|---|---|
| Dashboard | `/icons/analytics-dashboard.svg` | `/sourcing` |
| Roles | `/icons/HR.svg` | `/sourcing/roles` |
| Candidates | `/icons/team.svg` | `/sourcing/candidates` |
| Outreach | `/icons/user-communication.svg` | `/sourcing/outreach` |
| Meetings | `/icons/checklist.svg` | `/sourcing/meetings` |

Active sub-page: `bg-white/10` background, white text, with a small colored indicator bar on the right edge (pink for Schedule, gold for Sourcing).

### Sidebar Footer (border-t)
- **Settings** link (gear icon) — `/schedule/settings`

---

## Header Bar (sticky, h-16)

| Element | Position | Details |
|---|---|---|
| Page title | Left | e.g. "Schedule Haigent Dashboard" — `text-xl font-semibold` |
| Search input | Right | `w-64`, search icon, placeholder "Search...", `hidden md:block` |
| Notification bell | Right | Ghost button with Lucide `Bell` icon + pink dot indicator |

---

## Schedule Dashboard (`/schedule`)

### Hero Banner
- Background: `bg-brand-pink rounded-xl`
- Title: "Schedule Haigent" (`text-3xl font-bold text-white`)
- Badge: "AI-Powered" (`bg-brand-teal`, white text, `rounded-full`)
- Subtitle: "Automated interview scheduling with AI candidate scoring"
- "Quick Actions" dropdown button (`bg-brand-teal`, charcoal text, plus icon + chevron-down)
  - Dropdown items: "Create New Job", "Manage Interviewers", "View Interviews"

### Stats Cards (4-column grid)
| Card | Value | Background | Links To |
|---|---|---|---|
| Active Jobs | 2 | `bg-brand-pink` | `/schedule/jobs` |
| Total Candidates | 3 | `bg-brand-teal` | `/schedule/candidates` |
| Scheduled Interviews | 0 | `bg-brand-green` | `/schedule/interviews` |
| Avg. AI Score | 60% | `bg-brand-gold` | `/schedule/candidates` |

Each card has: white icon container, label (small text), value (`text-2xl font-bold`), hover arrow animation, deep box shadow.

### Bottom Section (2-column grid)
- **"Agent Status"** card — shows a static "AI agent monitoring" panel with status indicator
- **"Recent Activity"** card — shows a static list of recent activity items (or skeleton loading state)

---

## Sourcing Dashboard (`/sourcing`)

### Hero Banner
- Background: `bg-brand-gold rounded-xl`
- Title: "Sourcing Haigent" (`text-3xl font-bold text-white`)
- Badge: "AI-Powered" (`bg-brand-pink`, white text)
- Subtitle: "Automated candidate sourcing with AI screening and outreach"
- "Quick Actions" dropdown button (`bg-brand-pink`, charcoal text)

### Stats Cards (4-column grid)
| Card | Value | Background | Links To |
|---|---|---|---|
| Active Roles | 2 | `bg-brand-gold` | `/sourcing/roles` |
| Total Candidates | 0 | `bg-brand-pink` | `/sourcing/candidates` |
| Response Rate | 0% | `bg-brand-teal` | `/sourcing/outreach` |
| Meetings Scheduled | 0 | `bg-brand-green` | `/sourcing/meetings` |

### Bottom Section (3-column grid: 2 + 1)

**Left (2 cols) — "Active Campaigns":**
Header: "Active Campaigns" + trending-up icon + "View All" button
Content: 2-column grid of campaign cards:

Each campaign card:
- Role title (linked) + department + location
- "Active" status badge (green)
- Stats grid: Sourced, Qualified, Contacted, Meetings (all with colored icons)
- Progress bars: Qualification % and Response %

**Hardcoded campaigns:**
1. "Delivery Manager" — Data Science, Vancouver
2. "Account Manager" — Sales, Vancouver

**Right (1 col):**
- **"Top Performing Roles"** — numbered list with gold circles, role names, qualified/total counts
- **"Recent Activity"** — skeleton loading state (5 pulsing placeholder rows)

---

## Sub-Pages (Simplified)

Sub-pages under Schedule and Sourcing follow a consistent pattern:

### List Pages (Jobs, Candidates, Interviews, Interviewers, Roles, Outreach, Meetings)
1. Page header: title + description + optional "Create" button
2. Stats row: 4 metric cards
3. Data table or card grid with hardcoded data
4. Empty state when no data

### Detail Pages (`/schedule/jobs/[id]`, `/sourcing/roles/[id]`)
1. Breadcrumb back to list
2. Header: title + status badge + metadata
3. Stats row
4. Content sections

### Settings Page (`/schedule/settings`)
Form with sections: Company Info, Scheduling Defaults, AI Scoring, Notifications, Email Templates, Branding. All display-only (or local state).

---

## Component Inventory

| Component | Usage |
|---|---|
| `Sidebar` | Main navigation with two tiers |
| `Header` | Sticky top bar with search, notifications, user |
| `HeroBanner` | Module dashboard header with title, badge, actions |
| `StatsCard` | Metric display card (icon, label, value, link) |
| `CampaignCard` | Sourcing campaign summary card |
| `DataTable` | Generic table for list pages |
| `StatusBadge` | "Active", "Draft", "Closed" status indicators |
| `EmptyState` | Placeholder for empty data |
| `PageHeader` | Title + description + action button |
| `AIPoweredBadge` | Small teal/pink "AI-Powered" pill |
