-- Workflows table (stores the graph definition)
create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Untitled Workflow',
  description text,
  graph jsonb not null default '{"nodes": [], "edges": []}',
  default_inputs jsonb default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Workflow runs table (execution history)
create table public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references public.workflows(id) on delete cascade not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),
  triggered_by text not null default 'manual'
    check (triggered_by in ('manual', 'api', 'webhook', 'schedule')),
  inputs jsonb default '{}',
  outputs jsonb,
  node_states jsonb not null default '{}',
  error jsonb,
  triggered_at timestamptz default now() not null,
  completed_at timestamptz
);

-- Indexes
create index workflows_updated_at_idx on public.workflows(updated_at desc);
create index workflow_runs_workflow_id_idx on public.workflow_runs(workflow_id);
create index workflow_runs_status_idx on public.workflow_runs(status);
create index workflow_runs_triggered_at_idx on public.workflow_runs(triggered_at desc);

-- Auto-update timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger workflows_updated_at
  before update on public.workflows
  for each row execute function public.handle_updated_at();
