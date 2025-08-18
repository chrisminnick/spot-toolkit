# Using Content Buddy

## Quick Start

```bash
cp .env.example .env   # set PROVIDER (mock|openai|anthropic|gemini) and API keys
npm run health         # basic checks
npm run validate       # validate templates and configs
```

## Generate with the integrated CLI (app.js)

```bash
# Scaffold → Draft using named templates
node app.js generate draft_scaffold@1.0.0 golden_set/briefs/brief1.json out.json

# Evaluate the golden set
npm run eval             # runs 'node app.js evaluate'
node src/eval/runEvaluations.js --directory golden_set --operation all
```

## Task-focused CLI (src/cli.js)

```bash
# Brief → Scaffold (JSON)
npm run scaffold -- --asset_type "landing page" --topic "Privacy-first analytics" --audience "startup founders" --tone "confident" --word_count 600

# Expand a single section to prose
npm run expand -- --section_json '<JSON from scaffold>'

# Rewrite/localize
npm run rewrite -- --text 'Original...' --audience 'CFOs' --tone 'formal' --grade_level 9 --words 140 --locale 'en-GB'

# Summarize with citations
npm run summarize -- --file golden_set/transcripts/example_transcript.txt --mode executive

# Repurpose to channels
npm run repurpose -- --file golden_set/repurposing/example_article.md
```
