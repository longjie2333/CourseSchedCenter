-- 公告：固定单行，id=1
CREATE TABLE IF NOT EXISTS notices (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  dialog_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 用户反馈与回复状态
CREATE TABLE IF NOT EXISTS feedbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  openid TEXT NOT NULL,
  config TEXT NOT NULL DEFAULT '',
  contact TEXT,
  content TEXT NOT NULL,
  files_json TEXT NOT NULL DEFAULT '[]',

  reply_status TEXT NOT NULL DEFAULT 'pending',
  reply_content TEXT,
  reply_attempted_at TEXT,
  replied_at TEXT,
  reply_error TEXT,
  wechat_result_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at
ON feedbacks(created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_feedbacks_reply_status
ON feedbacks(reply_status, created_at DESC);

-- TOTP 防重放状态
CREATE TABLE IF NOT EXISTS auth_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_totp_counter INTEGER NOT NULL
);

INSERT INTO auth_state (id, last_totp_counter)
VALUES (1, -1)
ON CONFLICT(id) DO NOTHING;
