# AI Module (Stubbed)

This folder is a placeholder for future AI-powered features — demand prediction and
route optimization suggestions. No external AI provider is connected yet.

## Current behavior

Everything here uses simple rule-based logic (no API key, no cost, no network calls),
so the platform is fully functional without an AI subscription.

## Folder structure

- `prediction/` — functions that estimate things like delivery demand or delay risk.
  Currently rule-based (e.g. averages, thresholds).
- `prompts/` — prompt templates, ready to send to an LLM once one is connected.
  Not currently used by the rule-based functions, but kept here so the eventual
  switch to a real AI provider is a drop-in change.

## How to activate a real AI provider later

1. Choose a provider (e.g. Anthropic Claude API or OpenAI).
2. Add the provider's API key to `backend/.env` (e.g. `ANTHROPIC_API_KEY=...`).
3. In `backend/src/services/aiService.js`, replace the rule-based function bodies
   with an API call, using the matching prompt template from `ai/prompts/`.
4. No changes needed in controllers, routes, or the frontend — they already call
   `aiService.js` functions by name, not by implementation.