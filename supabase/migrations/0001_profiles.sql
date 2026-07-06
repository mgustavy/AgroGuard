-- AgroGuard field officer profiles.
-- One row per Supabase auth user, created automatically on sign-up.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  cooperative text,
  districts text[] default '{}',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Owners can read their profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Owners can update their profile"
  on public.profiles for update using (auth.uid() = id);

-- Copy the sign-up metadata (full_name, cooperative, districts) into profiles
-- whenever a new auth user is created.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, cooperative, districts)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'cooperative',
    coalesce(
      (select array_agg(value)
         from jsonb_array_elements_text(new.raw_user_meta_data->'districts')),
      '{}'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
