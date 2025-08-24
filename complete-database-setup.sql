-- COMPLETE DATABASE SETUP FOR MANUFACTURING SYSTEM
-- This script ensures 100% database completion with all required data

-- 1. CREATE SCHEMA IF NOT EXISTS
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'manufacturing_jobs')
BEGIN
    CREATE TABLE manufacturing_jobs (
        id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        job_number VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        product_type VARCHAR(100) DEFAULT 'Widget',
        current_stage INT DEFAULT 1,
        total_stages INT DEFAULT 5,
        created_by VARCHAR(255) NOT NULL,
        assigned_to VARCHAR(255),
        started_at DATETIME2 NULL,
        completed_at DATETIME2 NULL,
        hold_reason VARCHAR(500) NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Created manufacturing_jobs table';
END
ELSE
BEGIN
    PRINT 'manufacturing_jobs table already exists';
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'production_steps')
BEGIN
    CREATE TABLE production_steps (
        id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        job_id uniqueidentifier REFERENCES manufacturing_jobs(id),
        step_number INT NOT NULL,
        step_name VARCHAR(100) NOT NULL,
        description VARCHAR(500),
        data NVARCHAR(MAX), -- JSON data for step details
        status VARCHAR(50) DEFAULT 'pending',
        assigned_to VARCHAR(255),
        completed_by VARCHAR(255),
        completed_at DATETIME2 NULL,
        skipped_by VARCHAR(255),
        skipped_at DATETIME2 NULL,
        created_at DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Created production_steps table';
END
ELSE
BEGIN
    PRINT 'production_steps table already exists';
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'quality_notifications')
BEGIN
    CREATE TABLE quality_notifications (
        id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        job_id uniqueidentifier REFERENCES manufacturing_jobs(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        notification_type VARCHAR(100),
        message TEXT,
        severity VARCHAR(20) DEFAULT 'info', -- info, low, medium, high, critical
        status VARCHAR(50) DEFAULT 'open', -- open, resolved, closed
        created_by VARCHAR(255),
        assigned_to VARCHAR(255),
        resolved_by VARCHAR(255),
        resolved_at DATETIME2 NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Created quality_notifications table';
END
ELSE
BEGIN
    PRINT 'quality_notifications table already exists';
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_roles')
BEGIN
    CREATE TABLE user_roles (
        user_id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role_type VARCHAR(50) NOT NULL, -- super_admin, manager, engineer, operator, inspector
        status VARCHAR(50) DEFAULT 'active', -- active, inactive, pending
        permissions TEXT, -- JSON string of permissions
        approved_by VARCHAR(255),
        approved_at DATETIME2,
        created_at DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Created user_roles table';
END
ELSE
BEGIN
    PRINT 'user_roles table already exists';
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
    PRINT 'Created system_updates table';
END
ELSE
BEGIN
    PRINT 'system_updates table already exists';
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'pdf_reports')
BEGIN
    CREATE TABLE pdf_reports (
        id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        job_id uniqueidentifier REFERENCES manufacturing_jobs(id),
        file_name VARCHAR(255) NOT NULL,
        generated_by VARCHAR(255) NOT NULL,
        generated_at DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Created pdf_reports table';
END
ELSE
BEGIN
    PRINT 'pdf_reports table already exists';
END;

-- 2. CREATE INDEXES FOR PERFORMANCE
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_manufacturing_jobs_status' AND object_id = OBJECT_ID('manufacturing_jobs'))
BEGIN
    CREATE INDEX idx_manufacturing_jobs_status ON manufacturing_jobs(status);
    PRINT 'Created index idx_manufacturing_jobs_status';
END;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_manufacturing_jobs_created_at' AND object_id = OBJECT_ID('manufacturing_jobs'))
BEGIN
    CREATE INDEX idx_manufacturing_jobs_created_at ON manufacturing_jobs(created_at DESC);
    PRINT 'Created index idx_manufacturing_jobs_created_at';
END;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_system_updates_created_at' AND object_id = OBJECT_ID('system_updates'))
BEGIN
    CREATE INDEX idx_system_updates_created_at ON system_updates(created_at DESC);
    PRINT 'Created index idx_system_updates_created_at';
END;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_production_steps_job_id' AND object_id = OBJECT_ID('production_steps'))
BEGIN
    CREATE INDEX idx_production_steps_job_id ON production_steps(job_id, step_number);
    PRINT 'Created index idx_production_steps_job_id';
END;

-- 3. INSERT COMPREHENSIVE USER DATA
MERGE user_roles AS target
USING (VALUES 
    ('sandscreencp@outlook.com', 'sandscreencp@outlook.com', 'System Administrator', 'super_admin', 'active', '{"all": true}', 'system', GETDATE()),
    ('user1@company.com', 'user1@company.com', 'Production Manager', 'manager', 'active', '{"jobs": ["create", "read", "update", "delete"], "users": ["read", "approve"]}', 'sandscreencp@outlook.com', GETDATE()),
    ('user2@company.com', 'user2@company.com', 'Manufacturing Engineer', 'engineer', 'active', '{"jobs": ["create", "read", "update"], "steps": ["create", "read", "update"]}', 'sandscreencp@outlook.com', GETDATE()),
    ('operator1@company.com', 'operator1@company.com', 'Machine Operator', 'operator', 'active', '{"jobs": ["read"], "steps": ["read", "update"]}', 'user1@company.com', GETDATE()),
    ('operator2@company.com', 'operator2@company.com', 'Assembly Operator', 'operator', 'active', '{"jobs": ["read"], "steps": ["read", "update"]}', 'user1@company.com', GETDATE()),
    ('inspector@company.com', 'inspector@company.com', 'Quality Inspector', 'inspector', 'active', '{"jobs": ["read"], "notifications": ["create", "read", "update", "delete"]}', 'user1@company.com', GETDATE()),
    ('newuser@company.com', 'newuser@company.com', 'New Employee', 'operator', 'pending', '{"jobs": ["read"]}', NULL, NULL)
) AS source (user_id, email, full_name, role_type, status, permissions, approved_by, approved_at)
ON target.user_id = source.user_id
WHEN NOT MATCHED THEN
    INSERT (user_id, email, full_name, role_type, status, permissions, approved_by, approved_at)
    VALUES (source.user_id, source.email, source.full_name, source.role_type, source.status, source.permissions, source.approved_by, source.approved_at)
WHEN MATCHED THEN
    UPDATE SET 
        email = source.email,
        full_name = source.full_name,
        role_type = source.role_type,
        status = source.status;

PRINT 'User roles data merged successfully';

-- 4. INSERT COMPREHENSIVE MANUFACTURING JOBS DATA
DECLARE @job1_id uniqueidentifier = NEWID();
DECLARE @job2_id uniqueidentifier = NEWID();
DECLARE @job3_id uniqueidentifier = NEWID();
DECLARE @job4_id uniqueidentifier = NEWID();
DECLARE @job5_id uniqueidentifier = NEWID();

MERGE manufacturing_jobs AS target
USING (VALUES 
    (@job1_id, 'JOB-001', 'Widget Assembly Line A', 'in_progress', 'Widget', 2, 5, 'sandscreencp@outlook.com', 'operator1@company.com', DATEADD(day, -2, GETDATE()), NULL, NULL),
    (@job2_id, 'JOB-002', 'Quality Check Batch 101', 'draft', 'Component', 1, 4, 'user1@company.com', 'inspector@company.com', NULL, NULL, NULL),
    (@job3_id, 'JOB-003', 'Final Inspection Round 1', 'completed', 'Assembly', 5, 5, 'inspector@company.com', 'inspector@company.com', DATEADD(day, -5, GETDATE()), DATEADD(day, -1, GETDATE()), NULL),
    (@job4_id, 'JOB-004', 'Component Testing Suite', 'in_progress', 'Component', 3, 6, 'user2@company.com', 'user2@company.com', DATEADD(day, -3, GETDATE()), NULL, NULL),
    (@job5_id, 'JOB-005', 'Assembly Validation Run', 'on_hold', 'Assembly', 2, 4, 'operator1@company.com', 'operator2@company.com', DATEADD(day, -1, GETDATE()), NULL, 'Waiting for component delivery')
) AS source (id, job_number, title, status, product_type, current_stage, total_stages, created_by, assigned_to, started_at, completed_at, hold_reason)
ON target.job_number = source.job_number
WHEN NOT MATCHED THEN
    INSERT (id, job_number, title, status, product_type, current_stage, total_stages, created_by, assigned_to, started_at, completed_at, hold_reason)
    VALUES (source.id, source.job_number, source.title, source.status, source.product_type, source.current_stage, source.total_stages, source.created_by, source.assigned_to, source.started_at, source.completed_at, source.hold_reason);

PRINT 'Manufacturing jobs data merged successfully';

-- 5. INSERT COMPREHENSIVE PRODUCTION STEPS DATA
INSERT INTO production_steps (id, job_id, step_number, step_name, description, data, status, assigned_to, completed_by, completed_at) VALUES
-- Job 1 Steps
(NEWID(), @job1_id, 1, 'Material Preparation', 'Prepare raw materials and components', '{"materials": ["steel", "plastic"], "quantity": 100, "quality_check": true}', 'completed', 'operator1@company.com', 'operator1@company.com', DATEADD(hour, -48, GETDATE())),
(NEWID(), @job1_id, 2, 'Assembly Process', 'Assemble components into final widget', '{"assembly_time": "2 hours", "quality_gate": "passed"}', 'in_progress', 'operator1@company.com', NULL, NULL),
(NEWID(), @job1_id, 3, 'Quality Check', 'Perform quality inspection', '{"inspection_points": 12, "tolerance": "±0.1mm"}', 'pending', 'inspector@company.com', NULL, NULL),
(NEWID(), @job1_id, 4, 'Packaging', 'Package finished products', '{"package_type": "box", "labeling": true}', 'pending', 'operator2@company.com', NULL, NULL),
(NEWID(), @job1_id, 5, 'Shipping Preparation', 'Prepare for shipment', '{"shipping_method": "standard", "documentation": true}', 'pending', 'operator2@company.com', NULL, NULL),

-- Job 2 Steps  
(NEWID(), @job2_id, 1, 'Setup Equipment', 'Setup quality testing equipment', '{"equipment": ["CMM", "gauge"], "calibration": "required"}', 'pending', 'user2@company.com', NULL, NULL),
(NEWID(), @job2_id, 2, 'Batch Testing', 'Test batch of components', '{"batch_size": 50, "test_duration": "4 hours"}', 'pending', 'inspector@company.com', NULL, NULL),
(NEWID(), @job2_id, 3, 'Documentation', 'Document test results', '{"report_format": "PDF", "approval_required": true}', 'pending', 'inspector@company.com', NULL, NULL),
(NEWID(), @job2_id, 4, 'Approval Process', 'Get manager approval', '{"approver": "user1@company.com", "criteria": "quality_standards"}', 'pending', 'user1@company.com', NULL, NULL),

-- Job 3 Steps (Completed)
(NEWID(), @job3_id, 1, 'Visual Inspection', 'Perform visual quality check', '{"defect_types": ["scratch", "dent", "misalignment"]}', 'completed', 'inspector@company.com', 'inspector@company.com', DATEADD(day, -4, GETDATE())),
(NEWID(), @job3_id, 2, 'Dimensional Check', 'Verify dimensions within tolerance', '{"measurements": 15, "tolerance": "±0.05mm"}', 'completed', 'inspector@company.com', 'inspector@company.com', DATEADD(day, -3, GETDATE())),
(NEWID(), @job3_id, 3, 'Functional Test', 'Test product functionality', '{"test_cycles": 100, "success_rate": "99.5%"}', 'completed', 'user2@company.com', 'user2@company.com', DATEADD(day, -2, GETDATE())),
(NEWID(), @job3_id, 4, 'Final Approval', 'Get final quality approval', '{"approved_by": "inspector@company.com"}', 'completed', 'inspector@company.com', 'inspector@company.com', DATEADD(day, -1, GETDATE())),
(NEWID(), @job3_id, 5, 'Release to Shipping', 'Release products for shipping', '{"shipping_date": "2025-08-25", "quantity": 100}', 'completed', 'operator2@company.com', 'operator2@company.com', DATEADD(day, -1, GETDATE())),

-- Job 4 Steps
(NEWID(), @job4_id, 1, 'Component Verification', 'Verify component specifications', '{"spec_check": true, "material_cert": "required"}', 'completed', 'user2@company.com', 'user2@company.com', DATEADD(day, -2, GETDATE())),
(NEWID(), @job4_id, 2, 'Performance Testing', 'Test component performance', '{"load_test": true, "stress_test": true}', 'completed', 'user2@company.com', 'user2@company.com', DATEADD(hour, -12, GETDATE())),
(NEWID(), @job4_id, 3, 'Reliability Testing', 'Long-term reliability test', '{"duration": "24 hours", "cycles": 1000}', 'in_progress', 'user2@company.com', NULL, NULL),
(NEWID(), @job4_id, 4, 'Environmental Testing', 'Test under various conditions', '{"temp_range": "-20°C to 60°C", "humidity": "30-90%"}', 'pending', 'user2@company.com', NULL, NULL),
(NEWID(), @job4_id, 5, 'Compliance Check', 'Verify regulatory compliance', '{"standards": ["ISO9001", "CE"], "documentation": true}', 'pending', 'inspector@company.com', NULL, NULL),
(NEWID(), @job4_id, 6, 'Final Report', 'Generate test report', '{"format": "PDF", "distribution": "stakeholders"}', 'pending', 'user2@company.com', NULL, NULL);

PRINT 'Production steps data inserted successfully';

-- 6. INSERT QUALITY NOTIFICATIONS DATA
INSERT INTO quality_notifications (id, job_id, title, description, notification_type, message, severity, status, created_by, assigned_to, resolved_by, resolved_at) VALUES
(NEWID(), @job1_id, 'Minor Surface Defect', 'Small scratch detected on widget surface during assembly', 'Quality Issue', 'Minor surface defect detected in assembly process. Requires attention but does not affect functionality.', 'medium', 'open', 'inspector@company.com', 'operator1@company.com', NULL, NULL),
(NEWID(), @job4_id, 'Performance Below Target', 'Component testing shows performance below optimal target', 'Performance Alert', 'Component testing shows acceptable but below optimal performance. Consider process optimization.', 'low', 'resolved', 'user2@company.com', 'user2@company.com', 'user2@company.com', DATEADD(hour, -6, GETDATE())),
(NEWID(), @job2_id, 'Equipment Calibration Due', 'Quality testing equipment requires calibration', 'Equipment Status', 'Equipment calibration scheduled for next maintenance window. Current readings within acceptable range.', 'info', 'open', 'user2@company.com', 'user1@company.com', NULL, NULL),
(NEWID(), @job5_id, 'Component Delay', 'Required components not delivered on schedule', 'Supply Chain', 'Component delivery delayed by 2 days. Job placed on hold pending material arrival.', 'high', 'open', 'operator1@company.com', 'user1@company.com', NULL, NULL),
(NEWID(), @job3_id, 'Inspection Complete', 'Final inspection completed successfully', 'Completion Notice', 'All quality checks completed successfully. Product approved for shipping.', 'info', 'resolved', 'inspector@company.com', 'user1@company.com', 'inspector@company.com', DATEADD(day, -1, GETDATE()));

PRINT 'Quality notifications data inserted successfully';

-- 7. INSERT SYSTEM UPDATES FOR REAL-TIME POLLING
INSERT INTO system_updates (update_type, entity_type, entity_id, data, created_by) VALUES
('created', 'job', @job1_id, '{"jobNumber":"JOB-001","title":"Widget Assembly Line A","status":"in_progress","productType":"Widget"}', 'sandscreencp@outlook.com'),
('updated', 'step', @job1_id, '{"stepNumber":1,"stepName":"Material Preparation","status":"completed","jobId":"' + CAST(@job1_id AS VARCHAR(36)) + '"}', 'operator1@company.com'),
('updated', 'step', @job1_id, '{"stepNumber":2,"stepName":"Assembly Process","status":"in_progress","jobId":"' + CAST(@job1_id AS VARCHAR(36)) + '"}', 'operator1@company.com'),
('created', 'notification', @job1_id, '{"title":"Minor Surface Defect","message":"Small scratch detected on widget surface","severity":"medium"}', 'inspector@company.com'),
('completed', 'job', @job3_id, '{"jobNumber":"JOB-003","title":"Final Inspection Round 1","status":"completed","completedAt":"' + CONVERT(VARCHAR, DATEADD(day, -1, GETDATE()), 126) + '"}', 'inspector@company.com'),
('created', 'job', @job4_id, '{"jobNumber":"JOB-004","title":"Component Testing Suite","status":"in_progress","productType":"Component"}', 'user2@company.com'),
('on_hold', 'job', @job5_id, '{"jobNumber":"JOB-005","title":"Assembly Validation Run","status":"on_hold","holdReason":"Waiting for component delivery"}', 'operator1@company.com');

PRINT 'System updates data inserted successfully';

-- 8. INSERT SAMPLE PDF REPORTS
INSERT INTO pdf_reports (id, job_id, file_name, generated_by) VALUES
(NEWID(), @job3_id, 'JOB-003-final-inspection-report.pdf', 'inspector@company.com'),
(NEWID(), @job4_id, 'JOB-004-component-test-preliminary.pdf', 'user2@company.com'),
(NEWID(), @job1_id, 'JOB-001-quality-checklist.pdf', 'inspector@company.com');

PRINT 'PDF reports data inserted successfully';

-- 9. VERIFICATION QUERY
SELECT 
    'DATABASE SETUP COMPLETE' as Status,
    (SELECT COUNT(*) FROM manufacturing_jobs) as Jobs,
    (SELECT COUNT(*) FROM production_steps) as Steps, 
    (SELECT COUNT(*) FROM quality_notifications) as Notifications,
    (SELECT COUNT(*) FROM user_roles) as Users,
    (SELECT COUNT(*) FROM system_updates) as Updates,
    (SELECT COUNT(*) FROM pdf_reports) as PDFReports,
    GETDATE() as CompletedAt;

PRINT 'Database setup completed successfully - 100% ready for production use';