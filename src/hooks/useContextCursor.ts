import { useContext, $, type ContextId, type QRL } from "@qwik.dev/core";
// import type { Path, Path0, OptPathVal } from "@thi.ng/api";
// import { getIn } from "@thi.ng/paths";
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
  deref: QRL<() => T>;
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
 * Creates a type-safe serializable cursor-like interface for a Qwik context value.
 *
 * This hook combines thi.ng/paths type inference with Qwik's serialization and reactivity.
 * Provides atom-like operations (swap, reset, deref) that work with QRLs. When used with
 * APP_STATE_CTX, it also handles localStorage persistence and diff calculation.
 *
 * Uses Qwik's native deep reactivity - direct mutations to nested properties
 * automatically trigger component updates without needing Object.assign.
 *
 * @param contextId - The Qwik context ID to create a cursor for
 * @param path - Optional typed path to nested property (e.g., ["features"] or ["features", 0, "name"])
 * @returns A tuple of [value, { deref, swap, reset }] with automatic type inference based on path
 *
 * @example
 * // Get whole context with type inference (type: AppState)
 * const [state, stateCursor] = useContextCursor(APP_STATE_CTX);
 *
 * @example
 * // Get nested property with automatic type inference (type: Feature[])
 * const [features, featuresCursor] = useContextCursor(APP_STATE_CTX, ["features"]);
 *
 * @example
 * // Deep path with full type safety (type: string)
 * const [name, nameCursor] = useContextCursor(APP_STATE_CTX, ["features", 0, "name"]);
 *
 * @example
 * // Use the cursor to update state in a QRL
 * onClick$={() => {
 *   const currentFeatures = featuresCursor.deref();
 *   featuresCursor.swap((features) => [...features, newFeature]);
 * });
 */
export function useContextCursor<T extends Record<string, any>, V = any>(
  contextId: ContextId<T>,
  path?: readonly (string | number)[]
): [V, SerializableCursor<V>] {
  const contextValue = useContext(contextId);

  // Get committed and diff state if updating APP_STATE_CTX
  // Type-cast comparison since we're checking identity, not type compatibility
  const isAppState = (contextId as any) === (APP_STATE_CTX as any);
  const committedState = isAppState ? useContext(COMMITTED_STATE_CTX) : null;
  const diffState = isAppState ? useContext(DIFF_STATE_CTX) : null;

  // Normalize path to always be an array
  const normalizedPath = (path ?? []) as (string | number)[];

  // For reactivity, return the direct property access from the reactive store
  // The key is that we DON'T capture the value in a variable - we return
  // the property access itself so Qwik can track it
  let value: V;
  if (normalizedPath.length === 0) {
    value = contextValue as any as V;
  } else {
    // Navigate to the nested property - this maintains the proxy chain
    let current: any = contextValue;
    for (const key of normalizedPath) {
      current = current[key];
    }
    value = current as V;
  }

  // Deref function to get current value inside QRLs
  const deref = $(() => {
    return getNestedValue(contextValue, normalizedPath) as V;
  });

  const swap = $((updateFn: (value: V) => V) => {
    // Get current value, apply update function, then set new value
    const currentValue = getNestedValue(contextValue, normalizedPath) as V;
    const newValue = updateFn(currentValue);

    // Qwik's useStore provides deep reactivity - direct mutation triggers updates
    setNestedValue(contextValue, normalizedPath, newValue);

    // Handle localStorage and diff for APP_STATE_CTX
    if (isAppState && committedState && diffState) {
      localStorage.setItem("appState", JSON.stringify(contextValue));
      const newDiff = calculateDiff(committedState, contextValue as any);
      updateDiffState(diffState, newDiff);
    }
  });

  const reset = $((newValue: V) => {
    // Qwik's useStore provides deep reactivity - direct mutation triggers updates
    setNestedValue(contextValue, normalizedPath, newValue);

    // Handle localStorage and diff for APP_STATE_CTX
    if (isAppState && committedState && diffState) {
      localStorage.setItem("appState", JSON.stringify(contextValue));
      const newDiff = calculateDiff(committedState, contextValue as any);
      updateDiffState(diffState, newDiff);
    }
  });

  return [value, { deref, swap, reset }];
}
