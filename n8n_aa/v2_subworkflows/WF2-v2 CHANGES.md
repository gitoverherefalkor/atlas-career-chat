# WF2-v2 Changes: Pull init_summary from Supabase

These are the surgical changes needed in WF2 (Source to Enrich 15 - 2) to work with the new WF1-v2 approach where only `report_id` is passed (no more Initial Summary text blob).

## Context

WF1-v2 now inserts `init_summary` into `report_sections` table BEFORE firing WF2.
WF2 only receives `report_id` from WF1 (not the full summary text).
WF2's `SB extract profile` node ALREADY queries `report_sections` for the report_id.
So init_summary is ALREADY in the Supabase results - we just need to use it.

---

## Change 1: `repID_init` node (Set node)

**Current:** Extracts from aggregated WF1 data
```
report id = {{ $json.data[1].report_id }}
Initial Summary (output) = {{ $json.data[0]['Initial Summary (output)'] }}
```

**New:** Only extracts report_id (summary is no longer passed in)
```
report id = {{ $json.report_id }}
```

Remove the `Initial Summary (output)` assignment entirely.

---

## Change 2: `Combine rep and profile` code node

**Current code:**
```javascript
const initialSummary = $('repID_init').first().json['Initial Summary (output)'];
const rows = $input.all().map(item => item.json);
const report = rows.reduce((acc, row) => {
  acc[row.section_type] = row.content;
  return acc;
}, {
  report_id: rows[0]?.report_id || null,
  initial_summary: initialSummary
});
return [{ json: report }];
```

**New code:**
```javascript
// init_summary is now in the Supabase rows (already queried by SB extract profile)
const rows = $input.all().map(item => item.json);

const report = rows.reduce((acc, row) => {
  // Map init_summary section_type to initial_summary key (for prompt compatibility)
  if (row.section_type === 'init_summary') {
    acc.initial_summary = row.content;
  } else {
    acc[row.section_type] = row.content;
  }
  return acc;
}, {
  report_id: rows[0]?.report_id || null
});

return [{ json: report }];
```

This works because `SB extract profile` already fetches ALL report_sections for the report_id, which now includes `init_summary` (inserted by WF1-v2 before WF2 fires).

---

## Change 3: `Region extract` LLM node

**Current prompt references:**
```
{{ $json["Initial Summary (output)"] }}
```

**New:** This node is fed from `repID_init` which no longer has the summary.
Instead, route it from `Combine rep and profile` output, or change to:
```
{{ $json.initial_summary }}
```

Option A (simplest): Move the Region extract to AFTER `Combine rep and profile` and reference `{{ $json.initial_summary }}`

Option B: Add a separate Supabase read for init_summary before Region extract (wasteful, not recommended)

**Recommended: Option A** - just reorder so Region extract runs after Combine rep and profile.

---

## Change 4: Connection rewiring

Current flow:
```
When Executed by Another Workflow → repID_init → [Region extract, SB extract profile, Merge]
```

New flow:
```
When Executed by Another Workflow → repID_init → SB extract profile → Combine rep and profile → [Region extract, Set Suitable 15 Prompt]
```

The Region extract and the suitable_15 prompt can run in parallel since they both only need the combined report data.

---

## Summary of what's removed
- `Initial Summary (output)` field from `repID_init`
- Direct reference to `$('repID_init').first().json['Initial Summary (output)']` in Combine node

## Summary of what's preserved
- All prompts: ZERO changes to any prompt text
- All LLM calls: same models, same configs
- All downstream logic: unchanged
- `SB extract profile`: unchanged (already fetches all sections including init_summary)
