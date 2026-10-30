<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Advantage Dashboard Project Guidelines

These standards must be followed by all developers when adding features or modifying layouts.

## 1. Project Directory Structure

Use feature-scoped architecture for modularity:

```txt
src/
  ├── app/                  # Route layouts, pages, and API endpoints
  │   ├── dashboard/        # Dashboard layout shell and subpages
  │   │   ├── page.tsx      # Overview page
  │   │   └── sample-feature/
  │   │       └── page.tsx  # Sample feature route
  │   ├── layout.tsx        # Root HTML layout (Plus_Jakarta_Sans & ThemeProvider)
  │   └── page.tsx          # Root redirect
  ├── components/           # Global, reusable UI and layout elements
  │   ├── dashboard-panel/  # Core panel components (sidebar, menu, navbar, toggles)
  │   ├── providers/        # Global providers (theme-provider)
  │   ├── ui/               # Base design system components (buttons, cards, inputs)
  │   ├── ScrollToTop.tsx   # Floating scroll helper
  │   └── BrowseDashboardModal.tsx # Cross-dashboard dialog portal
  ├── context/              # Global state contexts (FilterContext)
  ├── features/             # Business domain features (encapsulated functionality)
  │   ├── overview/         # Overview feature components and utilities
  │   │   ├── components/   # Private feature components
  │   │   │   └── skeletons/ # Feature loading skeletons
  │   │   ├── services/     # Feature data queries & cache functions
  │   │   ├── types/        # Feature TypeScript schemas
  │   │   └── utils/        # Feature helper & formatting utilities
  │   └── sample-feature/   # Sample feature folder
  │       ├── components/   # Private components used only by this feature
  │       │   └── skeletons/ # Feature loading skeletons
  │       ├── hooks/        # Feature-specific state hooks
  │       ├── services/     # Feature-specific data queries (API / DB)
  │       ├── types/        # TypeScript type schemas
  │       └── utils/        # Feature-specific helper & formatting utilities
  ├── hooks/                # Global UI hooks (useSidebar, useStore)
  └── lib/                  # Shared helper libraries and configurations
      ├── db.ts             # Database client connection
      ├── filter-utils.ts   # Formatting and helper filters
      ├── menu-list.ts      # Navigation menu definition list
      └── utils.ts          # Core styling helper (cn) and global chart color palette (C)
```

---

## 2. Separation of Concerns

- **Components**:
  - Global components (e.g., standard layout headers, charts components) belong in `src/components/`.
  - Feature components (e.g., stats grids, data visualization cards) belong in `src/features/[feature-name]/components/`.
- **Hooks**:
  - Global state hooks (e.g., theme toggle state, menu toggle state) live in `src/hooks/`.
  - Feature-specific hooks (e.g., specific search states, filter inputs) live in `src/features/[feature-name]/hooks/`.
- **Services & DB**:
  - Direct database queries must reside in feature services (e.g., `src/features/[feature-name]/services/comparisonService.ts`). Never run queries directly inside components.

---

## 3. Naming Conventions

- **React Components**: PascalCase (e.g. `SampleChartWidget.tsx`).
- **Hooks**: camelCase starting with `use` (e.g. `useFilters.ts`).
- **Routes & Folders**: lowercase kebab-case (e.g. `sla-performance`).
- **Utility / Services**: camelCase (e.g. `filter-utils.ts`, `sampleService.ts`).

---

## 4. Responsive & Stable Layouts

- Dashboard shells must support mobile viewport sizing by swapping the side navigation panel with a collapsable sheets menu.
- Display statistical widgets using responsive grid templates:
  - Mobile: `grid-cols-1`
  - Tablet: `sm:grid-cols-2`
  - Small Desktop: `lg:grid-cols-4`
- Default typography utilizes `Plus_Jakarta_Sans` specified via `--font-sans` variables.

---

## 5. Service Query & Caching Conventions

- **Feature Database Service Layer (`src/features/[feature-name]/services/`)**:
  - Every feature component or logical component group must have its own descriptive query service function.
  - **Raw SQL Query Functions**: Use camelCase starting with `get<BusinessDescriptiveName>Raw` (e.g. `getTotalAssetKpisRaw`, `getPmSummaryKpisRaw`, `getAssetGrowthRaw`). Avoid generic terms like "Section1" or "Section2".
  - **Inline Cache Public Functions**: Public service functions exported for components must directly return an inline `unstable_cache` call wrapping the raw SQL query function:
    ```typescript
    export async function get<BusinessDescriptiveName>Data(
      input: AssetFilterInput,
      param?: string,
    ): Promise<DataType> {
      return unstable_cache(
        async () => get<BusinessDescriptiveName>Raw(input, param),
        ["[feature]-[key-name]-data", input.year, input.month, input.site || "ALL", param || "ALL"],
        { revalidate: 300, tags: ["[feature]-[key-name]"] },
      )();
    }
    ```

---

## 6. Cleanup of Dummy & Mock Data Functions

- **Elimination of Mock Helpers**:
  When a feature service or component completes its real database query implementation, all legacy seed generators, dummy data helpers, and mock functions must be immediately deleted.
- **Pure Fallback Policy**:
  Do not return artificial mock/dummy data as fallback values during error handling or missing states. Services and components must strictly return pure empty fallbacks (e.g. `[]`, `0`, or empty structures).

---

## 7. Extraction of Utility & Transformer Functions

- **Service Scope Limitation**:
  Service files MUST ONLY contain direct database query functions (`get<DescriptiveName>Raw`) and inline cache wrapper functions (`get<DescriptiveName>Data`).
- **Placement of Utilities**:
  All helper functions, string formatters (e.g. `formatDeviceLabel`), status mappers (e.g. `mapDbStatus`), site/unit classification checks (e.g. `isUnitSite`), and data transformers MUST NOT reside inside service files. They must be placed in:
  - `src/lib/` for global/shared utilities across features.
  - `src/features/[feature-name]/utils/` for feature-specific helpers.

---

## 8. Component-Specific Zero State (Empty State) Standardization

- **No Blank White Containers Policy**:
  Components MUST NOT render empty white boxes or blank containers when data is empty (`[]`, `null`, `0`, or missing). Every data visualization card, chart, list, and table must render an explicit, context-driven Empty State.
- **Component-Specific Purpose & Context**:
  Empty States must be purpose-driven and tailored to the specific domain context of each component:
  - **Ranking / Bar Lists (`BarCard`, `BarList`)**: Render `EmptyState` with `Building2`/`BarChart3` icon and contextual text (e.g., _"Tidak Ada Data Cabang/Lokasi"_).
  - **Proportion & Donut Charts (`DonutChartCard`)**: Render `EmptyState` with `PieChart`/`Coins` icon and contextual text (e.g., _"Tidak Ada Proporsi Biaya/Aset"_).
  - **Distribution & Trend Charts (`SeriesBarChart`)**: Render `EmptyState` with `TrendingUp`/`CalendarX` icon and contextual text (e.g., _"Data Grafik Tidak Ditemukan"_).
  - **Schedules & Lists (`JadwalPmList`)**: Render `EmptyState` with `CalendarCheck2` icon and contextual text (e.g., _"Jadwal PM Kosong"_).
  - **Data Tables (`CostBySiteTable`, `InventorySiteRow`, `FindingsTable`)**: Render dedicated empty table rows with `SearchX`/`FileX2` icon and instructional text.
- **Reusable Foundation (`src/components/shared/EmptyState.tsx`)**:
  All Empty States must utilize the standard shared `EmptyState` component for consistent typography, icon badges, theme support (light/dark mode), and optional action handlers.

---

## 9. Scoped Local Filter Loading & Minimum Bar Visibility

- **Scoped Child Loading State**:
  When a component has internal local filters (such as tab buttons or dropdown selects), changing the local filter state MUST NOT unmount the outer card or render a full-card skeleton. The card wrapper, title, and filter buttons MUST remain visible without flickering, and ONLY the child data area inside the card should render a skeleton/loading placeholder.
- **Minimum Bar Visibility for Zero/Null Values**:
  Bar charts and bar lists MUST always highlight bars slightly even when values are `0` or `null`. Recharts `<Bar>` components must set `minPointSize={3}` (or 4) and horizontal `ProgressBar` components must maintain a subtle minimum width (`min-w-[4px]`) so zero-value bars remain subtly visible instead of completely disappearing.

---

## 10. Dropdown Menu & Select Standardization (shadcn UI Standard)

- **Strict Placement Below Trigger (`side="bottom"`, `sideOffset={4}`, `align="start"`)**:
  All dropdown popups (`SelectContent`, `DropdownMenuContent`) MUST render strictly beneath the input trigger with a tight 4px gap (`sideOffset={4}`) and anchor aligned to the left/start of the trigger (`align="start"`). They MUST NOT overlay, center over, or cover the trigger button (`alignItemWithTrigger={false}`).
- **Smooth Animations & Transitions**:
  Dropdown popups MUST execute smooth entry/exit animations (`duration-150 ease-out data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-1.5`). Never disable animation classes on active items.
- **Unified Design Tokens**:
  - **Container**: `rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 shadow-md ring-1 ring-black/5 dark:ring-white/10`.
  - **Items**: `rounded-md py-1.5 pl-2.5 pr-8 text-xs font-medium cursor-pointer transition-colors text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 focus:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50`.
  - **Check Indicator**: Active selected options in dropdowns should indicate their selection with a checkmark (`CheckIcon`).
- **Responsive Collapsible Controls**:
  Filter controls with horizontal button tabs (such as category or status tabs) MUST provide a responsive fallback that collapses into a `<FilterSelect>` on small viewports (`sm:hidden`).


---

## 11. CSS Isolation & Design Token Guardrails

- **No Global `:root` Variable Overrides in Feature CSS**:
  Feature-specific stylesheets MUST NOT override or declare CSS variables (especially shadcn design tokens like `--accent`, `--background`, `--foreground`, `--card`, `--border`, etc.) on `:root` or `.dark`.
- **Feature Class Scoping**:
  All feature-specific CSS variables and custom styles must be strictly scoped to a container class (e.g., `.feature-name-scope`) or converted into Tailwind utility classes directly. This prevents accidental styling leaks into global shell components like the sidebar, navbar, and modals.
