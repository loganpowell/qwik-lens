import { component$, useContext } from "@builder.io/qwik";
import type { Feature } from "~/types/data";
import { APP_STATE_CTX } from "~/store/appStore";
import { updateState } from "~/utils/stateHelpers";

export const FeatureCard = component$<{ feature: Feature }>(({ feature }) => {
  const state = useContext(APP_STATE_CTX);

  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", margin: "10px" }}>
      <h4>{feature.name}</h4>
      <p>{feature.description}</p>
      <input
        type="text"
        value={feature.name}
        onInput$={(e) => {
          const newName = (e.target as HTMLInputElement).value;

          updateState(state, ["features"], (features: Feature[]) =>
            features.map((f) =>
              f.id === feature.id ? { ...f, name: newName } : f
            )
          );
        }}
      />
    </div>
  );
});
