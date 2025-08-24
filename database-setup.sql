-- Complete Database Setup and Sample Data for Manufacturing System
-- This script ensures all required tables exist and inserts sample data as per flow.md

-- Check if tables exist, create if missing
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'manufacturing_jobs')
BEGIN
    CREATE TABLE manufacturing_jobs (
        id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        job_number VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        created_by VARCHAR(255) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'production_steps')
BEGIN
    CREATE TABLE production_steps (
        id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        job_id uniqueidentifier REFERENCES manufacturing_jobs(id),
        step_number INT NOT NULL,
        description VARCHAR(500),
        status VARCHAR(50) DEFAULT 'pending',
        assigned_to VARCHAR(255),
        completed_by VARCHAR(255),
        completed_at DATETIME2 NULL,
        created_at DATETIME2 DEFAULT GETDATE()
    );
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'quality_notifications')
BEGIN
    CREATE TABLE quality_notifications (
        id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        job_id uniqueidentifier REFERENCES manufacturing_jobs(id),
        notification_type VARCHAR(100),
        message TEXT,
        severity VARCHAR(20) DEFAULT 'info',
        created_by VARCHAR(255),
        created_at DATETIME2 DEFAULT GETDATE()
    );
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_roles')
BEGIN
    CREATE TABLE user_roles (
        user_id VARCHAR(255) PRIMARY KEY,
        role_type VARCHAR(50) NOT NULL,
        permissions TEXT,
        created_at DATETIME2 DEFAULT GETDATE()
    );
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'system_updates')
BEGIN
    CREATE TABLE system_updates (
        id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        update_type VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id uniqueidentifier NOT NULL,
        data NVARCHAR(MAX) NOT NULL,
        created_by VARCHAR(255),
        created_at DATETIME2 DEFAULT GETDATE()
    );
END;

-- Create indexes if they don't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_manufacturing_jobs_status')
BEGIN
    CREATE INDEX idx_manufacturing_jobs_status ON manufacturing_jobs(status);
END;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_manufacturing_jobs_created_at')
BEGIN
    CREATE INDEX idx_manufacturing_jobs_created_at ON manufacturing_jobs(created_at DESC);
END;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_system_updates_created_at')
BEGIN
    CREATE INDEX idx_system_updates_created_at ON system_updates(created_at DESC);
END;

-- Insert sample user roles (flow.md requirement)
MERGE user_roles AS target
USING (VALUES 
    ('sandscreencp@outlook.com', 'super_admin', NULL),
    ('user1@company.com', 'manager', NULL),
    ('user2@company.com', 'engineer', NULL),
    ('operator1@company.com', 'operator', NULL),
    ('inspector@company.com', 'inspector', NULL)
) AS source (user_id, role_type, permissions)
ON target.user_id = source.user_id
WHEN NOT MATCHED THEN
    INSERT (user_id, role_type, permissions)
    VALUES (source.user_id, source.role_type, source.permissions);

-- Insert sample manufacturing jobs (flow.md requirement lines 1414-1416)
MERGE manufacturing_jobs AS target
USING (VALUES 
    ('JOB-001', 'Widget Assembly Line A', 'in_progress', 'sandscreencp@outlook.com'),
    ('JOB-002', 'Quality Check Batch 101', 'draft', 'user1@company.com'),
    ('JOB-003', 'Final Inspection Round 1', 'completed', 'inspector@company.com'),
    ('JOB-004', 'Component Testing Suite', 'in_progress', 'user2@company.com'),
    ('JOB-005', 'Assembly Validation Run', 'draft', 'operator1@company.com')
) AS source (job_number, title, status, created_by)
ON target.job_number = source.job_number
WHEN NOT MATCHED THEN
    INSERT (job_number, title, status, created_by)
    VALUES (source.job_number, source.title, source.status, source.created_by);

-- Insert sample production steps (flow.md requirement lines 1420-1427)
DECLARE @jobId1 uniqueidentifier = (SELECT TOP 1 id FROM manufacturing_jobs WHERE job_number = 'JOB-001');
DECLARE @jobId2 uniqueidentifier = (SELECT TOP 1 id FROM manufacturing_jobs WHERE job_number = 'JOB-002');
DECLARE @jobId4 uniqueidentifier = (SELECT TOP 1 id FROM manufacturing_jobs WHERE job_number = 'JOB-004');

-- Only insert if we have valid job IDs
IF @jobId1 IS NOT NULL AND @jobId2 IS NOT NULL AND @jobId4 IS NOT NULL
BEGIN
    MERGE production_steps AS target
    USING (VALUES 
        (@jobId1, 1, 'Prepare materials', 'completed', 'operator1@company.com', 'operator1@company.com', DATEADD(hour, -2, GETDATE())),
        (@jobId1, 2, 'Assembly process', 'in_progress', 'operator2@company.com', NULL, NULL),
        (@jobId1, 3, 'Quality check', 'pending', 'inspector@company.com', NULL, NULL),
        (@jobId2, 1, 'Setup equipment', 'pending', 'user2@company.com', NULL, NULL),
        (@jobId2, 2, 'Calibration check', 'pending', 'user2@company.com', NULL, NULL),
        (@jobId4, 1, 'Component verification', 'completed', 'inspector@company.com', 'inspector@company.com', DATEADD(hour, -1, GETDATE())),
        (@jobId4, 2, 'Performance testing', 'in_progress', 'user2@company.com', NULL, NULL)
    ) AS source (job_id, step_number, description, status, assigned_to, completed_by, completed_at)
    ON target.job_id = source.job_id AND target.step_number = source.step_number
    WHEN NOT MATCHED THEN
        INSERT (job_id, step_number, description, status, assigned_to, completed_by, completed_at)
        VALUES (source.job_id, source.step_number, source.description, source.status, source.assigned_to, source.completed_by, source.completed_at);
END;

-- Insert sample quality notifications
MERGE quality_notifications AS target
USING (VALUES 
    (@jobId1, 'Quality Issue', 'Minor surface defect detected in assembly process', 'medium', 'inspector@company.com'),
    (@jobId4, 'Performance Alert', 'Component testing shows acceptable but below optimal performance', 'low', 'user2@company.com'),
    (@jobId2, 'Equipment Status', 'Equipment calibration scheduled for next maintenance window', 'info', 'user2@company.com')
) AS source (job_id, notification_type, message, severity, created_by)
ON target.job_id = source.job_id AND target.notification_type = source.notification_type
WHEN NOT MATCHED THEN
    INSERT (job_id, notification_type, message, severity, created_by)
    VALUES (source.job_id, source.notification_type, source.message, source.severity, source.created_by);

-- Insert some system updates for real-time polling
INSERT INTO system_updates (update_type, entity_type, entity_id, data, created_by)
VALUES 
    ('created', 'job', @jobId1, '{"jobNumber":"JOB-001","title":"Widget Assembly Line A","status":"in_progress"}', 'sandscreencp@outlook.com'),
    ('updated', 'step', @jobId1, '{"stepNumber":1,"description":"Prepare materials","status":"completed","jobId":"' + CAST(@jobId1 AS VARCHAR(36)) + '"}', 'operator1@company.com'),
    ('created', 'notification', @jobId1, '{"type":"Quality Issue","message":"Minor surface defect detected","severity":"medium"}', 'inspector@company.com');

-- Verify the setup
SELECT 'Setup Complete' as Status,
       (SELECT COUNT(*) FROM manufacturing_jobs) as Jobs,
       (SELECT COUNT(*) FROM production_steps) as Steps,
       (SELECT COUNT(*) FROM quality_notifications) as Notifications,
       (SELECT COUNT(*) FROM user_roles) as Users,
       (SELECT COUNT(*) FROM system_updates) as Updates;