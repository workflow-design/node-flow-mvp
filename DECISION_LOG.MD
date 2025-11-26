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

### 2025-11-26 — Phase 3: File Upload via Object URLs

**Decision:** Use browser object URLs (blob URLs) for local file uploads in Image and Video nodes.

**Context:** Phase 3 requires Image and Video nodes to accept file uploads.

**Options Considered:**
1. Cloud upload (S3, Cloudinary) — Persistent but adds complexity and cost
2. Object URLs — Simple, works in-browser, no backend needed

**Rationale:**
- Simplest solution for MVP
- No additional infrastructure or API keys needed
- Files are available immediately after selection
- Abstraction layer allows easy swap to cloud storage later

**Consequences:** Object URLs don't persist across page refreshes. When saving to localStorage, local file values are cleared. This is acceptable for MVP.

---

### 2025-11-26 — Phase 3: localStorage Persistence

**Decision:** Add workflow persistence via localStorage with 500ms debounced saves.

**Context:** Users expect their work to persist across page refreshes.

**Options Considered:**
1. No persistence — Simplest but poor UX
2. localStorage — Simple, no backend needed
3. Database — Overkill for MVP

**Rationale:**
- Improves UX significantly with minimal implementation
- 500ms debounce prevents excessive writes during rapid changes
- Abstraction layer (WorkflowStorage interface) allows easy swap to database later

**Consequences:** Object URLs for local files won't persist (cleared on save), but node positions, edges, and text values will persist.

---

### 2025-11-26 — Phase 3: Shared DropZone Component

**Decision:** Create a reusable DropZone component for Image and Video nodes.

**Context:** Both Image and Video nodes need file upload functionality.

**Rationale:**
- DRY principle — avoids duplicating drag-drop logic
- Consistent UX across media nodes
- Single place to add features (file size warnings, error handling)

**Consequences:** Small abstraction added, but justified by code reuse.

---

### 2025-11-26 — Phase 3: Abstraction Layers

**Decision:** Create FileUploader and WorkflowStorage interfaces with swappable implementations.

**Context:** MVP uses simple implementations (object URLs, localStorage) but may need cloud services later.

**Rationale:**
- Single export point makes swapping implementations trivial
- Interface contracts are minimal and focused
- Small upfront cost for significant future flexibility

**Consequences:** Slightly more files and indirection, but enables easy migration to cloud storage/upload.

---

### 2025-11-26 — Horizontal Node Handle Layout

**Decision:** Use horizontal handle positioning (outputs on right, inputs on left) instead of vertical (outputs on bottom, inputs on top).

**Context:** Needed to establish consistent handle placement convention for workflow nodes.

**Options Considered:**
1. Vertical layout (top/bottom) — Common in some tools but flows read top-to-bottom
2. Horizontal layout (left/right) — Matches left-to-right reading direction

**Rationale:**
- Left-to-right flow matches natural reading direction for western users
- Aligns with workflow tools like Runway, ComfyUI, and other node-based editors
- Model nodes (Phase 4) will have inputs on left, outputs on right — creates clear data flow direction

**Consequences:** All existing and future nodes must follow this convention. Source nodes (Text, Image, Video) only have right outputs; model nodes will have both left inputs and right outputs.

---

### 2025-11-26 — IndexedDB for File Blob Persistence

**Decision:** Use IndexedDB to persist file blobs, with blob URLs regenerated on page load.

**Context:** Users expected uploaded images/videos to persist across page refresh, but blob URLs are temporary and don't survive refresh.

**Options Considered:**
1. Base64 encoding in localStorage — Works but has size limits (~5MB), poor performance for large files
2. Cloud storage (S3, etc.) — Persistent but adds backend complexity, cost, and latency
3. IndexedDB — Large storage quota, good performance for binary data, no backend needed

**Rationale:**
- IndexedDB has much larger storage limits than localStorage
- Better performance for binary data vs base64 encoding
- Keeps the MVP purely client-side with no cloud infrastructure
- Follows existing abstraction pattern (fileStorage layer matches fileUpload/storage layers)

**Consequences:**
- Files persist across page refresh
- Node data types gain `fileId` field to reference IndexedDB entries
- Blob URLs are regenerated on load (brief loading state shown)
- Cleanup logic needed when nodes are deleted or files replaced

---

### 2025-11-26 — Preview Deployments Over Production Protection

**Decision:** Use Vercel preview deployments instead of deploying to production with password protection.

**Context:** Need to protect Fal.ai API credits during MVP development.

**Options Considered:**
1. Password gate + rate limiting — Adds code complexity
2. Preview deployments only — Simpler, URLs are less discoverable

**Rationale:**
- Preview deployment URLs are random and less discoverable
- Single user (just me) for MVP, no need for shared access
- Less code to maintain
- Can add proper auth later when needed

**Consequences:** Main production domain won't have the app deployed. Access via preview URLs only.

**Vercel Configuration:**
- Settings → Git → Ignored Build Step
- Set to "Custom" with command: `[ "$VERCEL_GIT_COMMIT_REF" != "main" ]`
- Skips builds on main branch, allows preview deployments on feature branches

---

### 2025-11-26 — Phase 4: Fal.ai Model Nodes Architecture

**Decision:** Implement model nodes with extensible architecture: one node type per model, shared ModelNodeShell component, server-side API routes for Fal.ai calls.

**Context:** Phase 4 adds AI model nodes (Flux for images, Veo for videos) that call Fal.ai APIs.

**Key Choices:**
1. **Fal.ai Client:** Use `@fal-ai/client` (new package) instead of deprecated `@fal-ai/serverless-client`
2. **Flux Model:** `fal-ai/flux/dev` — 12B parameter model, good quality/speed balance
3. **Veo Model:** `fal-ai/veo3/fast` for text-to-video, `fal-ai/veo3/fast/image-to-video` when image input provided
4. **Extensible Architecture:** One node component per model with shared ModelNodeShell wrapper
5. **API Pattern:** Server-side Next.js API routes proxy Fal.ai calls to keep API key secure

**Rationale:**
- One node per model gives users explicit control over which model they use
- ModelNodeShell extracts common UI (status indicator, run button, handles) for consistency
- Server-side API routes keep FAL_KEY secure (never exposed to client)
- Adding new models requires: new node type, new API route, new node component

**Consequences:**
- 7 new files created for the model node system
- Sidebar reorganized into "Data" and "Models" sections
- Model node outputs can connect to downstream nodes via output handle

---

### 2025-11-26 — Phase 5: Batch Execution Architecture

**Decision:** Implement batch processing with ListNode for inputs, OutputGalleryNode for outputs, sequential execution, and "Run All" button on model nodes.

**Context:** Phase 5 adds batch processing to generate multiple outputs from a list of inputs.

**Key Choices:**

1. **Sequential Execution:** Run items one at a time instead of in parallel
   - Rationale: Prevents Fal.ai rate limit issues
   - Consequence: Slower but more reliable execution

2. **Run All Button Location:** On the model node (Flux/Veo), not on ListNode or GalleryNode
   - Rationale: Model node already has Run button; changing to "Run All (N items)" when list connected is intuitive
   - Consequence: Model nodes need to detect list inputs

3. **Max Items Limit:** 10 items maximum per list
   - Rationale: Prevents runaway API costs during MVP
   - Consequence: Users must batch larger sets manually

4. **Video Thumbnails:** Extract first frame using canvas API
   - Rationale: Better UX than placeholder icons
   - Consequence: Small performance cost on batch completion

5. **Cancel Button:** Replaces "Run All" during batch execution
   - Rationale: Clear, direct cancellation UX
   - Consequence: Keeps completed results when cancelled

6. **Zip Library:** JSZip + file-saver for download all
   - Rationale: Well-maintained, browser-native, no backend needed
   - Consequence: Added ~100KB to bundle size

**Files Added:**
- `components/nodes/ListNode.tsx`
- `components/nodes/OutputGalleryNode.tsx`
- `hooks/useBatchExecution.ts`
- `lib/downloadZip.ts`
- `lib/videoThumbnail.ts`

**Consequences:**
- Sidebar now has three sections: Data, Models, Output
- Model nodes detect list connections via enhanced useNodeInputs hook
- Gallery node shows progress and allows download of all outputs

---

<!-- Add new decisions above this line -->