# Skeleton System

Reusable skeleton (ghost/shimmer) components and wrapper for loading states.

## Components

- SkeletonLine: single line placeholder
- SkeletonAvatar: circular avatar placeholder
- SkeletonCard: multi-line card block (optional avatar)
- SkeletonTableRow: a table row with N columns
- SkeletonGrid: grid of SkeletonCard
- SkeletonWrapper: accessible wrapper that switches between skeleton and content

All primitives accept `variant` prop: `"ghost" | "shimmer"` (default: shimmer).

## Shimmer CSS

Shimmer is defined in `tailwind.config.ts` as a keyframes animation:

```ts
extend: {
  keyframes: {
    shimmer: {
      '0%': { backgroundPosition: '-468px 0' },
      '100%': { backgroundPosition: '468px 0' },
    },
  },
  animation: {
    shimmer: 'shimmer 1.6s linear infinite',
  },
}
```

The shimmering gradient is applied via a pseudo-element on the base SkeletonBlock.

## Accessibility

- Wrap loading content in a container with `role="status"` and `aria-busy="true"`.
- Mark decorative skeleton blocks with `aria-hidden="true"` so screen readers ignore them.
- Avoid interactive elements inside skeletons.

SkeletonWrapper already applies `role="status"` and `aria-busy` when `isLoading=true`.

## Usage Examples

### 1) Table with pagination (rowsPerPage=6)

```tsx
import { SkeletonWrapper, SkeletonTableRow } from "@/components/skeleton";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
} from "@/components/ui/table";

<SkeletonWrapper
  isLoading={isLoading}
  skeleton={
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: 6 }).map((_, i) => (
            <TableHead key={i}>
              <span aria-hidden>\u00A0</span>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, r) => (
          <SkeletonTableRow key={r} cols={6} />
        ))}
      </TableBody>
    </Table>
  }
>
  {/* Real table here */}
  <Table>...</Table>
</SkeletonWrapper>;
```

### 2) Profile page

```tsx
import { SkeletonLine, SkeletonAvatar } from "@/components/skeleton";

<div aria-busy={isLoading}>
  {isLoading ? (
    <div className="flex items-center gap-4" aria-hidden>
      <SkeletonAvatar size={64} />
      <div className="space-y-2">
        <SkeletonLine height="h-5" width="w-48" />
        <SkeletonLine height="h-4" width="w-32" />
      </div>
    </div>
  ) : (
    <ActualProfile />
  )}
</div>;
```

### 3) Card/grid list (Announcements)

```tsx
import { SkeletonWrapper, SkeletonGrid } from "@/components/skeleton";

<SkeletonWrapper
  isLoading={isLoading}
  skeleton={<SkeletonGrid columns={3} count={6} />}
>
  <AnnouncementsGrid items={items} />
</SkeletonWrapper>;
```

## Testing (example)

See `__tests__/SkeletonWrapper.test.tsx` using Vitest and React Testing Library.

## Performance & Accessibility Checklist

- [x] CSS-only animation; no JS timers
- [x] Minimal DOM structure
- [x] Layout-stable: skeleton approximates final sizes
- [x] `aria-busy` on container while loading
- [x] `aria-hidden` on decorative skeletons
- [x] Works in dark/light themes via Tailwind tokens
- [x] Defaults to ghost if animations are disabled by the user/OS
