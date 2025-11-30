import { component$, useContext } from "@qwik.dev/core";
import type { Feature } from "~/types/data";
import { APP_STATE_CTX } from "~/store/appStore";
import { useContextCursor } from "~/hooks/useContextCursor";

export const FeatureCard = component$<{ feature: Feature }>(({ feature }) => {
  const [, featuresCursor] = useContextCursor(APP_STATE_CTX, ["features"]);

  return (
    <div
      style={{
        borderTop: "1px solid var(--color-border)",
        paddingTop: "calc(var(--spacing-unit) * 3)",
        paddingBottom: "calc(var(--spacing-unit) * 3)",
        display: "grid",
        gap: "calc(var(--spacing-unit) * 2)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
        }}
      >
        <div style={{ flex: 1 }}>
          <h4
            style={{
              marginBottom: "calc(var(--spacing-unit) * 1)",
              fontWeight: "900",
            }}
          >
            {feature.name}
          </h4>
        </div>
        <button
          class="accent"
          onClick$={() => {
            featuresCursor.swap((features: Feature[]) =>
              features.filter((f) => f.id !== feature.id)
            );
          }}
          style={{
            padding:
              "calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2)",
            fontSize: "0.75rem",
          }}
        >
          Delete
        </button>
      </div>
      <input
        type="text"
        value={feature.name}
        placeholder="Feature name"
        onInput$={(e) => {
          const newName = (e.target as HTMLInputElement).value;

          featuresCursor.swap((features: Feature[]) =>
            features.map((f) =>
              f.id === feature.id ? { ...f, name: newName } : f
            )
          );
        }}
      />
    </div>
  );
});
