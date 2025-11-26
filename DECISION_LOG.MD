# DECISION_LOG.md

A running log of technical decisions made during development.

---

## Template

### [DATE] — [Short Title]

**Decision:** What was decided

**Context:** Why this decision came up

**Options Considered:**
1. Option A — pros/cons
2. Option B — pros/cons

**Rationale:** Why we chose what we chose

**Consequences:** What this means for the project

---

## Decisions

### 2025-11-26 — Project Initialized

**Decision:** Start with Next.js 16 App Router, React Flow, Fal.ai, Tailwind v4, deployed on Vercel.

**Context:** Need a simple stack to build a workflow canvas MVP.

**Rationale:**
- Next.js App Router is the modern default
- React Flow is the standard for node-based UIs
- Fal.ai provides simple API access to multiple models
- Tailwind is fast for prototyping
- Vercel is zero-config for Next.js

**Consequences:** Locked into these choices for MVP. Can revisit post-MVP if needed.

---

### 2025-11-26 — create-next-app Options

**Decision:** Used `create-next-app` with TypeScript, Tailwind, ESLint, App Router, no src directory, default `@/*` import alias, no React Compiler.

**Context:** Setting up the initial Next.js project scaffold.

**Options Considered:**
1. src directory — Adds nesting but some prefer the organization
2. No src directory — Flatter structure, simpler for small projects

**Rationale:**
- No src directory keeps things flat and simple for an MVP
- React Compiler is still experimental, skipped for stability
- Default import alias `@/*` is conventional and works well

**Consequences:** Standard Next.js 16 project structure. Easy to add src directory later if needed.

---

<!-- Add new decisions above this line -->