import {
  component$,
  useContextProvider,
  useStore,
  useVisibleTask$,
} from "@builder.io/qwik";
import {
  QwikCityProvider,
  RouterOutlet,
  ServiceWorkerRegister,
} from "@builder.io/qwik-city";
import { RouterHead } from "./router-head";
import {
  appAtom,
  stagedCursor,
  APP_STATE_CTX,
  DIFF_STATE_CTX,
} from "./store/appStore";
import { DataState } from "./types/data";
import { calculateDiff, type DiffState } from "./store/diff";

import "./global.css";

export default component$(() => {
  const state = useStore<DataState>(stagedCursor.deref());
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
  useContextProvider(DIFF_STATE_CTX, diffState);

  useVisibleTask$(async () => {
    // 1. Load committed state from JSON file
    const response = await fetch("/features.json");
    const fileState = await response.json();
    const committedData: DataState = {
      count: 0,
      features: fileState.features,
    };

    // 2. Try to load staged state from localStorage
    const savedStaged = localStorage.getItem("appState");
    let stagedData: DataState;

    if (savedStaged) {
      stagedData = JSON.parse(savedStaged);
      console.log("Loaded staged state from localStorage");
    } else {
      // No localStorage, so staged = committed (no changes yet)
      stagedData = JSON.parse(JSON.stringify(committedData));
      console.log("No staged state, using committed as initial staged");
    }

    // 3. Update atom with both committed and staged
    appAtom.swap((s) => ({
      ...s,
      committed: committedData,
      staged: stagedData,
    }));

    // 4. Calculate initial diff
    const initialDiff = calculateDiff(committedData, stagedData);
    console.log("Initial diff:", initialDiff);
    appAtom.swap((s) => ({ ...s, diff: initialDiff }));
    Object.assign(diffState, initialDiff);

    // 5. Sync Qwik store with staged cursor
    Object.assign(state, stagedData);

    // 6. Watch for staged changes and save to localStorage + recalculate diff
    stagedCursor.addWatch("persist-to-localstorage", (id, prev, curr) => {
      localStorage.setItem("appState", JSON.stringify(curr));

      // Recalculate diff whenever staged changes
      const committed = appAtom.deref().committed;
      const newDiff = calculateDiff(committed, curr);
      appAtom.swap((s) => ({ ...s, diff: newDiff }));

      // Update Qwik diff store for reactivity
      Object.assign(diffState, newDiff);
    });
  });

  return (
    <QwikCityProvider>
      <head>
        <meta charSet="utf-8" />
        <link rel="manifest" href="/manifest.json" />
        <RouterHead />
      </head>
      <body lang="en">
        <RouterOutlet />
        <ServiceWorkerRegister />
      </body>
    </QwikCityProvider>
  );
});
