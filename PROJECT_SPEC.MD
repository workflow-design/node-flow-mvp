# PROJECT_SPEC.md

# Workflow Canvas MVP — Technical Specification

## Overview

A Next.js app with a React Flow canvas where users can:
1. Create nodes representing data types (Text, Image, Video)
2. Connect them to AI model nodes (Fal.ai endpoints)
3. Run the workflow and see outputs flow through

---

## Phases

### Phase 1: Scaffold & Deploy

**Deliverable:** Empty Next.js app running on Vercel

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Deployed to Vercel

**Acceptance Criteria:**
- [ ] Can visit deployed URL
- [ ] See a basic page load

---

### Phase 2: React Flow Canvas

**Deliverable:** A canvas where I can add nodes and connect them

- React Flow installed and rendering
- Can add nodes to canvas
- Can draw edges between nodes
- Basic controls (zoom, pan, delete)

**Acceptance Criteria:**
- [ ] Canvas renders full-screen
- [ ] Can add nodes via UI (button or right-click menu)
- [ ] Can drag nodes around
- [ ] Can connect nodes with edges
- [ ] Can delete nodes and edges

---

### Phase 3: Base Data Nodes

**Deliverable:** Three node types representing core data types

| Node | Purpose | UI |
|------|---------|-----|
| `Text` | Holds a string value | Text input field |
| `Image` | Holds an image URL | URL input + thumbnail preview |
| `Video` | Holds a video URL | URL input + video preview |

Each node has:
- One output handle (the data it holds)
- Editable content
- Visual preview where applicable

**Acceptance Criteria:**
- [ ] Can create a Text node and type in it
- [ ] Can create an Image node, paste URL, see preview
- [ ] Can create a Video node, paste URL, see preview
- [ ] Nodes have output handles that can connect to other nodes

---

### Phase 4: Fal.ai Model Nodes

**Deliverable:** Nodes that wrap Fal.ai API calls

| Node | Fal Model | Inputs | Output |
|------|-----------|--------|--------|
| `Flux Image` | `fal-ai/flux/dev` | Text (prompt) | Image |
| `Veo 3.1 Video` | TBD | Text (prompt), Image (optional) | Video |

Each model node has:
- Input handles matching required inputs
- "Run" button
- Loading state while processing
- Output handle with result
- Error state if call fails

**Acceptance Criteria:**
- [ ] Can connect Text node → Flux Image node
- [ ] Click "Run" on Flux node, see loading state
- [ ] Generated image appears in node and output handle
- [ ] Can connect Image output → Video model input
- [ ] Can run video generation and see result

---

## Technical Details

### Node Data Model
```typescript
type BaseNodeData = {
  label: string
  value?: string | null
}

type ModelNodeData = {
  label: string
  status: 'idle' | 'running' | 'complete' | 'error'
  output?: string | null
  error?: string | null
}
```

### Execution Flow

1. User clicks "Run" on a model node
2. Node traverses incoming edges to collect input values
3. Calls Next.js API route `/api/fal/[model]`
4. API route calls Fal.ai, waits for result
5. Returns result to frontend
6. Node updates with output, makes it available to downstream nodes

### API Route Pattern
```typescript
// /app/api/fal/flux/route.ts
export async function POST(req: Request) {
  const { prompt } = await req.json()
  
  const result = await fal.subscribe("fal-ai/flux/dev", {
    input: { prompt }
  })
  
  return Response.json({ 
    image_url: result.images[0].url 
  })
}
```

---

## File Structure
```
/app
  /page.tsx                    # Canvas page
  /api/fal/
    /flux/route.ts             # Flux image generation
    /veo/route.ts              # Veo video generation

/components
  /Canvas.tsx                  # React Flow setup
  /nodes/
    /TextNode.tsx
    /ImageNode.tsx  
    /VideoNode.tsx
    /FluxImageNode.tsx
    /VeoVideoNode.tsx
  /ui/
    /NodeShell.tsx             # Shared node wrapper (optional)

/lib
  /fal.ts                      # Fal.ai client config

/types
  /nodes.ts                    # Type definitions
```

---

## Out of Scope

- Saving/loading workflows
- Database integration
- Authentication
- Spreadsheet integration (Airtable, Google Sheets)
- Batch execution (multiple rows)
- Meta Ads export
- Undo/redo

---

## Environment Variables
```
FAL_KEY=           # Fal.ai API key (server-side only)
```

---

## Dependencies
```json
{
  "@fal-ai/serverless-client": "^latest",
  "reactflow": "^11.x",
  "next": "^14.x",
  "react": "^18.x",
  "tailwindcss": "^3.x",
  "typescript": "^5.x"
}
```