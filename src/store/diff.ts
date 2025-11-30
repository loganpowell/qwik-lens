import { equiv } from "@thi.ng/equiv";
import type { DataState } from "../types/data";

export interface DiffState {
  hasChanges: boolean;
  changedPaths: string[];
  summary: {
    addedCount: number;
    modifiedCount: number;
    deletedCount: number;
  };
}

export function calculateDiff(
  committed: DataState,
  staged: DataState
): DiffState {
  const changedPaths: string[] = [];
  let addedCount = 0;
  let modifiedCount = 0;
  let deletedCount = 0;

  // Compare features
  const committedFeatures = committed.features || [];
  const stagedFeatures = staged.features || [];

  stagedFeatures.forEach((feature) => {
    const committedFeature = committedFeatures.find((f) => f.id === feature.id);

    if (!committedFeature) {
      addedCount++;
      changedPaths.push(`features[${feature.id}]`);
    } else if (!equiv(feature, committedFeature)) {
      modifiedCount++;
      changedPaths.push(`features[${feature.id}]`);
    }
  });

  committedFeatures.forEach((feature) => {
    const stagedFeature = stagedFeatures.find((f) => f.id === feature.id);

    if (!stagedFeature) {
      deletedCount++;
      changedPaths.push(`features[${feature.id}]`);
    }
  });

  return {
    hasChanges: changedPaths.length > 0,
    changedPaths,
    summary: { addedCount, modifiedCount, deletedCount },
  };
}

export function getDiffSummary(diff: DiffState | undefined): string {
  if (!diff || !diff.hasChanges) return "No changes";

  const parts: string[] = [];
  if (diff.summary.addedCount > 0)
    parts.push(`${diff.summary.addedCount} added`);
  if (diff.summary.modifiedCount > 0)
    parts.push(`${diff.summary.modifiedCount} modified`);
  if (diff.summary.deletedCount > 0)
    parts.push(`${diff.summary.deletedCount} deleted`);

  return parts.join(", ");
}
