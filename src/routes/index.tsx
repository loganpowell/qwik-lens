import { component$, useContext } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { APP_STATE_CTX } from "~/store/appStore";
import { FeatureCard } from "~/components/FeatureCard";
import { useContextCursor } from "~/hooks/useContextCursor";
import { type Feature } from "~/types/data";

export default component$(() => {
  const [count, countCursor] = useContextCursor(APP_STATE_CTX, ["count"]);
  const [features] = useContextCursor(APP_STATE_CTX, ["features"]);

  return (
    <div
      style={{ padding: "calc(var(--spacing-unit) * 8)", maxWidth: "800px" }}
    >
      <h1>Qwik Lens</h1>

      <div style={{ marginBottom: "calc(var(--spacing-unit) * 4)" }}>
        <p
          style={{
            fontSize: "4rem",
            fontWeight: "300",
            marginBottom: "calc(var(--spacing-unit) * 2)",
          }}
        >
          {count < 10 ? `0${count}` : count}
        </p>
        <button
          class="primary"
          onClick$={() => {
            countCursor.swap((c: number) => c + 1);
          }}
        >
          Increment
        </button>
      </div>

      <hr />

      <div style={{ marginBottom: "calc(var(--spacing-unit) * 4)" }}>
        <Link href="/features">View All Features →</Link>
      </div>

      <h2>Recent Features</h2>
      <p
        style={{
          fontSize: "0.875rem",
          marginBottom: "calc(var(--spacing-unit) * 3)",
        }}
      >
        {Math.min(3, features.length)} of {features.length}
      </p>
      {features.slice(0, 3).map((f: Feature) => (
        <FeatureCard key={f.id} feature={f} />
      ))}
    </div>
  );
});
