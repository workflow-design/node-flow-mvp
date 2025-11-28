-- Add user_id column to workflows table (nullable first)
alter table public.workflows
  add column user_id uuid references auth.users(id) on delete cascade;

-- Backfill existing workflows with the first user (or create a system user)
-- Option 1: Assign to first user
update public.workflows
set user_id = (select id from auth.users limit 1)
where user_id is null;

-- Option 2: If you want to delete orphaned workflows instead, uncomment this:
-- delete from public.workflows where user_id is null;

-- Now make user_id required
alter table public.workflows
  alter column user_id set not null;

-- Add index for user_id lookups
create index workflows_user_id_idx on public.workflows(user_id);

-- Enable Row Level Security
alter table public.workflows enable row level security;
alter table public.workflow_runs enable row level security;

-- Workflows RLS Policies
-- Users can only see their own workflows
create policy "Users can view their own workflows"
  on public.workflows
  for select
  using (auth.uid() = user_id);

-- Users can only insert workflows for themselves
create policy "Users can create their own workflows"
  on public.workflows
  for insert
  with check (auth.uid() = user_id);

-- Users can only update their own workflows
create policy "Users can update their own workflows"
  on public.workflows
  for update
  using (auth.uid() = user_id);

-- Users can only delete their own workflows
create policy "Users can delete their own workflows"
  on public.workflows
  for delete
  using (auth.uid() = user_id);

-- Workflow Runs RLS Policies (based on workflow ownership)
-- Users can only see runs for their own workflows
create policy "Users can view runs for their own workflows"
  on public.workflow_runs
  for select
  using (
    exists (
      select 1 from public.workflows
      where workflows.id = workflow_runs.workflow_id
      and workflows.user_id = auth.uid()
    )
  );

-- Users can only create runs for their own workflows
create policy "Users can create runs for their own workflows"
  on public.workflow_runs
  for insert
  with check (
    exists (
      select 1 from public.workflows
      where workflows.id = workflow_runs.workflow_id
      and workflows.user_id = auth.uid()
    )
  );

-- Users can only update runs for their own workflows
create policy "Users can update runs for their own workflows"
  on public.workflow_runs
  for update
  using (
    exists (
      select 1 from public.workflows
      where workflows.id = workflow_runs.workflow_id
      and workflows.user_id = auth.uid()
    )
  );

-- Users can only delete runs for their own workflows
create policy "Users can delete runs for their own workflows"
  on public.workflow_runs
  for delete
  using (
    exists (
      select 1 from public.workflows
      where workflows.id = workflow_runs.workflow_id
      and workflows.user_id = auth.uid()
    )
  );
