import { createContextId } from "@qwik.dev/core";
import { DataState } from "../types/data";
import type { DiffState } from "./diff";

export const APP_STATE_CTX = createContextId<DataState>("app.state");
export const COMMITTED_STATE_CTX =
  createContextId<DataState>("committed.state");
export const DIFF_STATE_CTX = createContextId<DiffState>("diff.state");

export const createEmptyDataState = (): DataState => ({
  count: 0,
  features: [],
});
