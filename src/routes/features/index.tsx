import { component$, useContext } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { APP_STATE_CTX } from "~/store/appStore";
import { FeatureCard } from "~/components/FeatureCard";
import { updateState } from "~/utils/stateHelpers";
import type { Feature } from "~/types/data";

export default component$(() => {
  const state = useContext(APP_STATE_CTX);

  // Sort features by ID
  const sortedFeatures = [...state.features].sort((a, b) =>
    a.id.localeCompare(b.id)
  );

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/">← Back to Home</Link>
      </div>

      <h1>All Features</h1>

      <button
        onClick$={() => {
          const newId = String(state.features.length + 1);
          const newFeature = {
            id: newId,
            name: `Feature ${newId}`,
            description: "New feature description",
          };

          updateState(state, ["features"], (features: Feature[]) => [
            ...features,
            newFeature,
          ]);
        }}
        style={{
          padding: "10px 20px",
          marginBottom: "20px",
          background: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        + Add New Feature
      </button>

      <div>
        <h2>Features (sorted by ID)</h2>
        <p>Total: {sortedFeatures.length}</p>
        {sortedFeatures.map((f) => (
          <FeatureCard key={f.id} feature={f} />
        ))}
      </div>
    </div>
  );
});
