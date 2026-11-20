-- Consent and account deletion for field officer profiles.
-- Added after the capstone defense, during the ethics audit for the ethics summative.

-- Record which privacy policy version an officer accepted and when, so there is
-- evidence that consent came before any personal data was stored.
alter table public.profiles
  add column consented_at timestamptz,
  add column privacy_policy_version text;

-- Replaces the 0001 trigger function. Consent is enforced here, not only in the
-- browser: a sign-up request sent straight to the Supabase API without a policy
-- version is rejected, and no auth user or profile is created.
-- consented_at uses the database clock so the browser cannot back-date consent.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data->>'privacy_policy_version', '') = '' then
    raise exception 'Sign-up requires accepting the privacy policy';
  end if;

  insert into public.profiles
    (id, full_name, cooperative, districts, consented_at, privacy_policy_version)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'cooperative',
    coalesce(
      (select array_agg(value)
         from jsonb_array_elements_text(new.raw_user_meta_data->'districts')),
      '{}'
    ),
    now(),
    new.raw_user_meta_data->>'privacy_policy_version'
  );
  return new;
end;
$$;

-- Lets an officer erase their own account. It runs as the definer because signed-in
-- users have no direct access to auth.users. auth.uid() limits it to the caller's
-- own row, and the profile row is removed by the ON DELETE CASCADE from 0001.
create function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
