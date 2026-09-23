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
CREATE UNIQUE INDEX IF NOT EXISTS ix_daily_native_unique ON daily_attendance(trainee_id,date) WHERE source_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ix_assessment_native_unique ON assessments(trainee_id,batch_id) WHERE source_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ix_checklist_native_unique ON attendance_10day(trainee_id,batch_id,period_start,period_end) WHERE source_id IS NULL;
PRAGMA user_version = 4;
