-- Applore AI SDR — Supabase Schema
-- Run this once in your Supabase SQL editor

create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  website text,
  sector text,
  country text,
  employee_count text,
  funding_stage text,
  trigger_signal text,
  decision_maker_title text,
  decision_maker_name text,
  linkedin_url text,
  linkedin_search_query text,
  company_brief text,
  status text default 'researching', -- researching | scripted | pushed_to_instantly | linkedin_pending | replied | meeting_booked | dead
  instantly_contact_id text,
  instantly_campaign_id text,
  email_opens integer default 0,
  email_clicks integer default 0,
  replied boolean default false,
  reply_sentiment text, -- positive | negative | neutral
  is_hot boolean default false,
  meeting_booked boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists scripts (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete cascade,
  email_1 text,
  email_2 text,
  email_3 text,
  linkedin_connection_note text,
  linkedin_dm_1 text,
  linkedin_dm_2 text,
  linkedin_dm_3 text,
  created_at timestamptz default now()
);

create table if not exists scheduler_log (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz default now(),
  leads_discovered integer default 0,
  leads_researched integer default 0,
  leads_scripted integer default 0,
  leads_pushed_to_instantly integer default 0,
  errors text,
  status text default 'running' -- running | completed | failed
);

create table if not exists settings (
  id integer primary key default 1,
  sectors text[] default array['HealthTech', 'FinTech'],
  countries text[] default array['UK', 'Germany', 'Netherlands', 'Sweden', 'France', 'Spain'],
  employee_min integer default 50,
  employee_max integer default 75,
  daily_lead_target integer default 10,
  cron_hour_ist integer default 7,
  cron_minute_ist integer default 0,
  instantly_api_key text,
  instantly_campaign_id text,
  vibe_api_key text,
  updated_at timestamptz default now()
);

-- Insert default settings row
insert into settings (id) values (1) on conflict (id) do nothing;

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger prospects_updated_at before update on prospects
  for each row execute function update_updated_at();
