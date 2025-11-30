import { useContext, $, type ContextId, type QRL } from "@builder.io/qwik";
import {
  APP_STATE_CTX,
  COMMITTED_STATE_CTX,
  DIFF_STATE_CTX,
} from "~/store/appStore";
import { calculateDiff } from "~/store/diff";

/**
 * Serializable cursor interface that mimics thi.ng/atom cursor operations
 */
export interface SerializableCursor<T> {
  swap: QRL<(updateFn: (value: T) => T) => void>;
  reset: QRL<(newValue: T) => void>;
}

/**
 * Helper to get a nested value from an object using a path array
 */
function getNestedValue(obj: any, path: (string | number)[]): any {
  if (path.length === 0) return obj;
  let current = obj;
  for (const key of path) {
    current = current?.[key];
  }
  return current;
}

/**
 * Helper to set a nested value in an object using a path array
 * Leverages Qwik's deep reactivity - direct mutation triggers updates
 */
function setNestedValue(obj: any, path: (string | number)[], value: any): void {
  if (path.length === 0) {
    // Can't replace root object, copy properties instead
    for (const key in obj) {
      delete obj[key];
    }
    Object.assign(obj, value);
    return;
  }

  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]];
  }
  current[path[path.length - 1]] = value;
}

/**
 * Updates diffState with new diff values using Qwik's deep reactivity
 */
function updateDiffState(
  diffState: any,
  newDiff: { hasChanges: boolean; changedPaths: string[]; summary: any }
): void {
  diffState.hasChanges = newDiff.hasChanges;
  diffState.changedPaths = newDiff.changedPaths;
  diffState.summary = newDiff.summary;
}

/**
 * Creates a serializable cursor-like interface for a Qwik context value.
 *
 * This hook provides atom-like operations (swap, reset) that work with Qwik's
 * serialization and reactivity system. When used with APP_STATE_CTX, it also
 * handles localStorage persistence and diff calculation.
 *
 * Uses Qwik's native deep reactivity - direct mutations to nested properties
 * automatically trigger component updates without needing Object.assign.
 *
 * @param contextId - The Qwik context ID to create a cursor for
 * @param path - Optional path within the context value (default: [])
 * @returns A tuple of [value, { swap, reset }] similar to React's useState
 *
 * @example
 * // Get a cursor for a specific path
 * const [features, featuresCursor] = useContextCursor(APP_STATE_CTX, ["features"]);
 *
 * @example
 * // Use the cursor to update state
 * featuresCursor.swap((features) => [...features, newFeature]);
 */
export function useContextCursor<T extends Record<string, any>, V = any>(
  contextId: ContextId<T>,
  path: (string | number)[] = []
): [V, SerializableCursor<V>] {
  const contextValue = useContext(contextId);

  // Get committed and diff state if updating APP_STATE_CTX
  // Type-cast comparison since we're checking identity, not type compatibility
  const isAppState = (contextId as any) === (APP_STATE_CTX as any);
  const committedState = isAppState ? useContext(COMMITTED_STATE_CTX) : null;
  const diffState = isAppState ? useContext(DIFF_STATE_CTX) : null;

  // Get the value at the path (or the entire context if no path)
  const getValue = (): V => {
    return getNestedValue(contextValue, path) as V;
  };

  const swap = $((updateFn: (value: V) => V) => {
    // Get current value, apply update function, then set new value
    const currentValue = getNestedValue(contextValue, path) as V;
    const newValue = updateFn(currentValue);

    // Qwik's useStore provides deep reactivity - direct mutation triggers updates
    setNestedValue(contextValue, path, newValue);

    // Handle localStorage and diff for APP_STATE_CTX
    if (isAppState && committedState && diffState) {
      localStorage.setItem("appState", JSON.stringify(contextValue));
      const newDiff = calculateDiff(committedState, contextValue as any);
      updateDiffState(diffState, newDiff);
    }
  });

  const reset = $((newValue: V) => {
    // Qwik's useStore provides deep reactivity - direct mutation triggers updates
    setNestedValue(contextValue, path, newValue);

    // Handle localStorage and diff for APP_STATE_CTX
    if (isAppState && committedState && diffState) {
      localStorage.setItem("appState", JSON.stringify(contextValue));
      const newDiff = calculateDiff(committedState, contextValue as any);
      updateDiffState(diffState, newDiff);
    }
  });

  return [getValue(), { swap, reset }];
}
