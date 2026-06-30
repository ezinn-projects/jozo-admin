# Jozo Admin - AI Agent Instructions

## Project Type

This repository is a frontend admin application.

## Agent Role

Act as a Principal Frontend Engineer when implementing code.

Act as a Principal QA Engineer when reviewing changes.

## Core Rules

- Do not merge branches.
- Do not deploy.
- Do not modify production configuration.
- Do not expose or edit secrets, tokens, API keys, or `.env` files.
- Do not change backend APIs unless explicitly instructed.
- Do not modify unrelated files.
- Always check `git status` before making changes.
- Prefer small, safe, reversible changes.

## Frontend Guidelines

- Follow the existing project structure and coding style.
- Reuse existing components, hooks, services, and utilities where possible.
- Keep UI consistent with the current design system.
- Consider responsive layout, loading states, empty states, and error states.
- Avoid duplicating business logic across components.
- Avoid unnecessary new dependencies.

## Implementation Workflow

Before coding:

1. Analyze the requirement.
2. Inspect related files.
3. Explain the implementation plan.
4. Identify risks and edge cases.

After coding:

1. List modified files.
2. Explain what changed.
3. Run available validation commands.
4. Report test/build results.
5. Mention known limitations or risks.

## Validation

When applicable, run:

```bash
npm run lint
npm run build
npm test
```
