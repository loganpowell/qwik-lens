import { updateIn } from "@thi.ng/paths";
import { stagedCursor } from "~/store/appStore";
import type { DataState } from "~/types/data";

/**
 * Updates state immutably using @thi.ng/paths and syncs to both Qwik context and atom cursor.
 *
 * This helper encapsulates the three-step pattern:
 * 1. Create immutable update with updateIn()
 * 2. Update Qwik context state (triggers reactivity)
 * 3. Sync to atom cursor (triggers watchers for localStorage/diff)
 *
 * @param state - The Qwik context state object
 * @param path - The path to update in the state
 * @param updateFn - Function to transform the value at the path
 *
 * @example
 * // Update count
 * updateState(state, ["count"], (c: number) => c + 1);
 *
 * @example
 * // Update features array
 * updateState(state, ["features"], (features: Feature[]) => [...features, newFeature]);
 */
export function updateState(
  state: DataState,
  path: string[],
  updateFn: (value: any) => any
): void {
  // Use @thi.ng/paths for immutable update
  const newState = updateIn(state, path as any, updateFn);

  // Update Qwik context state (triggers reactivity)
  Object.assign(state, newState);

  // Sync to @thi.ng/atom staged cursor (strip Qwik proxies)
  // This triggers the watcher which saves to localStorage and recalculates diff
  stagedCursor.reset(JSON.parse(JSON.stringify(newState)));
}
