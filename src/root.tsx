import {
  component$,
  useContextProvider,
  useStore,
  useVisibleTask$,
} from "@qwik.dev/core";
import {
  QwikRouterProvider,
  RouterOutlet,
  ServiceWorkerRegister,
} from "@qwik.dev/router";
import { RouterHead } from "./router-head";
import {
  createEmptyDataState,
  APP_STATE_CTX,
  COMMITTED_STATE_CTX,
  DIFF_STATE_CTX,
} from "./store/appStore";
import { DataState } from "./types/data";
import { calculateDiff, type DiffState } from "./store/diff";
import { useContextCursor } from "./hooks/useContextCursor";

import "./global.css";

// Use Vite's BASE_URL which respects the base config in vite.config.ts
// For GitHub Pages, this will be "/qwik-lens/" when base is set
// Remove trailing slash for JSON file paths
const base = import.meta.env.BASE_URL || "/";
const basePath = base === "/" ? "" : base.replace(/\/$/, "");
const featuresEndpoint = basePath + "/features.json";
const manifestEndpoint = basePath + "/manifest.json";

export default component$(() => {
  const state = useStore<DataState>(createEmptyDataState());
  const committedState = useStore<DataState>(createEmptyDataState());
  const diffState = useStore<DiffState>({
    hasChanges: false,
    changedPaths: [],
    summary: {
      addedCount: 0,
      modifiedCount: 0,
      deletedCount: 0,
    },
  });

  useContextProvider(APP_STATE_CTX, state);
  useContextProvider(COMMITTED_STATE_CTX, committedState);
  useContextProvider(DIFF_STATE_CTX, diffState);

  const [, stateCursor] = useContextCursor(APP_STATE_CTX);
  const [, committedCursor] = useContextCursor(COMMITTED_STATE_CTX);
  const [, diffCursor] = useContextCursor(DIFF_STATE_CTX);
  useVisibleTask$(
    async () => {
      // 1. Load committed state from JSON file
      const response = await fetch(featuresEndpoint);
      if (!response.ok) {
        throw new Error("Failed to load features.json");
      }
      const fileState = await response.json();

      const committedData: DataState = {
        count: 0,
        features: fileState.features,
      };

      // 2. Try to load staged state from localStorage
      const savedStaged = localStorage.getItem("appState");
      let stagedData: DataState;

      if (savedStaged) {
        const savedState = JSON.parse(savedStaged);
        // Merge: keep user's count, but use fresh features from JSON as base
        stagedData = {
          count: savedState.count ?? 0,
          features: fileState.features,
        };
      } else {
        // No localStorage, so staged = committed (no changes yet)
        stagedData = committedData;
        console.log("No staged state, using committed as initial staged");
      }

      // 3. Update committed state
      committedCursor.reset(committedData);

      // 4. Update staged state (main reactive state)
      stateCursor.reset(stagedData);

      // 5. Calculate initial diff
      const initialDiff = calculateDiff(committedData, stagedData);
      diffCursor.reset(initialDiff);

      // Note: localStorage persistence and diff recalculation now happens
      // in the useContextCursor hook when state is updated
    },
    { strategy: "document-ready" }
  );

  return (
    <QwikRouterProvider>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href={manifestEndpoint} />
        <RouterHead />
      </head>
      <body lang="en">
        <RouterOutlet />
        <ServiceWorkerRegister />
      </body>
    </QwikRouterProvider>
  );
});
