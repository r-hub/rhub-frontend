
-- Mostly modeled after https://docs.travis-ci.com/api

DROP TABLE IF EXISTS access;
DROP TABLE IF EXISTS "user";
DROP TABLE IF EXISTS build;
DROP TABLE IF EXISTS job;
DROP TABLE IF EXISTS repository;
DROP TABLE IF EXISTS account;

-- A user might have access to multiple accounts. This is usually the
-- account corresponding to the user directly and one account per GitHub
-- organization.

CREATE TABLE account (
  id INT PRIMARY KEY,
  login VARCHAR(64),
  name VARCHAR(100),
  org BOOLEAN);
CREATE INDEX idx_account_id ON account(id);
CREATE INDEX idc_account_login ON account(login);

CREATE TABLE repository(
  id INT PRIMARY KEY,
  account_id INT REFERENCES account(id),
  slug VARCHAR(100),
  subdir VARCHAR(100),		-- package might be in subdir
  description TEXT);
CREATE INDEX idx_repository_id ON repository(id);
CREATE INDEX idx_repository_slug ON repository(slug);

CREATE TABLE job(
  id INT PRIMARY KEY,
  num_builds INT,
  state VARCHAR(10),		-- summary from build
  repository_id INT REFERENCES repository(id),
  subdir VARCHAR(64),
  pull BOOLEAN,
  pull_title VARCHAR(200),
  pull_number INT,
  config JSON,
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  duration INTERVAL,
  sha VARCHAR(40),
  branch VARCHAR(64),
  message TEXT,
  committed_at TIMESTAMP,
  author_name VARCHAR(100),
  author_email VARCHAR(100),
  committer_name VARCHAR(100),
  committer_email VARCHAR(100),
  compare_url VARCHAR(200));  
CREATE INDEX idx_job_id ON job(id);
CREATE INDEX idx_job_repository_id ON job(repository_id);
CREATE INDEX idx_job_started_at ON job(started_at);

CREATE TABLE build (
  id INT REFERENCES job(id),
  number INT,
  state VARCHAR(10),
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  duration INTERVAL,
  log_id VARCHAR(50));
CREATE INDEX idx_build_id ON build(id);

CREATE TABLE "user"(
  id INT PRIMARY KEY,
  github_login VARCHAR(64) UNIQUE NOT NULL,
  github_name VARCHAR(100),
  github_email VARCHAR(100),
  gravatar_id VARCHAR(40),
  created_at TIMESTAMP,
  synched_at TIMESTAMP);
CREATE INDEX idx_user_id ON "user"(id);
CREATE INDEX idx_user_github_login ON "user"(github_login);

CREATE TABLE access(
  user_id INT REFERENCES "user"(id),
  account_id INT REFERENCES account(id)
);
CREATE INDEX idx_access_user_id ON access(user_id);
CREATE INDEX idx_access_account_id ON access(account_id);
