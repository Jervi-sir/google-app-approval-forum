### supabase oauth url redirect

Go to Supabase. Navigate to Authentication > URL Configuration
Put the real url


### supabase storage policies

create policy "public can read google_play"
on storage.objects
for select
to public
using (bucket_id = 'google_play');

create policy "authenticated can delete google_play"
on storage.objects
for delete
to authenticated
using (bucket_id = 'google_play');

## Supabase rules

```
create policy "authenticated can delete google_play"
on storage.objects
for delete
to authenticated
using (bucket_id = 'google_play');
```


```
create policy "allow authenticated uploads to google_play"
on storage.objects for insert
to authenticated
with check (bucket_id = 'google_play');
```

```
alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (id = auth.uid());
```

### auto create profile

```
-- 1) function that inserts a profile row for every new auth user
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, name, email, avatar_url, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 2) trigger (fires only on first creation of the auth user)
drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();
```

```
alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);
```