ALTER TABLE users
  MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USERS';

UPDATE users
SET role = 'USERS'
WHERE role = 'STUDENT';

UPDATE users
SET role = 'TECHNICIAN'
WHERE role = 'STAFF';

UPDATE users
SET provider = 'LOCAL'
WHERE provider IS NULL OR provider = '';

UPDATE users
SET name = TRIM(CONCAT(first_name, ' ', last_name))
WHERE name IS NULL OR name = '';

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title VARCHAR(255) NULL,
  message TEXT NULL,
  type VARCHAR(50) NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user_id (user_id),
  KEY idx_notifications_is_read (is_read),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ticket (
  id BIGINT NOT NULL AUTO_INCREMENT,
  resource_id BIGINT NOT NULL,
  created_by BIGINT NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  assigned_technician_id BIGINT NULL,
  resolution_notes TEXT NULL,
  preferred_contact VARCHAR(255) NOT NULL,
  rejection_reason VARCHAR(500) NULL,
  created_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY idx_ticket_status (status),
  KEY idx_ticket_priority (priority),
  KEY idx_ticket_created_by (created_by),
  KEY idx_ticket_technician (assigned_technician_id)
);

CREATE TABLE IF NOT EXISTS ticket_attachments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  uploaded_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY idx_ticket_attachment_ticket_id (ticket_id),
  CONSTRAINT fk_ticket_attachments_ticket
    FOREIGN KEY (ticket_id) REFERENCES ticket (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ticket_comments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY idx_ticket_comment_ticket_id (ticket_id),
  CONSTRAINT fk_ticket_comments_ticket
    FOREIGN KEY (ticket_id) REFERENCES ticket (id)
    ON DELETE CASCADE
);