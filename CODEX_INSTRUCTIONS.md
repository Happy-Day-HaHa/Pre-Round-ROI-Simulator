# Codex Implementation Instructions

## Objective

Build a TFC-like web prototype that predicts the financial and operational effect of current-round decisions before the official round calculation.

The user should be able to change decision values and see estimated ROI, operating profit, total investment, revenue / bonus-penalty effects, inventory effects, service-level effects, capacity / labor / overflow effects, obsolescence / write-off effects, explanatory causal chain, and comparison versus Round 0 baseline.

## First action

Run:

```bash
python scripts/unpack_knowledge.py
```

Then read:
1. `AGENTS.md`
2. `DATA_COVERAGE_AUDIT.md`
3. `SOURCE_INDEX.md`
4. `data/master_dataset.json`
5. `docs/TFC_role_guide_full_text.txt`
6. `docs/PROJECT_CONTEXT.md`
7. `docs/PRIOR_CONTEXT_RECOVERED.md`

## Required implementation phases

1. Data layer: normalize round, department, entity, decision variable, KPI, financial line item, provenance/status.
2. Baseline reproduction: reproduce Round 0 finance statement and ROI from source data.
3. Decision engine: implement current levers across Purchasing, Operations, Sales, SCM.
4. Causal model: use source-supported relationships; label unknown coefficients as inferred/assumed.
5. Scenario UI: TFC-inspired department tabs, editable controls, KPI dashboard, finance bridge, sensitivity view, explanation panel.

## Round handling

- Rounds -2, -1, 0 are historical completed data.
- Round 0 is the baseline.
- Round 1 settings are scenario inputs.
- Round 1 finance/My Company values currently shown are historical values through Round 0, not realized Round 1 performance.

## Data conflict policy

Priority:
1. Exact source workbook/report value.
2. Exact visible screenshot value.
3. Full role guide statement.
4. Recovered prior-context note.
5. Inference/assumption.

Record conflicts instead of silently overwriting them.

## Never do

- Do not fabricate a Round 1 ROI.
- Do not use a guessed coefficient without labeling it.
- Do not optimize local department KPIs independently of total-company ROI.
- Do not delete original observed values during normalization.
