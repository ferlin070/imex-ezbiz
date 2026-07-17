-- ========== ALTER: loan_applications for Agentic AI Checker ==========
alter table loan_applications add column if not exists eligibility_status text check (eligibility_status in ('LULUS', 'TIDAK_LULUS', 'PERLU_TINDAKAN'));
alter table loan_applications add column if not exists eligibility_output jsonb;
alter table loan_applications add column if not exists ai_action_plan text;
alter table loan_applications add column if not exists was_blocked_by_guardrail boolean default false;
