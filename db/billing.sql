-- Billing tables for the Neon Postgres database. Run once in the Neon console or with psql.
CREATE TABLE IF NOT EXISTS billing_customers (
  user_id text PRIMARY KEY,
  stripe_customer_id text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  subscription_id text PRIMARY KEY,
  user_id text NOT NULL,
  customer_id text NOT NULL,
  status text NOT NULL,
  price_id text,
  current_period_end timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_risk_events (
  event_id text PRIMARY KEY,
  type text NOT NULL,
  customer_id text,
  subscription_id text,
  charge_id text,
  received_at timestamptz NOT NULL DEFAULT now(),
  reviewed boolean NOT NULL DEFAULT false
);

-- Monthly usage counts per subscriber, used to enforce the plan allowance.
CREATE TABLE IF NOT EXISTS billing_usage (
  user_id text NOT NULL,
  period text NOT NULL,
  kind text NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, period, kind)
);
