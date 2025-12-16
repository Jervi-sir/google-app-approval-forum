

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