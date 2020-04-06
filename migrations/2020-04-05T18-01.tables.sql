--tables (up)
create extension if not exists citext;
create extension if not exists pgcrypto;

create role authenticator with login password '' noinherit;
create role visitor noinherit;

revoke all on schema public from public;
grant all on schema public to postgres;

grant visitor TO authenticator;

create schema app_public;
create schema app_private;

create domain app_public.url as text check(value ~ '^https?://\S+$');
create domain app_public.tag as citext check(length(value) >= 2 and length(value) <= 60 and value ~ '^\\w+$');

-- create function app_private.hash(t text) return text as $$
-- begin
--   return crypt(t, gen_salt('bf'))
-- end;
-- $$ language plpgsql stable;

create table app_public.users (
  id uuid primary key default gen_random_uuid(),
  username citext not null unique check(length(username) >= 2 and length(username) <= 24 and username ~ '^[a-zA-Z]([a-zA-Z0-9][_]?)+$'),
  avatar_url app_public.url,
  about text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function app_private.tg__timestamps() returns trigger as $$
begin
  NEW.created_at = (case when TG_OP = 'INSERT' then NOW() else OLD.created_at end);
  NEW.updated_at = (case when TG_OP = 'UPDATE' and OLD.updated_at >= NOW() then OLD.updated_at + interval '1 millisecond' else NOW() end);
  return NEW;
end;
$$ language plpgsql volatile;

create trigger _100_timestamps
  before update on app_public.users
  for each row
  execute procedure app_private.tg__timestamps();

-- create table app_private.user_secrets (
--   user_id uuid not null primary key references app_public.users on delete cascade,
--   password_hash text,
--   last_login_at timestamptz not null default now(),
--   failed_password_attempts int not null default 0,
--   first_failed_password_attempt timestamptz,
-- );

-- create table app_private.sessions (
--   uuid uuid not null default gen_random_uuid() primary key,
--   user_id uuid not null,
--   -- You could add access restriction columns here if you want, e.g. for OAuth scopes.
--   created_at timestamptz not null default now(),
--   last_active timestamptz not null default now()
-- );

-- /**********/

-- create function app_public.current_session_id() returns uuid as $$
--   select nullif(pg_catalog.current_setting('jwt.claims.session_id', true), '')::uuid;
-- $$ language sql stable;
-- comment on function app_public.current_session_id() is
--   E'Handy method to get the current session ID.';

-- -- We've put this in public, but omitted it, because it's often useful for debugging auth issues.

-- /*
--  * A less secure but more performant version of this function would be just:
--  *
--  *  select nullif(pg_catalog.current_setting('jwt.claims.user_id', true), '')::uuid;
--  *
--  * The increased security of this implementation is because even if someone gets
--  * the ability to run SQL within this transaction they cannot impersonate
--  * another user without knowing their session_id (which should be closely
--  * guarded).
--  */

-- create function app_public.current_user_id() returns uuid as $$
--   select user_id from app_private.sessions where uuid = app_public.current_session_id();
-- $$ language sql stable security definer;
-- comment on function app_public.current_user_id() is
--   E'Handy method to get the current user ID for use in RLS policies, etc; in GraphQL, use `currentUser{id}` instead.';
-- -- We've put this in public, but omitted it, because it's often useful for debugging auth issues.

-- create function app_public.current_user() returns app_public.users as $$
--   select users.* from app_public.users where id = app_public.current_user_id();
-- $$ language sql stable;
-- comment on function app_public.current_user() is
--   E'The currently logged in user (or null if not logged in).';

-- create table app_private.connect_pg_simple_sessions (
--   sid text not null,
--   sess json not null,
--   expire timestamp not null
-- );
-- alter table app_private.connect_pg_simple_sessions enable row level security;
-- alter table app_private.connect_pg_simple_sessions
--   add constraint session_pkey primary key (sid) not deferrable initially immediate;

-- create function app_public.current_session_id() returns uuid as $$
--   select nullif(pg_catalog.current_setting('jwt.claims.session_id', true), '')::uuid;
-- $$ language sql stable;
-- comment on function app_public.current_session_id() is
--   E'Handy method to get the current session ID.';
-- -- We've put this in public, but omitted it, because it's often useful for debugging auth issues.

-- create function app_private.login(username citext, password text) returns app_private.sessions as $$
-- declare
--   v_user app_public.users;
--   v_user_secret app_private.user_secrets;
--   v_login_attempt_window_duration interval = interval '5 minutes';
--   v_session app_private.sessions;
-- begin
--   select users.* into v_user
--   from app_public.users
--   where users.username = login.username;

--   if v_user is null then
--     return null;
--   end if;

--   -- Load their secrets
--   select * into v_user_secret from app_private.user_secrets
--   where user_secrets.user_id = v_user.id;

--   -- Have there been too many login attempts?
--   if (v_user_secret.first_failed_password_attempt is not null
--     and v_user_secret.first_failed_password_attempt > NOW() - v_login_attempt_window_duration
--     and v_user_secret.failed_password_attempts >= 3
--   ) then raise exception 'User account locked - too many login attempts. Try again after 5 minutes.' using errcode = 'LOCKD';
--   end if;

--   -- Not too many login attempts, let's check the password.
--   -- NOTE: 'password_hash' could be null, this is fine since 'NULL = NULL' is null, and null is falsy.
--   if v_user_secret.password_hash = app_private.hash(password) then
--     -- Excellent - they're logged in! Let's reset the attempt tracking
--     update app_private.user_secrets
--     set failed_password_attempts = 0, first_failed_password_attempt = null, last_login_at = now()
--     where user_id = v_user.id;
--     -- Create a session for the user
--     insert into app_private.sessions (user_id) values (v_user.id) returning * into v_session;
--     -- And finally return the session
--     return v_session;
--   else
--     -- Wrong password, bump all the attempt tracking figures
--     update app_private.user_secrets
--     set
--       failed_password_attempts = (case when first_failed_password_attempt is null or first_failed_password_attempt < now() - v_login_attempt_window_duration then 1 else failed_password_attempts + 1 end),
--       first_failed_password_attempt = (case when first_failed_password_attempt is null or first_failed_password_attempt < now() - v_login_attempt_window_duration then now() else first_failed_password_attempt end)
--     where user_id = v_user.id;
--     return null; -- Must not throw otherwise transaction will be aborted and attempts won't be recorded
--   end if;
-- end;
-- $$ language plpgsql strict volatile security definer;

-- comment on function app_private.login(username citext, password text) is
--   E'Returns a user that matches the username/password combo, or null on failure.';

-- create function app_public.logout() returns void as $$
-- begin
--   -- Delete the session
--   delete from app_private.sessions where uuid = app_public.current_session_id();
--   -- Clear the identifier from the transaction
--   perform set_config('jwt.claims.session_id', '', true);
-- end;
-- $$ language plpgsql security definer volatile;

-- create function app_private.assert_valid_password(new_password text) returns void as $$
-- begin
--   -- TODO: add better assertions!
--   if length(new_password) < 8 then
--     raise exception 'Password is too weak' using errcode = 'WEAKP';
--   end if;
-- end;
-- $$ language plpgsql volatile;

-- create function app_public.change_password(old_password text, new_password text) returns boolean as $$
-- declare
--   v_user app_public.users;
--   v_user_secret app_private.user_secrets;
-- begin
--   select users.* into v_user
--     from app_public.users
--     where id = app_public.current_user_id();

--   if v_user is null then
--     raise exception 'You must log in to change your password' using errcode = 'LOGIN';
--   else

--   -- Load their secrets
--   select * into v_user_secret from app_private.user_secrets
--   where user_secrets.user_id = v_user.id;

--   if v_user_secret.password_hash = crypt(old_password, v_user_secret.password_hash) then
--     perform app_private.assert_valid_password(new_password);
--     -- Reset the password as requested
--     update app_private.user_secrets
--     set
--       password_hash = crypt(new_password, gen_salt('bf'))
--     where user_secrets.user_id = v_user.id;
--     perform graphile_worker.add_job(
--       'user__audit',
--       json_build_object(
--         'type', 'change_password',
--         'user_id', v_user.id,
--         'current_user_id', app_public.current_user_id()
--       ));
--     return true;
--   else
--     raise exception 'Incorrect password' using errcode = 'CREDS';
--   end if;
-- end;
-- $$ language plpgsql strict volatile security definer;

-- comment on function app_public.change_password(old_password text, new_password text) is
--   E'Enter your old password and a new password to change your password.';

-- /**********/

-- create function app_private.register_user(
--   f_json json,
-- ) returns app_public.users as $$
-- declare
--   v_user app_public.users;
--   v_username citext;
--   v_password text;
-- begin
--   v_username := f_json ->> 'username';

--   -- See if a user account already exists
--   select id
--     into v_matched_user_id
--     from app_public.users
--     where username = v_username
--     limit 1;

--   if v_matched_user_id then
--     raise exception 'This username is already taken' using errcode = 'TAKEN';
--   end if;

--   v_password := f_json ->> 'password';

--   perform app_private.assert_valid_password(v_password);

--   -- Insert the new user
--   insert into app_public.users (username) values
--     (v_username)
--     returning * into v_user;

--   -- Store the password
--   update app_private.user_secrets
--     set password_hash = app_private.hash(v_password)
--     where user_id = v_user.id;

--   return v_user;
-- end;
-- $$ language plpgsql volatile security definer;

-- alter table app_public.users enable row level security;
-- create policy select_all on app_public.users for select using (true);
-- create policy update_self on app_public.users for update using (id = app_public.current_user_id());
-- grant select on app_public.users to visitor;
-- grant update(username, about, avatar_url) on app_public.users to visitor;

-- alter table app_private.sessions enable row level security;
-- alter table app_private.sessions add constraint sessions_user_id_fkey foreign key ("user_id") references app_public.users on delete cascade;
-- create index on app_private.sessions (user_id);

create table app_public.desktops (
  id uuid primary key default gen_random_uuid(),
  -- user_id uuid not null default app_public.current_user_id() references app_public.users,
  description text,
  title text check (length(title) < 140),
  urls app_public.url[] not null,
  tags app_public.tag[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- alter table app_public.desktops enable row level security;
-- grant select on app_public.desktops to visitor;
-- grant insert on app_public.desktops to visitor;
-- grant update on app_public.desktops to visitor;
-- grant delete on app_public.desktops to visitor;
-- create policy select_desktops on app_public.desktops
--   for select using (user_id = app_public.current_user_id());
-- create policy insert_own_desktop on app_public.desktops
--   for insert with check (user_id = app_public.current_user_id());
-- create policy update_own_desktop on app_public.desktops
--   for update using (user_id = app_public.current_user_id());
-- create policy delete_own_desktop on app_public.desktops
--   for delete using (user_id = app_public.current_user_id());

create trigger _100_timestamps
  before update on app_public.desktops
  for each row
  execute procedure app_private.tg__timestamps();
