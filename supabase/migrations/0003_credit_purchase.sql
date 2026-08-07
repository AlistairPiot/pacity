-- Optional V1 feature: members can top up credits beyond their monthly
-- allowance. Restricted to full_time members — Nomad stays blocked from
-- booking regardless of balance, per the plan-tier rule in the brief.

alter type transaction_type add value if not exists 'credit_purchase';
