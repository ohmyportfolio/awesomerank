CREATE TABLE IF NOT EXISTS responses (
  id BIGSERIAL PRIMARY KEY,
  timestamp TEXT NOT NULL,

  country TEXT,
  country_code TEXT,
  city TEXT,
  timezone_from_ip TEXT,

  app_id TEXT,
  quiz_version TEXT,
  question_set_id TEXT,
  score_algo_version TEXT,

  age_group TEXT,
  gender TEXT,

  question_ids TEXT,
  answers TEXT,
  question_times TEXT,
  answers_by_question_id TEXT,
  times_by_question_id TEXT,
  total_quiz_time INTEGER,

  score REAL,
  tier TEXT,
  yes_count INTEGER,

  session_duration INTEGER,
  selected_language TEXT,
  client_id TEXT,
  session_id TEXT,
  session_started_at TEXT,
  session_finished_at TEXT,
  completed INTEGER,

  landing_url TEXT,
  landing_path TEXT,
  document_referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  browser_language TEXT,
  languages TEXT,
  timezone TEXT,
  device_type TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  pixel_ratio REAL,
  platform TEXT,
  connection_type TEXT,

  user_agent TEXT,
  referer TEXT,

  app_payload TEXT,
  app_payload_valid INTEGER,
  app_payload_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_timestamp ON responses(timestamp);
CREATE INDEX IF NOT EXISTS idx_country ON responses(country);
CREATE INDEX IF NOT EXISTS idx_country_code ON responses(country_code);
CREATE INDEX IF NOT EXISTS idx_age_group ON responses(age_group);
CREATE INDEX IF NOT EXISTS idx_gender ON responses(gender);
CREATE INDEX IF NOT EXISTS idx_app_id ON responses(app_id);
CREATE INDEX IF NOT EXISTS idx_question_set_id ON responses(question_set_id);
CREATE INDEX IF NOT EXISTS idx_client_id ON responses(client_id);
CREATE INDEX IF NOT EXISTS idx_session_id ON responses(session_id);
