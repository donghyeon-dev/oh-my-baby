-- Rename user roles from ADMIN/VIEWER to PARENT/FAMILY
UPDATE users SET role = 'PARENT' WHERE role = 'ADMIN';
UPDATE users SET role = 'FAMILY' WHERE role = 'VIEWER';
