import {
  useSignal,
  useVisibleTask$,
  type Signal,
  noSerialize,
} from "@builder.io/qwik";

/**
 * Subscribe to a thi.ng/atom cursor and return a Qwik signal
 * The signal will automatically update when the cursor value changes
 *
 * Note: This uses client-side only reactivity via noSerialize
 */
export function useAtom<T>(cursor: any): Signal<T> {
  const signal = useSignal<T>(cursor.deref() as T);
  const cursorRef = useSignal(noSerialize(cursor));

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const c = cursorRef.value;
    if (!c) {
      console.warn("useAtom: cursor is null");
      return;
    }

    const watchId = `useAtom-${Math.random().toString(36).slice(2)}`;

    console.log("useAtom: setting up watch", watchId);

    c.addWatch(watchId, (_id: string, _prev: any, curr: T) => {
      console.log("useAtom: cursor changed", watchId, curr);
      signal.value = curr;
    });

    // Set initial value
    signal.value = c.deref() as T;

    cleanup(() => {
      console.log("useAtom: removing watch", watchId);
      c.removeWatch(watchId);
    });
  });

  return signal;
}
