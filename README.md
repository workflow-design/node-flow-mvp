# Node Flow MVP

A workflow canvas tool built with Next.js and React Flow that allows users to create AI-powered creative workflows using Fal.ai.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Canvas:** React Flow
- **AI Backend:** Fal.ai
- **Storage:** Supabase (media files)
- **Deployment:** Vercel

## Prerequisites

- Node.js 20+
- npm
- A [Fal.ai](https://fal.ai) account (for AI model access)
- Either:
  - [Supabase CLI](https://supabase.com/docs/guides/cli) for local development, OR
  - A [Supabase](https://supabase.com) cloud project

## Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd node-flow-mvp
npm install
```

### 2. Environment Variables

Copy the example env file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Fal.ai API Key (required)
# Get from: https://fal.ai/dashboard/keys
FAL_KEY=your_fal_api_key

# Supabase (required for media storage)
# Option A: Local Supabase (see step 3a)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key

# Option B: Cloud Supabase (see step 3b)
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_cloud_anon_key
```

### 3a. Supabase Setup (Local)

Install Supabase CLI:

```bash
# macOS
brew install supabase/tap/supabase

# Windows/Linux - see https://supabase.com/docs/guides/cli
```

Start local Supabase:

```bash
supabase start
```

This will output your local credentials. Copy the `anon key` and `API URL` to your `.env`.

Create the storage bucket:

```bash
# The bucket should be created automatically via migrations
# If not, create manually in Supabase Studio at http://127.0.0.1:54323
```

### 3b. Supabase Setup (Cloud)

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Go to **Storage** and create a bucket:
   - Name: `media`
   - Public: **Yes** (toggle on)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

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

### "Failed to upload to Supabase: fetch failed"

Supabase is not running or not reachable. If using local Supabase:

```bash
supabase start
```

If using cloud Supabase, verify your URL and key in `.env`.

### "No images generated" / Fal.ai errors

Check your `FAL_KEY` is valid at [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys).
