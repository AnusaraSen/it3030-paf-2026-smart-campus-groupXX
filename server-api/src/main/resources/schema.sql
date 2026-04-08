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