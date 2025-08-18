# Architecture (POC)

## High-level components
- **Prompt Service**: Loads templates and style pack, compiles prompts, calls provider, streams output.
- **Style Linter**: Checks and optionally auto-repairs banned terms, required terms, and reading level bands.
- **Evaluation Harness**: Runs golden set through templates and computes basic quality and cost metrics.
- **Provider Layer**: Swappable implementation (mock by default).

## Flow
1) Brief → `draft_scaffold` → JSON scaffold
2) Section JSON → `section_expand` → prose draft
3) Rewrite/Localization → `rewrite_localize`
4) Summarization (timestamped sources) → `summarize_grounded`
5) Repurposing (channel presets) → `repurpose_pack`

## Versioning
Templates are named `id@semver.json`, e.g., `draft_scaffold@1.0.0.json`.
Log `(template_id, version, model, latency, tokens, violations)` per request.

## Entry Points and CLIs

- **app.js** — integrated CLI with commands: `health`, `generate`, `evaluate`, `validate`. Uses the `ContentBuddy` orchestrator under the hood.
- **src/cli.js** — task-focused CLI with: `scaffold`, `expand`, `rewrite`, `summarize`, `repurpose`.

## Providers and Fallback

Providers are selected by the `PROVIDER` env var or `configs/providers.json:defaultProvider`. If an API key is missing for a non-mock provider, the factory gracefully falls back to the mock provider.

## Golden Set Coverage

The `golden_set/` directory includes: `briefs/`, `transcripts/`, `repurposing/`, `provider_comparison/`, `performance/`, `style_compliance/`, `edge_cases/`, and `domain_specific/`. Use `node src/eval/runEvaluations.js` to run targeted or full suites.
