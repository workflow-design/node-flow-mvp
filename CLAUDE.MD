# CLAUDE.md

## Project Overview

This is **node-flow-mvp** — a workflow canvas tool built with Next.js and React Flow that allows users to create AI-powered creative workflows using Fal.ai.

## Critical Rules

### 1. Always Reference the Spec

Before implementing any feature, read `PROJECT_SPEC.md` to understand:
- What phase we're in
- What's in scope vs out of scope
- The expected acceptance criteria

If a request conflicts with the spec, ask for clarification before proceeding.

### 2. Log All Decisions

Any time you make a technical choice (library, pattern, architecture), document it in `DECISION_LOG.md` with:
- What decision was made
- Why (tradeoffs considered)
- Date

Examples of decisions to log:
- Choosing a specific React Flow configuration
- Picking a state management approach
- Selecting a Fal.ai model
- Choosing a component structure
- Any deviation from the spec

### 3. Keep It Simple

This is an MVP. Resist the urge to:
- Add abstractions "for later"
- Install extra dependencies
- Build features not in the current phase
- Over-engineer state management

Ask: "Is this the simplest thing that could work?"

## Git Workflow

### Conventional Commits

All commits MUST follow the Conventional Commits specification.

**Format:**
```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

**Types:**
| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, tooling |

**Scope:** Optional, but encouraged. Use the area of the codebase:
- `canvas` — React Flow canvas
- `nodes` — Node components
- `api` — API routes
- `fal` — Fal.ai integration
- `ui` — General UI components

**Examples:**
```
feat(nodes): add TextNode component with editable input
fix(api): handle Fal.ai timeout errors gracefully
chore: add @fal-ai/serverless-client dependency
docs: update README with setup instructions
refactor(canvas): extract node connection logic to hook
```

**Rules:**
- Use imperative mood: "add" not "added" or "adds"
- Keep the summary under 72 characters
- Don't end with a period
- Reference issues in footer if applicable: `Closes #123`

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Canvas:** React Flow
- **AI Backend:** Fal.ai
- **Deployment:** Vercel

## Code Style

### General
- Use functional components with hooks
- Prefer `const` over `let`
- Use TypeScript strictly — avoid `any`
- Keep components small and focused

### File Naming
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `camelCase.ts` in `/types`

### React Flow Nodes
- Each node type gets its own file in `/components/nodes/`
- Node components receive `NodeProps<NodeData>` 
- Use handles for inputs (left) and outputs (right) for left-to-right flow

### API Routes
- Keep Fal.ai API key server-side only
- Use `/api/fal/[model]/route.ts` pattern for model calls
- Return consistent response shapes

## Project Structure
```
/app
  /page.tsx                    # Canvas page
  /api/fal/[model]/route.ts    # Fal.ai proxy routes

/components
  /Canvas.tsx                  # React Flow wrapper
  /nodes/                      # Node type components

/lib
  /fal.ts                      # Fal client utilities

/types
  /nodes.ts                    # Node type definitions
```

## Testing Your Work

After each phase, verify against the acceptance criteria in `PROJECT_SPEC.md`:

- **Phase 1:** App deploys and loads
- **Phase 2:** Can add nodes and connect them
- **Phase 3:** Base nodes hold and display values
- **Phase 4:** Model nodes call Fal.ai and show results

## Common Pitfalls

1. **Don't store Fal.ai key client-side** — always proxy through API routes
2. **Don't forget loading states** — Fal.ai calls take time
3. **Don't overcomplicate node state** — React Flow has built-in state management
4. **Don't skip the decision log** — future you will thank present you

## When Stuck

1. Re-read `PROJECT_SPEC.md`
2. Check `DECISION_LOG.md` for prior context
3. Ask for clarification rather than guessing