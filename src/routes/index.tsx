import { component$, useContext } from "@qwik.dev/core";
import { Link } from "@qwik.dev/router";
import { APP_STATE_CTX } from "~/store/appStore";
import { FeatureCard } from "~/components/FeatureCard";
import { useContextCursor } from "~/hooks/useContextCursor";
import { type Feature } from "~/types/data";
import { getRoutePath } from "~/utils/basePath";

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
        <Link href={getRoutePath("/features")}>View All Cards</Link>
      </div>

      <h2>Recent Cards</h2>
      <p
        style={{
          fontSize: "0.875rem",
          marginBottom: "calc(var(--spacing-unit) * 3)",
        }}
      >
        {Math.min(3, features?.length ?? 0)} of {features?.length ?? 0}
      </p>
      {features?.slice(0, 3).map((f: Feature) => (
        <FeatureCard key={f.id} feature={f} />
      ))}
    </div>
  );
});
