-- Mi Dinero · una fila por usuario con todo su estado (privada gracias a RLS)
-- Pegar completo en Supabase → SQL Editor → New query → Run

create table if not exists finanzas_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table finanzas_state enable row level security;

-- Solo la dueña de la fila puede verla, crearla, editarla o borrarla.
create policy "leer propio"   on finanzas_state for select using (auth.uid() = user_id);
create policy "crear propio"  on finanzas_state for insert with check (auth.uid() = user_id);
create policy "editar propio" on finanzas_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "borrar propio" on finanzas_state for delete using (auth.uid() = user_id);
