create table public.admin_emails (email text primary key);
alter table public.admin_emails enable row level security;
create policy "admin_emails: solo admin" on public.admin_emails for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.admin_emails (email) values ('marioimbett@gmail.com');

create or replace function public.promote_admin_on_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email is not null and exists (select 1 from public.admin_emails where email = lower(new.email)) then
    insert into public.admins (user_id, email) values (new.id, lower(new.email)) on conflict do nothing;
  end if;
  return new;
end $$;
revoke execute on function public.promote_admin_on_signup() from public, anon, authenticated;

create trigger promote_admin_on_signup
after insert or update of email on auth.users
for each row execute function public.promote_admin_on_signup();
