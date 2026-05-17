-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- Core tables
-- ============================================================

create table if not exists users (
    id uuid default uuid_generate_v4() primary key,
    email text unique not null,
    role text default 'COMPLAINANT',  -- COMPLAINANT | ADMIN | DEPT_HEAD
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists departments (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    email text not null,
    description text,
    auto_assign boolean default true,
    email_account_id uuid,  -- FK added after email_accounts table
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists tickets (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text not null,
    status text default 'PENDING_OTP',
    priority text,
    sentiment text,
    ai_confidence numeric,
    ai_reasoning text,                    -- AI's explanation for its routing decision
    routed_email text,                    -- Email address the ticket was dispatched to
    email_thread_id text,                 -- Unique thread ID for email reply tracking
    workflow_id uuid,                     -- Which workflow processed this ticket
    user_id uuid references users(id),
    department_id uuid references departments(id),
    is_duplicate_of uuid references tickets(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- AI Orchestrator tables
-- ============================================================

-- Stores reusable AI agent configurations (system prompts, model, temp)
create table if not exists agent_configs (
    id uuid default uuid_generate_v4() primary key,
    name text not null,                   -- e.g. "Classifier Agent"
    system_prompt text not null,
    model_provider text default 'gemini', -- 'gemini' | 'openai'
    model_name text default 'gemini-pro',
    temperature numeric default 0.0,
    api_key_ref text,                     -- env var name or encrypted key
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Stores SMTP credentials for outbound email per department
create table if not exists email_accounts (
    id uuid default uuid_generate_v4() primary key,
    label text not null,                  -- e.g. "IT Support Mailbox"
    email_address text not null,
    smtp_server text default 'smtp.gmail.com',
    smtp_port int default 587,
    smtp_username text not null,
    smtp_password text not null,          -- app password (encrypted at rest by Supabase)
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add FK now that email_accounts exists
alter table departments
    add constraint fk_dept_email_account
    foreign key (email_account_id) references email_accounts(id)
    on delete set null;

-- Visual workflow definitions (n8n-style graph as JSONB)
create table if not exists workflows (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text,
    is_active boolean default true,
    -- Full graph: { nodes: [...], edges: [...] }
    graph_data jsonb not null default '{"nodes":[],"edges":[]}',
    created_by uuid references users(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add FK for tickets → workflows
alter table tickets
    add constraint fk_ticket_workflow
    foreign key (workflow_id) references workflows(id)
    on delete set null;

-- Every action taken on a ticket (full audit trail)
create table if not exists ticket_activities (
    id uuid default uuid_generate_v4() primary key,
    ticket_id uuid references tickets(id) on delete cascade,
    activity_type text not null,          -- 'created' | 'ai_classified' | 'ai_prioritized' | 'email_sent' | 'email_reply' | 'status_change' | 'manual_route'
    actor text,                           -- email, 'AI Agent', 'System', 'Admin'
    details jsonb,                        -- flexible payload (e.g. { department: "IT", confidence: 0.92 })
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- Unique constraints for seed data ON CONFLICT
-- ============================================================

-- Allow upsert-style seeding
do $$ begin
    if not exists (select 1 from pg_constraint where conname = 'departments_name_key') then
        alter table departments add constraint departments_name_key unique (name);
    end if;
    if not exists (select 1 from pg_constraint where conname = 'agent_configs_name_key') then
        alter table agent_configs add constraint agent_configs_name_key unique (name);
    end if;
    if not exists (select 1 from pg_constraint where conname = 'workflows_name_key') then
        alter table workflows add constraint workflows_name_key unique (name);
    end if;
end $$;

-- Auto-update updated_at on ticket changes
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_tickets_updated_at on tickets;
create trigger set_tickets_updated_at
    before update on tickets
    for each row execute function update_updated_at_column();

-- ============================================================
-- Seed data
-- ============================================================

-- Default departments
insert into departments (name, email, description) values
('IT Support', 'it@example.com', 'Handles all technology, network, and hardware issues'),
('Maintenance', 'maintenance@example.com', 'Building upkeep, plumbing, electrical, HVAC'),
('Academics', 'academics@example.com', 'Course scheduling, faculty, academic policies'),
('General', 'general@example.com', 'Catch-all for uncategorized issues')
on conflict (name) do nothing;

-- Default AI Agent Configs
insert into agent_configs (name, system_prompt, model_provider, model_name, temperature) values
(
    'Classifier Agent',
    'You are a classification agent for a complaint/grievance system. Your job is to analyze the complaint and categorize it into the most appropriate department.

Available departments: IT Support, Maintenance, Academics, HR, General

Instructions:
- Read the complaint title and description carefully
- Determine which department is best suited to handle this issue
- Output ONLY the department name, nothing else
- If the complaint does not clearly fit any department, output "General"

Examples:
- "WiFi not working" → IT Support
- "Broken window in classroom" → Maintenance
- "Professor not available" → Academics',
    'gemini',
    'gemini-pro',
    0.0
),
(
    'Priority Agent',
    'You are a priority and sentiment assessment agent for a complaint system. Analyze the urgency and emotional tone of the complaint.

Instructions:
- Assess how urgent the issue is based on safety, impact, and time-sensitivity
- Determine the emotional sentiment of the complainant
- Output EXACTLY in this format: Priority: <LOW|MEDIUM|HIGH|URGENT> | Sentiment: <Positive|Neutral|Negative>

Guidelines:
- URGENT: Safety hazards, security threats, service outages affecting many people
- HIGH: Significant disruption but not dangerous, affecting multiple people
- MEDIUM: Moderate inconvenience, affecting few people
- LOW: Minor issue, cosmetic, or improvement suggestion',
    'gemini',
    'gemini-pro',
    0.0
),
(
    'Router Agent',
    'You are a routing decision agent. Based on the classification results, determine if this ticket should be automatically routed or needs manual review.

Input format: Department: <dept> | Priority: <priority> | Confidence: <0-1>

Rules:
- If confidence >= 0.8 and department is clear → output "ROUTE"
- If confidence < 0.8 or department is ambiguous → output "MANUAL_REVIEW"
- If priority is URGENT → always output "ROUTE" (urgent issues should never wait)

Output ONLY: ROUTE or MANUAL_REVIEW',
    'gemini',
    'gemini-pro',
    0.0
)
on conflict (name) do nothing;

-- Default Workflow
insert into workflows (name, description, is_active, graph_data) values
(
    'Default Complaint Pipeline',
    'Standard AI-powered complaint classification, prioritization, and email routing workflow',
    true,
    '{
        "nodes": [
            {
                "id": "input-1",
                "type": "input",
                "position": { "x": 250, "y": 0 },
                "data": { "label": "Complaint Input" }
            },
            {
                "id": "agent-classifier",
                "type": "aiAgent",
                "position": { "x": 250, "y": 150 },
                "data": {
                    "label": "Classifier Agent",
                    "agentConfigName": "Classifier Agent",
                    "outputField": "department"
                }
            },
            {
                "id": "agent-priority",
                "type": "aiAgent",
                "position": { "x": 250, "y": 300 },
                "data": {
                    "label": "Priority Agent",
                    "agentConfigName": "Priority Agent",
                    "outputField": "priority"
                }
            },
            {
                "id": "condition-1",
                "type": "condition",
                "position": { "x": 250, "y": 450 },
                "data": {
                    "label": "Route Decision",
                    "field": "confidence",
                    "operator": ">=",
                    "value": "0.8",
                    "trueLabel": "Auto Route",
                    "falseLabel": "Manual Review"
                }
            },
            {
                "id": "email-auto",
                "type": "email",
                "position": { "x": 100, "y": 620 },
                "data": {
                    "label": "Send to Department",
                    "emailTarget": "department",
                    "subject": "New Ticket: {{title}}",
                    "bodyTemplate": "A new complaint has been automatically routed to your department.\n\nTicket: {{ticket_id}}\nTitle: {{title}}\nPriority: {{priority}}\nCategory: {{department}}\n\nDescription:\n{{description}}\n\nAI Confidence: {{confidence}}%\n\nReply to this email to update the ticket."
                }
            },
            {
                "id": "email-review",
                "type": "email",
                "position": { "x": 400, "y": 620 },
                "data": {
                    "label": "Send to Admin Review",
                    "emailTarget": "admin",
                    "subject": "⚠ Review Needed: {{title}}",
                    "bodyTemplate": "A complaint requires manual review. The AI was not confident enough to auto-route.\n\nTicket: {{ticket_id}}\nTitle: {{title}}\nPriority: {{priority}}\nSuggested Category: {{department}}\n\nDescription:\n{{description}}\n\nAI Confidence: {{confidence}}%\nReason: Low confidence or ambiguous classification.\n\nPlease review and route manually via the admin dashboard."
                }
            }
        ],
        "edges": [
            { "id": "e1", "source": "input-1", "target": "agent-classifier" },
            { "id": "e2", "source": "agent-classifier", "target": "agent-priority" },
            { "id": "e3", "source": "agent-priority", "target": "condition-1" },
            { "id": "e4", "source": "condition-1", "target": "email-auto", "sourceHandle": "true" },
            { "id": "e5", "source": "condition-1", "target": "email-review", "sourceHandle": "false" }
        ]
    }'::jsonb
)
on conflict (name) do nothing;
