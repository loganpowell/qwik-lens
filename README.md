# Qwik + @thi.ng/atom State Management POC

A proof-of-concept demonstrating integration of [@thi.ng/atom](https://github.com/thi-ng/umbrella/tree/develop/packages/atom) state management with [Qwik](https://qwik.dev).

## Key Features

### Three-Tier State Architecture

- **Committed** (JSON file) - The source of truth on disk
- **Staged** (localStorage) - Temporary changes, persists across page reloads
- **Diff** - Calculated difference between committed and staged

### State Management Pattern

- ✅ Immutable updates using `@thi.ng/paths`
- ✅ Automatic localStorage persistence via atom watchers
- ✅ Real-time diff calculation
- ✅ Qwik reactivity via `useContext`
- ✅ DRY helper function (`updateState`) for common update pattern

### Developer Experience

- DevBar component showing uncommitted changes
- Commit to file workflow
- Rollback to last committed state
- Type-safe state updates

## Architecture

```
┌─────────────────┐
│  features.json  │ ← Committed state (source of truth)
└────────┬────────┘
         │ Load on init
         ↓
┌─────────────────┐
│  localStorage   │ ← Staged state (persists across reloads)
└────────┬────────┘
         │ Sync via watcher
         ↓
┌─────────────────┐
│   @thi.ng/atom  │ ← In-memory atom with cursors
│  (stagedCursor) │
└────────┬────────┘
         │ useContext
         ↓
┌─────────────────┐
│  Qwik Context   │ ← Component state (triggers reactivity)
│  (APP_STATE_CTX)│
└─────────────────┘
```

## Update Pattern

All state updates follow this pattern (abstracted into `updateState()` helper):

```tsx
import { updateState } from "~/utils/stateHelpers";

// Update count
updateState(state, ["count"], (c: number) => c + 1);

// Update array
updateState(state, ["features"], (features) => [...features, newFeature]);
```

Under the hood, this:

1. Creates immutable update with `@thi.ng/paths`
2. Updates Qwik context (triggers UI reactivity)
3. Syncs to atom cursor (triggers watcher → localStorage + diff calculation)

## Project Structure

```
src/
├── components/
│   ├── DevBar.tsx           # Developer toolbar
│   └── FeatureCard.tsx      # Editable feature component
├── routes/
│   ├── index.tsx            # Home page (counter demo)
│   ├── features/index.tsx   # Features list
│   └── api/features/index.ts # Commit endpoint
├── store/
│   ├── appStore.ts          # Atom, cursors, contexts
│   └── diff.ts              # Diff calculation
├── utils/
│   └── stateHelpers.ts      # DRY update helper
└── types/
    └── data.ts              # TypeScript types
```

## Key Learnings

### Qwik Reactivity Gotchas

1. **`useContext` required in each component** - Can't share hooks that return context values
2. **Qwik proxies must be stripped** before passing to atoms - Use `JSON.parse(JSON.stringify())`
3. **State updates must go through Qwik context first** - Direct atom updates won't trigger reactivity
4. **Watchers receive old state** - Watchers run asynchronously after Qwik updates, so they see previous state
5. **Avoid direct object mutation** - Always create new objects for updates to ensure reactivity
6. **Deep equality checks** - Use `@thi.ng/equiv` for accurate diffing of nested structures
7. **Serialization limits** - Only JSON-serializable data should be stored in atoms/localStorage

### State Synchronization

- Update Qwik state first (for immediate UI updates)
- Then sync to atom (triggers persistence and diff)
- Watchers run asynchronously but synchronously enough for this use case

## Running the Project

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Dependencies

- **Qwik** - Resumable framework with fine-grained reactivity
- **@thi.ng/atom** - Immutable state containers with watches
- **@thi.ng/paths** - Path-based immutable updates
- **@thi.ng/equiv** - Deep equality checking for diff calculation

## License

MIT

## Credits

Built to validate state management patterns for the ET ML Evals project.
