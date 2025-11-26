import { Atom, defCursor } from "@thi.ng/atom";
import { createContextId } from "@builder.io/qwik";
import { AppState, DataState } from "../types/data";
import type { DiffState } from "./diff";

export const APP_STATE_CTX = createContextId<DataState>("app.state");
export const DIFF_STATE_CTX = createContextId<DiffState>("diff.state");

const createEmptyDataState = (): DataState => ({
  count: 0,
  features: [],
});

const createInitialState = (): AppState => ({
  committed: createEmptyDataState(),
  staged: createEmptyDataState(),
  diff: {
    hasChanges: false,
    changedPaths: [],
    summary: {
      addedCount: 0,
      modifiedCount: 0,
      deletedCount: 0,
    },
  },
});

export const appAtom = new Atom<AppState>(createInitialState());

// Cursors for accessing different parts of state
export const committedCursor = defCursor(appAtom, ["committed"]);
export const stagedCursor = defCursor(appAtom, ["staged"]);
export const diffCursor = defCursor(appAtom, ["diff"]);
