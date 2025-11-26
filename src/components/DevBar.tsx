import { component$, useContext } from "@builder.io/qwik";
import {
  diffCursor,
  stagedCursor,
  committedCursor,
  APP_STATE_CTX,
  DIFF_STATE_CTX,
} from "~/store/appStore";
import { getDiffSummary, calculateDiff } from "~/store/diff";

export const DevBar = component$(() => {
  const diff = useContext(DIFF_STATE_CTX);
  const state = useContext(APP_STATE_CTX);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        background: "#eee",
        padding: "10px",
        border: "1px solid #ccc",
        minWidth: "250px",
      }}
    >
      <h3>Dev Bar</h3>

      {/* Diff Status */}
      <div style={{ marginBottom: "10px" }}>
        <strong>Changes:</strong>{" "}
        <span style={{ color: diff.hasChanges ? "orange" : "green" }}>
          {getDiffSummary(diff)}
        </span>
      </div>

      {/* State Info */}
      <p style={{ fontSize: "12px", margin: "5px 0" }}>
        Count: {state.count} | Features: {state.features.length}
      </p>

      {/* Actions */}
      <div style={{ display: "flex", gap: "5px", flexDirection: "column" }}>
        <button
          onClick$={() => {
            localStorage.removeItem("appState");
            window.location.reload();
          }}
          style={{
            padding: "5px 10px",
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Reset (Reload)
        </button>

        <button
          onClick$={() => {
            // Rollback: reset staged to committed
            const committed = committedCursor.deref();
            stagedCursor.reset(committed);

            // Update Qwik store to match
            Object.assign(state, committed);

            // Clear localStorage
            localStorage.removeItem("appState");

            // Recalculate diff (should now be "no changes")
            const newDiff = calculateDiff(committed, committed);
            Object.assign(diff, newDiff);
          }}
          disabled={!diff.hasChanges}
          style={{
            padding: "5px 10px",
            background: diff.hasChanges ? "#ff9800" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: diff.hasChanges ? "pointer" : "not-allowed",
          }}
        >
          Rollback Changes
        </button>

        <button
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
                committedCursor.reset(state);

                // Clear localStorage since committed now matches staged
                localStorage.removeItem("appState");

                // Recalculate diff (should now be "no changes")
                const newDiff = calculateDiff(state, state);
                Object.assign(diff, newDiff);

                alert("Features committed to file successfully!");
              } else {
                alert("Failed to commit features");
              }
            } catch (error) {
              console.error("Error committing features:", error);
              alert("Error committing features");
            }
          }}
          disabled={!diff.hasChanges}
          style={{
            padding: "5px 10px",
            background: diff.hasChanges ? "#4CAF50" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: diff.hasChanges ? "pointer" : "not-allowed",
          }}
        >
          Commit to File
        </button>
      </div>
    </div>
  );
});
