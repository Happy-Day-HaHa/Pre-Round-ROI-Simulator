# AGENTS.md - Mandatory instructions for Codex

You are working on a The Fresh Connection (TFC) pre-round ROI simulator / digital twin.

## Non-negotiable rules

1. Read `CODEX_INSTRUCTIONS.md`, `DATA_COVERAGE_AUDIT.md`, and `SOURCE_INDEX.md` before changing application logic.
2. Never invent a TFC number, menu option, coefficient, or causal formula.
3. Run `python scripts/unpack_knowledge.py` before implementation so the complete machine-readable knowledge bundle is available locally.
4. Treat extracted source files under `data/` as the primary factual data layer.
5. Preserve round identity. Round 0 is the completed baseline. Round 1 is currently an active decision scenario without realized results.
6. Distinguish observed source values, derived arithmetic, inferred relationships, and modeling assumptions.
7. If a game formula is unknown, implement it behind a named parameter/calibration function. Do not hard-code speculation as truth.
8. The user's main role is SCM, but the simulator must connect Purchasing, Operations, Sales, SCM, and Finance end-to-end.
9. Every predicted ROI result should expose an explanation trace showing which decision changed which KPI/cost/revenue/investment component.
10. Validate baseline reproduction before adding optimization.

## Core formula anchor

`ROI = Operating Profit / Total Investment`

Use this as the final accounting identity, not as proof that every internal TFC game formula is known.

## Modeling strategy

Prefer a hybrid calibrated model:
- deterministic accounting equations where reports expose exact relationships,
- explicit causal rules from the role guide,
- empirical calibration using rounds -2, -1, 0,
- bounded surrogate functions for game mechanics that are not directly exposed.

Every surrogate function must state its calibration data and uncertainty.
