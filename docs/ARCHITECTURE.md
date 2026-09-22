# Web prototype architecture

The website lives in `site/` and runs as a static web app. It has no build step or backend.

## Data flow

1. `screens.js` stores the values transcribed from the user-supplied screenshots. The UI cites the image number near each report or decision table.
2. `model.js` stores the observed Round 0 finance anchor, the named surrogate assumptions, and the global `calculateScenario()` engine.
3. `app.js` keeps saved decisions grouped by Purchasing, Operations, Sales, and Supply Chain in browser `localStorage`. Editing is a draft; only saving changes the scenario. Round 0 views remain read-only.
4. Every department save calls `calculateScenario()` with the entire saved scenario. The engine derives item-level raw and finished-goods inventory, service, revenue, cost, operating profit, investment, and ROI.
5. The sticky header and save-impact panel update immediately. Department and full-scenario resets use the same recalculation path. Saved scenario snapshots store decisions; results are recalculated when a snapshot is loaded.

## Provenance and round identity

| Value | Round | Status | Source |
| --- | ---: | --- | --- |
| Operating profit -€306,503.3078 | 0 | observed | `DATA_COVERAGE_AUDIT.md`, extracted finance report |
| Total investment €3,989,513.2650 | 0 | observed | `DATA_COVERAGE_AUDIT.md`, extracted finance report |
| Reported ROI -7.68% | 0 | observed | `DATA_COVERAGE_AUDIT.md`, extracted finance report |
| Visible supplier, customer, operations, and SCM settings | 1 | observed in screenshots, then editable locally | User-supplied screenshots; image numbers in `screens.js` |
| Full underlying game dataset and formulas | 1 | unavailable | Detailed bundle unavailable in current repository state |
| ROI after a decision change | 1 | estimated, conditional | Round 0 anchor + screenshot report values + explicit surrogate delta model |

The Round 1-named finance workbook contains historical columns through Round 0, not realized Round 1 financial results. The prototype never labels that workbook as Round 1 performance.

## Model boundaries

The final accounting identity is `ROI = operating profit / total investment`. Round 0 reproduces -7.68% at report precision. The displayed Round 1 original estimate starts from that finance anchor because realized Round 1 financials do not exist. Its equality to Round 0 is an **anchor assumption**, not a measured Round 1 outcome.

Item-level inventory deltas use the Round 0 raw-material and finished-product reports' inventory values and weeks. Supplier purchase spend, customer revenue, weekly product revenue, and the Round 0 gross-margin ratio come from the visible reports. Saved changes from all four departments flow into one scenario. The estimated finance bridge is recalculated from the full scenario on each save, so effects accumulate without double counting prior saves.

The TFC internal causal coefficients are unknown. `FINANCE_ANCHORS` in `site/model.js` records observed Round 0 accounting values from `FinanceReport_0라운드.xlsx`. The model derives a 7.5% inventory interest rate per round (€24,106.8369 / €321,424.4914), €20,000 per warehouse employee per round (€100,000 / 5 and €80,000 / 4), and €100 per pallet position per round (€90,000 / 900 and €150,000 / 1,500). Applying these observed unit costs to a changed decision is a **linear extrapolation**, not a verified game formula. `MODEL_ASSUMPTIONS` also declares uncalibrated coefficients, including a 26-week period, 0.8 percentage point service response per finished-goods safety-stock week, and €18,000 per bottling shift per round. The service, purchasing, labor, obsolescence, and investment effects remain estimates based on these assumptions. The UI labels the result accordingly and exposes a calculation trace and key assumptions.

Only inputs connected to the current quantitative model are editable. Reported outcomes such as realized service level, revenue, inventory value, and ROI are derived or read-only. Purchasing contract index, lead time, payment term, and agreed delivery reliability; Operations warehouse positions, staff, and shifts; Sales contract index, target service, shelf-life condition, and payment term; and Supply Chain safety stock, order size, production interval, and frozen period are modeled. Other visible controls remain read-only until their causal parameters can be supported.

## Missing source pack

`python3 scripts/unpack_knowledge.py` currently fails because `knowledge_pack/tfc_text_bundle.tar.gz.b64` is absent from `main`. Git history contains a truncated archive and `safe_chunks/` currently contains only parts 000–002; those parts do not form a valid complete archive. The website shows the values visible in the supplied screenshots and leaves unsupported values or calculations unavailable. When the complete source pack is supplied, normalize it into a versioned JSON file, bind decision inputs to source values, and validate each finance line item against the observed baseline before extending the causal model.
