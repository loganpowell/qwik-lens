export interface Feature {
  id: string;
  name: string;
  description: string;
}

export interface DataState {
  count: number;
  features: Feature[];
}

export interface AppState {
  // Baseline from JSON file (read-only reference)
  committed: DataState;

  // Working copy (user modifications)
  staged: DataState;

  // Computed diff (committed vs staged)
  diff: {
    hasChanges: boolean;
    changedPaths: string[];
    summary: {
      addedCount: number;
      modifiedCount: number;
      deletedCount: number;
    };
  };
}
