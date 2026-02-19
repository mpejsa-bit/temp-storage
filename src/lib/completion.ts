// completion.ts — Pure calculation engine for scope completion percentages.
// No UI, no API routes. Just exported functions.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TabCompletionConfig {
  required_fields: string[];
  min_rows?: number;
}

export interface TabCompletion {
  percent: number;        // 0-100, rounded to nearest integer
  filled: number;         // count of filled required items
  total: number;          // total required items
  missingFields: string[]; // field keys that are still empty
}

export interface ScopeCompletion {
  overall: number;  // 0-100, average of all tab percents, rounded
  tabs: Record<string, TabCompletion>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** All editable tab keys in display order. */
export const EDITABLE_TABS = [
  "overview",
  "contacts",
  "marketplace",
  "upas",
  "solution",
  "gaps",
  "workshop",
  "training",
  "forms",
  "install",
  "workflow",
] as const;

/** Tabs that have a single row of fixed fields (as opposed to row-based). */
const FIXED_FIELD_TABS = new Set<string>(["overview", "workflow"]);

/**
 * Maps tab keys to their corresponding property name in the scopeData object
 * passed to `computeScopeCompletion`.
 */
const TAB_DATA_KEY_MAP: Record<string, string> = {
  overview: "overview",
  contacts: "contacts",
  marketplace: "marketplace_apps",
  upas: "upas",
  solution: "features",
  gaps: "gaps",
  workshop: "workshop_questions",
  training: "training_questions",
  forms: "forms",
  install: "forecasts",
  workflow: "workflow_technical",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A value is considered empty if it is null, undefined, or the empty string. */
function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

// ---------------------------------------------------------------------------
// Core: computeTabCompletion
// ---------------------------------------------------------------------------

export function computeTabCompletion(
  tabKey: string,
  tabData: Record<string, any> | Record<string, any>[],
  config: TabCompletionConfig,
): TabCompletion {
  if (FIXED_FIELD_TABS.has(tabKey)) {
    return computeFixedFieldTab(tabData as Record<string, any>, config);
  }
  return computeRowBasedTab(tabData as Record<string, any>[], config);
}

// ---------------------------------------------------------------------------
// Fixed-field tab logic
// ---------------------------------------------------------------------------

function computeFixedFieldTab(
  data: Record<string, any>,
  config: TabCompletionConfig,
): TabCompletion {
  const fields = config.required_fields;

  if (!fields || fields.length === 0) {
    return { percent: 100, filled: 0, total: 0, missingFields: [] };
  }

  const obj = data ?? {};
  const missingFields: string[] = [];
  let filled = 0;

  for (const field of fields) {
    if (isEmpty(obj[field])) {
      missingFields.push(field);
    } else {
      filled++;
    }
  }

  const total = fields.length;
  const percent = total === 0 ? 100 : Math.round((filled / total) * 100);

  return { percent, filled, total, missingFields };
}

// ---------------------------------------------------------------------------
// Row-based tab logic
// ---------------------------------------------------------------------------

function computeRowBasedTab(
  data: Record<string, any>[],
  config: TabCompletionConfig,
): TabCompletion {
  const allRows = Array.isArray(data) ? data : [];
  const fields = config.required_fields;
  const minRows = config.min_rows ?? 0;

  // Filter out completely empty rows — rows where ALL fields are empty
  // so blank placeholder rows don't count against completion.
  const rows = allRows.filter(row => {
    return Object.entries(row).some(([key, val]) => {
      if (key === "id" || key === "scope_id" || key === "sort_order" || key === "created_at" || key === "updated_at") return false;
      return !isEmpty(val);
    });
  });
  const actualRows = rows.length;

  const hasRowCountComponent = minRows > 0;
  const hasCompletenessComponent = fields && fields.length > 0;

  // Neither component configured — fully complete by default.
  if (!hasRowCountComponent && !hasCompletenessComponent) {
    return { percent: 100, filled: 0, total: 0, missingFields: [] };
  }

  // --- Row count score ---
  let rowCountScore = 0;
  let rowCountFilled = 0;
  let rowCountTotal = 0;

  if (hasRowCountComponent) {
    rowCountScore = Math.min(actualRows / minRows, 1) * 100;
    rowCountFilled = Math.min(actualRows, minRows);
    rowCountTotal = minRows;
  }

  // --- Row completeness score ---
  // When min_rows is set, only check required fields on up to min_rows rows.
  // This way, setting min_rows=5 with required_fields=["response"] means
  // "I need at least 5 rows with response filled" — not every row.
  let completenessScore = 0;
  let cellsFilled = 0;
  let cellsTotal = 0;
  const missingFieldSet = new Set<string>();

  if (hasCompletenessComponent) {
    const rowsToCheck = hasRowCountComponent ? rows.slice(0, minRows) : rows;
    cellsTotal = rowsToCheck.length * fields.length;

    if (rowsToCheck.length === 0) {
      completenessScore = 0;
      for (const f of fields) {
        missingFieldSet.add(f);
      }
    } else {
      for (const row of rowsToCheck) {
        for (const field of fields) {
          if (isEmpty(row[field])) {
            missingFieldSet.add(field);
          } else {
            cellsFilled++;
          }
        }
      }
      completenessScore = cellsTotal === 0 ? 100 : (cellsFilled / cellsTotal) * 100;
    }
  }

  // --- Combine ---
  let percent: number;
  let filled: number;
  let total: number;

  if (hasRowCountComponent && hasCompletenessComponent) {
    percent = Math.round((rowCountScore + completenessScore) / 2);
    filled = rowCountFilled + cellsFilled;
    total = rowCountTotal + cellsTotal;
  } else if (hasRowCountComponent) {
    percent = Math.round(rowCountScore);
    filled = rowCountFilled;
    total = rowCountTotal;
  } else {
    percent = Math.round(completenessScore);
    filled = cellsFilled;
    total = cellsTotal;
  }

  return { percent, filled, total, missingFields: Array.from(missingFieldSet) };
}

// ---------------------------------------------------------------------------
// Core: computeScopeCompletion
// ---------------------------------------------------------------------------

export function computeScopeCompletion(
  scopeData: Record<string, any>,
  config: Record<string, TabCompletionConfig>,
): ScopeCompletion {
  const tabs: Record<string, TabCompletion> = {};
  let totalPercent = 0;

  for (const tabKey of EDITABLE_TABS) {
    const dataKey = TAB_DATA_KEY_MAP[tabKey] ?? tabKey;
    const tabData = scopeData[dataKey];
    const tabConfig = config[tabKey];

    if (!tabConfig) {
      // No config for this tab — treat as 100% complete.
      tabs[tabKey] = { percent: 100, filled: 0, total: 0, missingFields: [] };
    } else {
      tabs[tabKey] = computeTabCompletion(
        tabKey,
        tabData ?? (FIXED_FIELD_TABS.has(tabKey) ? {} : []),
        tabConfig,
      );
    }

    totalPercent += tabs[tabKey].percent;
  }

  const overall = Math.round(totalPercent / EDITABLE_TABS.length);

  return { overall, tabs };
}
