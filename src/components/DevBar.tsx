import { component$, useContext } from "@builder.io/qwik";
import {
  APP_STATE_CTX,
  COMMITTED_STATE_CTX,
  DIFF_STATE_CTX,
} from "~/store/appStore";
import { getDiffSummary, calculateDiff } from "~/store/diff";
import { useContextCursor } from "~/hooks/useContextCursor";

export const DevBar = component$(() => {
  const [diff, diffCursor] = useContextCursor(DIFF_STATE_CTX);
  const [state, stateCursor] = useContextCursor(APP_STATE_CTX);
  const [commits, commitsCursor] = useContextCursor(COMMITTED_STATE_CTX);

  return (
    <div
      style={{
        position: "fixed",
        top: "calc(var(--spacing-unit) * 3)",
        right: "calc(var(--spacing-unit) * 3)",
        background: "var(--color-bg)",
        padding: "calc(var(--spacing-unit) * 3)",
        border: "1px solid var(--color-border)",
        minWidth: "280px",
        fontSize: "0.75rem",
      }}
    >
      <h3
        style={{
          marginBottom: "calc(var(--spacing-unit) * 3)",
          fontSize: "0.875rem",
        }}
      >
        Development
      </h3>

      {/* Diff Status */}
      <div style={{ marginBottom: "calc(var(--spacing-unit) * 2)" }}>
        <span style={{ color: "var(--color-text-secondary)" }}>Changes: </span>
        <span
          style={{
            color: diff.hasChanges
              ? "var(--color-accent)"
              : "var(--color-text-secondary)",
          }}
        >
          {getDiffSummary(diff)}
        </span>
      </div>

      {/* State Info */}
      <p
        style={{
          fontSize: "0.75rem",
          marginBottom: "calc(var(--spacing-unit) * 3)",
          color: "var(--color-text-secondary)",
        }}
      >
        {`Count: ${state.count} | Features: ${state.features.length}`}
      </p>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: "calc(var(--spacing-unit) * 1)",
          flexDirection: "column",
        }}
      >
        <button
          class="accent"
          onClick$={() => {
            localStorage.removeItem("appState");
            window.location.reload();
          }}
          style={{
            fontSize: "0.75rem",
            padding:
              "calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2)",
          }}
        >
          Reset
        </button>

        <button
          onClick$={() => {
            // Rollback: reset staged to committed
            stateCursor.reset(JSON.parse(JSON.stringify(commits)));

            // Clear localStorage
            localStorage.removeItem("appState");

            // Recalculate diff (should now be "no changes")
            diffCursor.reset(calculateDiff(commits, commits));
          }}
          disabled={!diff.hasChanges}
          style={{
            fontSize: "0.75rem",
            padding:
              "calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2)",
          }}
        >
          Rollback
        </button>

        <button
          class={diff.hasChanges ? "primary" : ""}
          onClick$={async () => {
            try {
              // Serialize the data to remove any circular references
              const serializedData = JSON.parse(JSON.stringify(state));

              const response = await fetch("/api/features", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ features: serializedData.features }),
              });

              if (response.ok) {
                // Update committed to match staged
                commitsCursor.reset(JSON.parse(JSON.stringify(state)));

                // Clear localStorage since committed now matches staged
                localStorage.removeItem("appState");

                // Recalculate diff (should now be "no changes")
                diffCursor.reset(calculateDiff(state, state));

                alert("✅ Features committed to file successfully!");
              } else {
                alert("❌ Failed to commit features");
              }
            } catch (error) {
              console.error("Error committing features:", error);
              alert("❌ Error committing features");
            }
          }}
          disabled={!diff.hasChanges}
          style={{
            fontSize: "0.75rem",
            padding:
              "calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2)",
          }}
        >
          Commit
        </button>
      </div>
    </div>
  );
});
