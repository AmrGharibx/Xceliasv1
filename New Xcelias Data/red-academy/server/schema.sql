PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS companies (
 id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE,
 source_id TEXT, source_meta TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(source_meta)),
 version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS batches (
 id TEXT PRIMARY KEY, batch_name TEXT NOT NULL,
 status TEXT CHECK(status IN ('Planning','Active','Completed')),
 start_date TEXT, end_date TEXT CHECK(end_date>=start_date),
 session_dates TEXT NOT NULL CHECK(json_valid(session_dates) AND json_array_length(session_dates)<=366),
 capacity INTEGER CHECK(capacity BETWEEN 1 AND 1000), description TEXT NOT NULL DEFAULT '',
 archived_at TEXT, archived_by TEXT,
 source_id TEXT, source_meta TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(source_meta)),
 version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS trainees (
 id TEXT PRIMARY KEY, trainee_name TEXT NOT NULL, company_id TEXT REFERENCES companies(id) ON DELETE RESTRICT,
 batch_id TEXT REFERENCES batches(id) ON DELETE CASCADE, email TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',
 job_title TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', enrollment_status TEXT NOT NULL DEFAULT 'Active' CHECK(enrollment_status IN ('Active','Stopped Attending')),
 source_id TEXT, source_meta TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(source_meta)),
 version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(id,batch_id)
);
-- Portraits remain private server-side assets and are deliberately excluded from /api/state.
CREATE TABLE IF NOT EXISTS trainee_photos (
 trainee_id TEXT PRIMARY KEY REFERENCES trainees(id) ON DELETE CASCADE,
 mime_type TEXT NOT NULL CHECK(mime_type IN ('image/jpeg','image/png','image/webp')),
 bytes BLOB NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS daily_attendance (
 id TEXT PRIMARY KEY, trainee_id TEXT, batch_id TEXT REFERENCES batches(id) ON DELETE CASCADE, date TEXT,
 arrival_time TEXT, departure_time TEXT,
 status TEXT CHECK(status IN ('Present','Absent','Tour Day','Off Day')),
 is_late INTEGER NOT NULL DEFAULT 0 CHECK(is_late IN (0,1)), assessment_day INTEGER NOT NULL DEFAULT 0 CHECK(assessment_day IN (0,1)),
 absence_reason TEXT NOT NULL DEFAULT '', analytics_included INTEGER NOT NULL DEFAULT 1 CHECK(analytics_included IN (0,1)),
 source_id TEXT, source_meta TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(source_meta)),
 version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 FOREIGN KEY(trainee_id,batch_id) REFERENCES trainees(id,batch_id) ON DELETE CASCADE,
 CHECK(source_id IS NOT NULL OR departure_time IS NULL OR (arrival_time IS NOT NULL AND departure_time>=arrival_time)),
 CHECK(source_id IS NOT NULL OR status NOT IN ('Absent','Off Day') OR (arrival_time IS NULL AND departure_time IS NULL AND is_late=0)),
 CHECK(assessment_day=0 OR status='Present')
);
CREATE TABLE IF NOT EXISTS attendance_10day (
 id TEXT PRIMARY KEY, trainee_id TEXT,batch_id TEXT REFERENCES batches(id) ON DELETE CASCADE,
 period_start TEXT, period_end TEXT CHECK(period_end>=period_start),
 days TEXT NOT NULL CHECK(json_valid(days) AND json_array_length(days)=10), report TEXT NOT NULL DEFAULT '',
 report_kind TEXT NOT NULL DEFAULT 'template' CHECK(report_kind IN ('template','ai','notion')),
 source_id TEXT, source_meta TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(source_meta)),
 version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 FOREIGN KEY(trainee_id,batch_id) REFERENCES trainees(id,batch_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS assessments (
 id TEXT PRIMARY KEY, trainee_id TEXT,batch_id TEXT REFERENCES batches(id) ON DELETE CASCADE,
 assessment_title TEXT NOT NULL,
 recorded_attendance INTEGER CHECK(recorded_attendance>=0), recorded_absence INTEGER CHECK(recorded_absence>=0),
 company_id TEXT REFERENCES companies(id) ON DELETE RESTRICT, analytics_included INTEGER NOT NULL DEFAULT 1 CHECK(analytics_included IN (0,1)), mapping REAL CHECK(mapping>=0 AND mapping<=5),
 product_knowledge REAL CHECK(product_knowledge>=0 AND product_knowledge<=5),
 presentability REAL CHECK(presentability>=0 AND presentability<=5),
 soft_skills REAL CHECK(soft_skills>=0 AND soft_skills<=5),
 assessment_outcome TEXT CHECK(assessment_outcome IN ('Failed','Needs Improvement','Good','Very Good','Excellent','Aced')),
 instructor_comment TEXT NOT NULL DEFAULT '', report TEXT NOT NULL DEFAULT '', report_kind TEXT NOT NULL DEFAULT 'template' CHECK(report_kind IN ('template','ai','notion')),
 source_id TEXT, source_meta TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(source_meta)),
 version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 FOREIGN KEY(trainee_id,batch_id) REFERENCES trainees(id,batch_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_trainee_batch ON trainees(batch_id);
CREATE INDEX IF NOT EXISTS ix_trainee_company ON trainees(company_id);
CREATE INDEX IF NOT EXISTS ix_attendance_batch_date ON daily_attendance(batch_id,date);
CREATE INDEX IF NOT EXISTS ix_assessment_batch ON assessments(batch_id);
CREATE VIEW IF NOT EXISTS attendance_10day_entries AS
 SELECT r.id AS summary_id, d.id AS daily_id FROM attendance_10day r JOIN daily_attendance d
 ON r.trainee_id=d.trainee_id AND r.batch_id=d.batch_id AND d.date BETWEEN r.period_start AND r.period_end;
CREATE VIEW IF NOT EXISTS assessment_scores AS SELECT *,
 (mapping+product_knowledge)*10 AS tech_score_percent,
 (presentability+soft_skills)*10 AS soft_score_percent,
 (mapping+product_knowledge+presentability+soft_skills)*5 AS overall_percent FROM assessments;
CREATE TABLE IF NOT EXISTS audit_log (
 id TEXT PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, entity TEXT NOT NULL, entity_id TEXT, details TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS assessment_history (
 id TEXT PRIMARY KEY, assessment_id TEXT, trainee_id TEXT, actor TEXT NOT NULL, snapshot TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE COLLATE NOCASE,full_name TEXT NOT NULL,
 password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','instructor','viewer')),
 active INTEGER NOT NULL DEFAULT 0 CHECK(active IN (0,1)), created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY,window_start INTEGER NOT NULL,count INTEGER NOT NULL);
CREATE TRIGGER IF NOT EXISTS trainee_capacity BEFORE INSERT ON trainees BEGIN
 SELECT CASE WHEN (SELECT COUNT(*) FROM trainees WHERE batch_id=NEW.batch_id)>=(SELECT capacity FROM batches WHERE id=NEW.batch_id)
 THEN RAISE(ABORT,'Batch is at capacity.') END; END;
CREATE TRIGGER IF NOT EXISTS trainee_batch_immutable BEFORE UPDATE OF batch_id ON trainees
 WHEN NEW.batch_id IS NOT OLD.batch_id BEGIN SELECT RAISE(ABORT,'Create a new enrollment to change batches.'); END;
CREATE TRIGGER IF NOT EXISTS batch_guard BEFORE UPDATE ON batches BEGIN
 SELECT CASE WHEN NEW.capacity<(SELECT COUNT(*) FROM trainees WHERE batch_id=OLD.id)
 THEN RAISE(ABORT,'Batch capacity cannot be lower than enrollment.') END;
 SELECT CASE WHEN OLD.source_id IS NULL AND EXISTS(SELECT 1 FROM trainees WHERE batch_id=OLD.id) AND
 (NEW.start_date<>OLD.start_date OR NEW.end_date<>OLD.end_date OR NEW.session_dates<>OLD.session_dates)
 THEN RAISE(ABORT,'Enrolled batch dates are locked.') END;
END;
DROP TRIGGER IF EXISTS batch_sessions_insert;
DROP TRIGGER IF EXISTS batch_sessions_update;
CREATE TRIGGER batch_sessions_insert BEFORE INSERT ON batches BEGIN
 SELECT CASE WHEN (NEW.source_id IS NULL AND (json_array_length(NEW.session_dates)<1 OR json_array_length(NEW.session_dates)>366)) OR (SELECT COUNT(DISTINCT value) FROM json_each(NEW.session_dates))<>json_array_length(NEW.session_dates) OR
 EXISTS(SELECT 1 FROM json_each(NEW.session_dates) WHERE type<>'text' OR (NEW.source_id IS NULL AND (value<NEW.start_date OR value>NEW.end_date)))
 THEN RAISE(ABORT,'Invalid batch session dates.') END;
END;
CREATE TRIGGER batch_sessions_update BEFORE UPDATE ON batches BEGIN
 SELECT CASE WHEN (NEW.source_id IS NULL AND (json_array_length(NEW.session_dates)<1 OR json_array_length(NEW.session_dates)>366)) OR (SELECT COUNT(DISTINCT value) FROM json_each(NEW.session_dates))<>json_array_length(NEW.session_dates) OR
 EXISTS(SELECT 1 FROM json_each(NEW.session_dates) WHERE type<>'text' OR (NEW.source_id IS NULL AND (value<NEW.start_date OR value>NEW.end_date)))
 THEN RAISE(ABORT,'Invalid batch session dates.') END;
END;
CREATE TRIGGER IF NOT EXISTS daily_session_insert BEFORE INSERT ON daily_attendance BEGIN
 SELECT CASE WHEN NEW.source_id IS NULL AND NOT EXISTS(SELECT 1 FROM batches b,json_each(b.session_dates) d WHERE b.id=NEW.batch_id AND d.value=NEW.date)
 THEN RAISE(ABORT,'Attendance requires a scheduled session date.') END;
END;
CREATE TRIGGER IF NOT EXISTS daily_session_update BEFORE UPDATE ON daily_attendance BEGIN
 SELECT CASE WHEN NEW.trainee_id IS NOT OLD.trainee_id OR NEW.batch_id IS NOT OLD.batch_id
 THEN RAISE(ABORT,'An attendance record cannot change enrollment.') END;
 SELECT CASE WHEN NEW.source_id IS NULL AND NOT EXISTS(SELECT 1 FROM batches b,json_each(b.session_dates) d WHERE b.id=NEW.batch_id AND d.value=NEW.date)
 THEN RAISE(ABORT,'Attendance requires a scheduled session date.') END;
END;
CREATE TRIGGER IF NOT EXISTS checklist_insert BEFORE INSERT ON attendance_10day BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM json_each(NEW.days) WHERE type NOT IN ('true','false')) OR
 (NEW.source_id IS NULL AND NOT EXISTS(SELECT 1 FROM batches WHERE id=NEW.batch_id AND start_date=NEW.period_start AND end_date=NEW.period_end))
 THEN RAISE(ABORT,'Invalid checklist period or day values.') END;
END;
CREATE TRIGGER IF NOT EXISTS checklist_update BEFORE UPDATE ON attendance_10day BEGIN
 SELECT CASE WHEN NEW.trainee_id IS NOT OLD.trainee_id OR NEW.batch_id IS NOT OLD.batch_id
 THEN RAISE(ABORT,'A checklist cannot change enrollment.') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM json_each(NEW.days) WHERE type NOT IN ('true','false')) OR
 (NEW.source_id IS NULL AND NOT EXISTS(SELECT 1 FROM batches WHERE id=NEW.batch_id AND start_date=NEW.period_start AND end_date=NEW.period_end))
 THEN RAISE(ABORT,'Invalid checklist period or day values.') END;
END;
CREATE TRIGGER IF NOT EXISTS assessment_enrollment_update BEFORE UPDATE ON assessments
 WHEN NEW.trainee_id IS NOT OLD.trainee_id OR NEW.batch_id IS NOT OLD.batch_id BEGIN
 SELECT RAISE(ABORT,'An assessment cannot change enrollment.'); END;

-- Private workspace setup and membership. Secret values are stored only as SHA-256 hashes.
CREATE TABLE IF NOT EXISTS setup_grants (
 name TEXT PRIMARY KEY, token_hash TEXT NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS invitations (
 id TEXT PRIMARY KEY, email TEXT NOT NULL COLLATE NOCASE, full_name TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('admin','instructor','viewer')),
 token_hash TEXT NOT NULL UNIQUE, invited_by TEXT REFERENCES users(id) ON DELETE SET NULL,
 created_at TEXT NOT NULL, expires_at INTEGER NOT NULL, used_at INTEGER, revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS ix_invitation_email ON invitations(email);
PRAGMA busy_timeout = 5000;

-- A lossless, authenticated source archive. Never exposed from public/.
CREATE TABLE IF NOT EXISTS import_runs (
 id TEXT PRIMARY KEY, source_name TEXT NOT NULL, source_sha256 TEXT NOT NULL UNIQUE,
 imported_at TEXT NOT NULL, summary TEXT NOT NULL CHECK(json_valid(summary))
);
CREATE TABLE IF NOT EXISTS source_records (
 id TEXT PRIMARY KEY, import_id TEXT NOT NULL REFERENCES import_runs(id), kind TEXT NOT NULL,
 title TEXT NOT NULL, path TEXT NOT NULL, sha256 TEXT NOT NULL, raw TEXT NOT NULL,
 properties TEXT NOT NULL CHECK(json_valid(properties)), relations TEXT NOT NULL CHECK(json_valid(relations)),
 batch_id TEXT, disposition TEXT NOT NULL, reason TEXT NOT NULL, app_records TEXT NOT NULL CHECK(json_valid(app_records))
);
CREATE INDEX IF NOT EXISTS ix_source_batch ON source_records(batch_id);
CREATE INDEX IF NOT EXISTS ix_source_kind ON source_records(kind,disposition);
CREATE TABLE IF NOT EXISTS import_reviews (
 id TEXT PRIMARY KEY, code TEXT NOT NULL, batch_id TEXT, entity TEXT, entity_id TEXT,
 source_ids TEXT NOT NULL CHECK(json_valid(source_ids)), message TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','acknowledged','resolved')),
 resolution TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_review_batch ON import_reviews(batch_id,status);
CREATE TABLE IF NOT EXISTS activity_assignments (
 id TEXT PRIMARY KEY,
 batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
 activity_id TEXT NOT NULL,
 title TEXT NOT NULL,
 instructions TEXT NOT NULL DEFAULT '',
 due_date TEXT,
 status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Closed')),
 version INTEGER NOT NULL DEFAULT 1,
 created_by TEXT NOT NULL,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 UNIQUE(id,batch_id)
);
CREATE INDEX IF NOT EXISTS ix_activity_assignments_batch ON activity_assignments(batch_id,created_at DESC);
CREATE TABLE IF NOT EXISTS activity_custom_challenges (
 id TEXT PRIMARY KEY CHECK(id GLOB 'studio-*' AND length(id) BETWEEN 10 AND 40),
 title TEXT NOT NULL CHECK(length(title) BETWEEN 3 AND 80),
 category TEXT NOT NULL CHECK(length(category) BETWEEN 2 AND 60),
 level TEXT NOT NULL CHECK(level IN ('Warm-up','Core','Challenge')),
 duration_minutes INTEGER NOT NULL CHECK(duration_minutes BETWEEN 2 AND 45),
 description TEXT NOT NULL DEFAULT '' CHECK(length(description)<=280),
 content_json TEXT NOT NULL CHECK(json_valid(content_json) AND json_type(content_json)='object'),
 created_by TEXT NOT NULL,
 created_at TEXT NOT NULL,
 archived_at TEXT
);
CREATE INDEX IF NOT EXISTS ix_activity_custom_challenges_active ON activity_custom_challenges(archived_at,created_at DESC);
CREATE TABLE IF NOT EXISTS activity_assignment_participants (
 id TEXT PRIMARY KEY,
 assignment_id TEXT NOT NULL,
 trainee_id TEXT NOT NULL,
 batch_id TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'Assigned' CHECK(status IN ('Assigned','In Progress','Completed')),
 score REAL CHECK(score IS NULL OR (score>=0 AND score<=100)),
 trainer_feedback TEXT NOT NULL DEFAULT '',
 completed_at TEXT,
 learner_code_hash TEXT,
 learner_answers TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(learner_answers)),
 learner_draft_answers TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(learner_draft_answers)),
 learner_draft_index INTEGER NOT NULL DEFAULT 0 CHECK(learner_draft_index>=0),
 learner_draft_updated_at TEXT,
 learner_draft_version INTEGER NOT NULL DEFAULT 0 CHECK(learner_draft_version>=0),
 learner_submitted_at TEXT,
 correct_count INTEGER CHECK(correct_count IS NULL OR correct_count>=0),
 earned_xp INTEGER NOT NULL DEFAULT 0 CHECK(earned_xp>=0),
 version INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 UNIQUE(assignment_id,trainee_id),
 FOREIGN KEY(assignment_id,batch_id) REFERENCES activity_assignments(id,batch_id) ON DELETE CASCADE,
 FOREIGN KEY(trainee_id,batch_id) REFERENCES trainees(id,batch_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_activity_participants_trainee ON activity_assignment_participants(trainee_id,created_at DESC);
CREATE TABLE IF NOT EXISTS activity_live_rooms (
 id TEXT PRIMARY KEY,
 code_hash TEXT NOT NULL UNIQUE CHECK(length(code_hash)=64),
 owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 activity_id TEXT NOT NULL,
 deck_snapshot TEXT NOT NULL CHECK(json_valid(deck_snapshot)),
 team_one TEXT NOT NULL CHECK(length(team_one) BETWEEN 1 AND 28),
 team_two TEXT NOT NULL CHECK(length(team_two) BETWEEN 1 AND 28),
 status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Complete','Closed')),
 round_index INTEGER NOT NULL DEFAULT 0 CHECK(round_index>=0),
 revealed INTEGER NOT NULL DEFAULT 0 CHECK(revealed IN (0,1)),
 correct_choice INTEGER CHECK(correct_choice IS NULL OR correct_choice BETWEEN 0 AND 7),
 timer_duration INTEGER NOT NULL DEFAULT 0 CHECK(timer_duration IN (0,20,30,45)),
 timer_ends_at TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_activity_live_rooms_expiry ON activity_live_rooms(expires_at);
CREATE TABLE IF NOT EXISTS activity_live_players (
 id TEXT PRIMARY KEY,
 room_id TEXT NOT NULL REFERENCES activity_live_rooms(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE CHECK(length(token_hash)=64),
 nickname TEXT NOT NULL CHECK(length(nickname) BETWEEN 1 AND 24),
 team_no INTEGER NOT NULL CHECK(team_no BETWEEN 1 AND 4),
 points INTEGER NOT NULL DEFAULT 0 CHECK(points>=0),
 streak INTEGER NOT NULL DEFAULT 0 CHECK(streak>=0),
 joined_at TEXT NOT NULL,
 last_seen_at TEXT NOT NULL,
 UNIQUE(room_id,id)
);
CREATE INDEX IF NOT EXISTS ix_activity_live_players_room ON activity_live_players(room_id,team_no,points DESC);
CREATE TABLE IF NOT EXISTS activity_live_answers (
 room_id TEXT NOT NULL REFERENCES activity_live_rooms(id) ON DELETE CASCADE,
 player_id TEXT NOT NULL REFERENCES activity_live_players(id) ON DELETE CASCADE,
 round_index INTEGER NOT NULL CHECK(round_index>=0),
 choice INTEGER NOT NULL CHECK(choice BETWEEN 0 AND 7),
 confidence TEXT CHECK(confidence IS NULL OR confidence IN ('tentative','confident')),
 correct INTEGER CHECK(correct IS NULL OR correct IN (0,1)),
 awarded_points INTEGER NOT NULL DEFAULT 0 CHECK(awarded_points>=0),
 updated_at TEXT NOT NULL,
 PRIMARY KEY(room_id,player_id,round_index)
);
CREATE INDEX IF NOT EXISTS ix_activity_live_answers_round ON activity_live_answers(room_id,round_index,choice);
CREATE TABLE IF NOT EXISTS activity_session_plans (
 id TEXT PRIMARY KEY,
 batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
 company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
 session_date TEXT NOT NULL CHECK(length(session_date)=10 AND session_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
 title TEXT NOT NULL CHECK(length(title) BETWEEN 3 AND 120),
 focus_skill TEXT NOT NULL CHECK(focus_skill IN ('discovery','qualification','accuracy','objections','ethics','followthrough','viewing','teamwork')),
 duration_minutes INTEGER NOT NULL CHECK(duration_minutes BETWEEN 15 AND 120),
 activity_id TEXT NOT NULL,
 outline_json TEXT NOT NULL CHECK(json_valid(outline_json) AND json_type(outline_json)='array' AND json_array_length(outline_json)=4),
 linked_assignment_id TEXT UNIQUE REFERENCES activity_assignments(id) ON DELETE SET NULL,
 status TEXT NOT NULL DEFAULT 'Planned' CHECK(status IN ('Planned','In Progress','Completed')),
 version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
 created_by TEXT NOT NULL,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 completed_at TEXT
);
CREATE INDEX IF NOT EXISTS ix_activity_session_plans_batch_date ON activity_session_plans(batch_id,session_date DESC,created_at DESC);
CREATE INDEX IF NOT EXISTS ix_activity_session_plans_company_date ON activity_session_plans(company_id,session_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ix_daily_native_unique ON daily_attendance(trainee_id,date) WHERE source_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ix_assessment_native_unique ON assessments(trainee_id,batch_id) WHERE source_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ix_checklist_native_unique ON attendance_10day(trainee_id,batch_id,period_start,period_end) WHERE source_id IS NULL;
PRAGMA user_version = 15;
