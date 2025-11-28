# Node Flow MVP

Workflow canvas tool for AI-powered creative workflows. Built with Next.js, React Flow, and Fal.ai.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Canvas:** React Flow
- **AI:** Fal.ai (image/video generation)
- **Database:** Supabase (PostgreSQL, auth, storage)
- **Deployment:** Vercel (auto-deploy on push to `main`)

## Quick Start

```bash
git clone <repo-url>
cd node-flow-mvp
npm install
cp .env.local.example .env.local  # Fill in FAL_KEY
```

**Get API keys:**
- `FAL_KEY`: [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys) (sign in with Google using accounts@workflow.design)
- `STRIPE_SECRET_KEY` + price IDs: [dashboard.stripe.com](https://dashboard.stripe.com) (ask Will or Saul for access to accounts@workflow.design)
- Supabase keys output from `supabase start` (local) or [supabase.com/dashboard](https://supabase.com/dashboard) (cloud)

**Start dev environment:**
```bash
supabase start          # Terminal 1: Database + storage
npm run dev             # Terminal 2: Next.js (localhost:3000)
```

**First time setup:**
```bash
brew install supabase/tap/supabase  # Install Supabase CLI (macOS)
supabase link --project-ref local   # Link to local instance
supabase db push                     # Apply migrations
```

## Environment Variables

Required in `.env.local`:

```env
FAL_KEY=your_fal_api_key

# Local development (from `supabase start` output)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key

# Production (from Supabase dashboard)
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_cloud_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (optional, for payments)
# STRIPE_SECRET_KEY=sk_test_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `supabase start` | Start local Supabase |
| `supabase stop` | Stop local Supabase |
| `supabase db push` | Apply migrations to linked DB |
| `supabase db reset` | Reset local DB (⚠️ destroys data) |
| `supabase link --project-ref <id>` | Link to Supabase project |

## Database Migrations

**Local:**
```bash
supabase link --project-ref local
supabase db push
```

**Production/Cloud:**
```bash
supabase link --project-ref <your-project-id>
supabase db push
```

**Create new migration:**
```bash
supabase migration new your_migration_name
# Edit file in supabase/migrations/
supabase db push
```

**Reset local DB:**
```bash
supabase db reset  # Drops everything, re-runs all migrations
```

⚠️ Never edit old migrations—create new ones. Files run in timestamp order.

## Deployment

**Vercel:**
- Push to `main` → auto-deploys to production
- Set env vars in Vercel dashboard (Project Settings → Environment Variables)
- Apply migrations to production: `supabase link --project-ref <prod-id>` then `supabase db push`

## Project Structure

```
├── app/
│   ├── page.tsx                      # Main canvas page
│   └── api/
│       ├── fal/                      # Fal.ai proxy routes
│       │   ├── flux-dev/route.ts     # Image generation
│       │   └── veo3-fast/route.ts    # Video generation
│       └── workflows/[id]/run/       # Headless workflow execution
│
├── components/
│   ├── Canvas.tsx                    # React Flow wrapper
│   └── nodes/                        # Node type components
│       ├── TextNode.tsx              # Text input with templates
│       ├── ImageNode.tsx             # Image upload
│       ├── VideoNode.tsx             # Video upload
│       ├── ListNode.tsx              # Batch input list
│       ├── FluxDevNode.tsx           # Flux image generation
│       ├── Veo3FastNode.tsx          # Veo3 video generation
│       └── OutputGalleryNode.tsx     # Batch output viewer
│
├── lib/
│   ├── workflow/                     # Headless execution engine
│   │   ├── runner.ts                 # Workflow orchestrator
│   │   ├── graphUtils.ts             # Graph utilities
│   │   └── executors/                # Node executors
│   ├── fal.ts                        # Fal.ai client
│   ├── supabase.ts                   # Supabase client
│   ├── templateParser.ts             # Template variable interpolation
│   └── uploadToSupabase.ts           # Media upload helper
│
├── hooks/
│   ├── useNodeInputs.ts              # Node input resolution
│   └── useBatchExecution.ts          # Batch processing
│
└── types/
    └── nodes.ts                      # Node type definitions
```

## Adding a New Model Node

The executor architecture shares logic between frontend and backend. To add a new model:

1. **Create executor** at `lib/workflow/executors/myModelExecutor.ts`:

```typescript
import type { NodeExecutor } from "./types";

export type MyModelGenerator = (prompt: string) => Promise<string>;

export function createMyModelExecutor(generate: MyModelGenerator): NodeExecutor {
  return {
    async execute(node, resolvedInputs, context) {
      // Batch handling, error handling logic here
      // Uses generate() for the actual API call
    },
  };
}

// Both generators MUST be defined together
export const myModelGenerators = {
  backend: async (prompt: string) => {
    // Direct Fal.ai call (fast)
  },
  frontend: async (prompt: string) => {
    // Via API route (browser-safe)
  },
};

export const myModelExecutor = createMyModelExecutor(myModelGenerators.backend);
```

2. **Add to registry** in `lib/workflow/executors/index.ts`

3. **Create API route** at `app/api/fal/my-model/route.ts`

4. **Create node component** at `components/nodes/MyModelNode.tsx`

5. **Add to sidebar** in `components/Sidebar.tsx`

## API Endpoints

### POST /api/workflows/[id]/run

Execute a workflow headlessly.

```bash
curl -X POST http://localhost:3000/api/workflows/test/run
```

Currently supports `test` workflow ID (mock workflow). Full Supabase integration coming soon.

## Documentation

- [PROJECT_SPEC.md](./PROJECT_SPEC.md) - Feature requirements and phases
- [DECISION_LOG.md](./DECISION_LOG.md) - Technical decisions and rationale
- [CLAUDE.md](./CLAUDE.md) - AI assistant instructions

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Failed to upload to Supabase" | `supabase start` or check cloud URL/key in `.env.local` |
| "No images generated" / Fal errors | Verify `FAL_KEY` at [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys) |
| "Migration failed" | Check syntax, try `supabase db reset` locally |
| Build fails on Vercel | Set env vars in Vercel dashboard, test `npm run build` locally |
