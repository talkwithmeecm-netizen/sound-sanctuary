-- create a table for user profiles
create table public.profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null unique,
    display_name text,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

-- enable row level security on profiles
alter table public.profiles enable row level security;

-- create policies for profiles
create policy "users can view their own profile"
on public.profiles
for select
using (auth.uid() = user_id);

create policy "users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = user_id);

create policy "users can update their own profile"
on public.profiles
for update
using (auth.uid() = user_id);

-- create enum for sound categories
create type public.sound_category as enum ('alarming', 'background', 'safe');

-- create a table for notification history
create table public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    sound_label text not null,
    category sound_category not null,
    confidence float not null,
    detected_at timestamp with time zone not null default now()
);

-- enable row level security on notifications
alter table public.notifications enable row level security;

-- create policies for notifications
create policy "users can view their own notifications"
on public.notifications
for select
using (auth.uid() = user_id);

create policy "users can insert their own notifications"
on public.notifications
for insert
with check (auth.uid() = user_id);

create policy "users can delete their own notifications"
on public.notifications
for delete
using (auth.uid() = user_id);

-- create a table for user settings
create table public.user_settings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null unique,
    text_size float not null default 1.0,
    button_size float not null default 1.0,
    icon_size float not null default 1.0,
    theme text not null default 'dark',
    haptic_enabled boolean not null default true,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

-- enable row level security on user_settings
alter table public.user_settings enable row level security;

-- create policies for user_settings
create policy "users can view their own settings"
on public.user_settings
for select
using (auth.uid() = user_id);

create policy "users can insert their own settings"
on public.user_settings
for insert
with check (auth.uid() = user_id);

create policy "users can update their own settings"
on public.user_settings
for update
using (auth.uid() = user_id);

-- create function to update timestamps
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql set search_path = public;

-- create triggers for automatic timestamp updates
create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

create trigger update_user_settings_updated_at
before update on public.user_settings
for each row
execute function public.update_updated_at_column();

-- create function to auto-create profile and settings on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (user_id)
    values (new.id);
    
    insert into public.user_settings (user_id)
    values (new.id);
    
    return new;
end;
$$ language plpgsql security definer set search_path = public;

-- create trigger to auto-create profile and settings
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();