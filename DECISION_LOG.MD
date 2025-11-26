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

### 2025-11-26 — Node Creation UI: Sidebar Palette

**Decision:** Use a sidebar palette with drag-and-drop for node creation.

**Context:** Phase 2 requires a way for users to add nodes to the canvas.

**Options Considered:**
1. Toolbar buttons — Simple but gets crowded with many node types
2. Right-click context menu — Clean but less discoverable
3. Sidebar palette (drag) — Scalable, familiar from Figma/Runway

**Rationale:**
- Scales well as we add more node types (Text, Image, Video, Flux, Veo)
- Drag-and-drop is intuitive and matches workflow tools like Runway
- Shows available nodes at a glance for discoverability

**Consequences:** Slightly more implementation work than a simple button, but better UX foundation for Phase 3+.

---

### 2025-11-26 — React Flow State Management

**Decision:** Use React Flow's built-in `useNodesState` and `useEdgesState` hooks.

**Context:** Need to manage node and edge state for the canvas.

**Rationale:**
- Built-in hooks handle all node/edge operations (add, update, delete)
- No need for external state management (Redux, Zustand) for MVP
- Simple and recommended by React Flow documentation

**Consequences:** State resets on page refresh (no persistence), which is acceptable for MVP scope.

---

<!-- Add new decisions above this line -->