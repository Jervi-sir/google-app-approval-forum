

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