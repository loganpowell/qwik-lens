import { component$, useContext } from "@qwik.dev/core";
import { Link } from "@qwik.dev/router";
import { APP_STATE_CTX } from "~/store/appStore";
import { FeatureCard } from "~/components/FeatureCard";
import { useContextCursor } from "~/hooks/useContextCursor";
import type { Feature } from "~/types/data";
import { getRoutePath } from "~/utils/basePath";

export default component$(() => {
  // TypeScript infers the context type, you only specify the value type
  const [features, featuresCursor] = useContextCursor<any, Feature[]>(
    APP_STATE_CTX,
    ["features"]
  );

  // Sort features by ID - handle undefined/empty case
  const sortedFeatures = features.sort((a, b) => a.id.localeCompare(b.id));
  // console.log("Rendering Features page with features:", sortedFeatures);
  return (
    <div
      style={{
        padding: "calc(var(--spacing-unit) * 8)",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: "calc(var(--spacing-unit) * 6)" }}>
        <Link href={getRoutePath("/")}>Back</Link>
      </div>

      <h1>Pokémon Cards</h1>

      <button
        class="primary"
        onClick$={() => {
          // swap() receives the current value as a parameter - no await needed!
          featuresCursor.swap((currentFeatures: Feature[]) => {
            const newId = String(currentFeatures.length + 1);
            const newFeature: Feature = {
              id: newId,
              name: "New Pokémon",
              description: "A mysterious new Pokémon has appeared!",
              hp: 60,
              type: "Colorless",
              stage: "Basic",
              attacks: [
                {
                  name: "Tackle",
                  cost: ["Colorless"],
                  damage: "10",
                },
              ],
              retreatCost: 1,
              rarity: "Common",
              cardNumber: `${String(currentFeatures.length + 1).padStart(
                3,
                "0"
              )}`,
              set: "Custom Set",
            };
            return [...currentFeatures, newFeature];
          });
        }}
        style={{
          marginBottom: "calc(var(--spacing-unit) * 6)",
        }}
      >
        Add Pokémon Card
      </button>

      <div>
        <p
          style={{
            fontSize: "0.875rem",
            marginBottom: "calc(var(--spacing-unit) * 4)",
          }}
        >
          {sortedFeatures.length} total cards
        </p>
        {sortedFeatures.map((f) => (
          <FeatureCard key={f.id} feature={f} />
        ))}
      </div>
    </div>
  );
});
