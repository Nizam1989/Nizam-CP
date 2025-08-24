-- Manufacturing Database Schema for PostgreSQL
-- Real-time Manufacturing Tracking System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Manufacturing Jobs Table
CREATE TABLE IF NOT EXISTS manufacturing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    product_type VARCHAR(50) DEFAULT 'Custom',
    status VARCHAR(50) DEFAULT 'draft',
    current_stage VARCHAR(255) DEFAULT 'Planning',
    total_stages INTEGER DEFAULT 5,
    created_by VARCHAR(255) NOT NULL,
    assigned_to VARCHAR(255),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    hold_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production Steps Table
CREATE TABLE IF NOT EXISTS production_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES manufacturing_jobs(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    description TEXT,
    data JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    assigned_to VARCHAR(255),
    completed_by VARCHAR(255),
    completed_at TIMESTAMPTZ,
    skipped_by VARCHAR(255),
    skipped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality Notifications Table
CREATE TABLE IF NOT EXISTS quality_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES manufacturing_jobs(id) ON DELETE SET NULL,
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    status VARCHAR(50) DEFAULT 'open',
    created_by VARCHAR(255) NOT NULL,
    assigned_to VARCHAR(255),
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(255) PRIMARY KEY,
    role_type VARCHAR(50) NOT NULL, -- super_admin, manager, engineer, operator, inspector
    permissions JSONB,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDF Reports Table
CREATE TABLE IF NOT EXISTS pdf_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES manufacturing_jobs(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT,
    template_type VARCHAR(100),
    generated_by VARCHAR(255) NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time Updates Table (for polling mechanism)
CREATE TABLE IF NOT EXISTS system_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    update_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL, -- job, step, notification, pdf
    entity_id UUID NOT NULL,
    data JSONB NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_manufacturing_jobs_status ON manufacturing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_manufacturing_jobs_created_at ON manufacturing_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manufacturing_jobs_created_by ON manufacturing_jobs(created_by);

CREATE INDEX IF NOT EXISTS idx_production_steps_job_id ON production_steps(job_id);
CREATE INDEX IF NOT EXISTS idx_production_steps_status ON production_steps(status);
CREATE INDEX IF NOT EXISTS idx_production_steps_step_number ON production_steps(job_id, step_number);

CREATE INDEX IF NOT EXISTS idx_quality_notifications_job_id ON quality_notifications(job_id);
CREATE INDEX IF NOT EXISTS idx_quality_notifications_status ON quality_notifications(status);
CREATE INDEX IF NOT EXISTS idx_quality_notifications_severity ON quality_notifications(severity);

CREATE INDEX IF NOT EXISTS idx_system_updates_created_at ON system_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_updates_entity_type ON system_updates(entity_type);

-- Create trigger function for updating 'updated_at' columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_manufacturing_jobs_updated_at ON manufacturing_jobs;
CREATE TRIGGER update_manufacturing_jobs_updated_at
    BEFORE UPDATE ON manufacturing_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_steps_updated_at ON production_steps;
CREATE TRIGGER update_production_steps_updated_at
    BEFORE UPDATE ON production_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quality_notifications_updated_at ON quality_notifications;
CREATE TRIGGER update_quality_notifications_updated_at
    BEFORE UPDATE ON quality_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample user roles
INSERT INTO user_roles (user_id, role_type, full_name, email, permissions) VALUES 
('sandscreencp@outlook.com', 'super_admin', 'System Administrator', 'sandscreencp@outlook.com', 
 '{"jobs": ["create", "read", "update", "delete"], "steps": ["create", "read", "update", "delete"], "notifications": ["create", "read", "update", "delete"], "reports": ["create", "read"], "users": ["create", "read", "update", "delete"]}'),
('manager@nizamcp.com', 'manager', 'Production Manager', 'manager@nizamcp.com', 
 '{"jobs": ["create", "read", "update"], "steps": ["read", "update"], "notifications": ["create", "read", "update"], "reports": ["create", "read"], "users": ["read"]}'),
('engineer@nizamcp.com', 'engineer', 'Manufacturing Engineer', 'engineer@nizamcp.com', 
 '{"jobs": ["read", "update"], "steps": ["create", "read", "update"], "notifications": ["create", "read"], "reports": ["read"], "users": ["read"]}'),
('operator@nizamcp.com', 'operator', 'Production Operator', 'operator@nizamcp.com', 
 '{"jobs": ["read"], "steps": ["read", "update"], "notifications": ["create", "read"], "reports": ["read"], "users": ["read"]}'),
('inspector@nizamcp.com', 'inspector', 'Quality Inspector', 'inspector@nizamcp.com', 
 '{"jobs": ["read"], "steps": ["read", "update"], "notifications": ["create", "read", "update"], "reports": ["create", "read"], "users": ["read"]}')
ON CONFLICT (user_id) DO UPDATE SET
    role_type = EXCLUDED.role_type,
    permissions = EXCLUDED.permissions,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = NOW();

-- Insert sample manufacturing jobs
INSERT INTO manufacturing_jobs (id, job_number, title, product_type, status, current_stage, created_by, assigned_to, started_at) VALUES 
(uuid_generate_v4(), 'JOB-001', 'Widget Assembly Line A', 'Widget', 'in_progress', 'Assembly', 'sandscreencp@outlook.com', 'operator@nizamcp.com', NOW() - INTERVAL '2 days'),
(uuid_generate_v4(), 'JOB-002', 'Quality Check Batch 101', 'Batch Processing', 'draft', 'Planning', 'manager@nizamcp.com', NULL, NULL),
(uuid_generate_v4(), 'JOB-003', 'Final Inspection Round 1', 'Inspection', 'completed', 'Complete', 'inspector@nizamcp.com', 'inspector@nizamcp.com', NOW() - INTERVAL '5 days')
ON CONFLICT (job_number) DO NOTHING;

-- Insert sample production steps
DO $$
DECLARE
    job1_id UUID;
    job2_id UUID;
    job3_id UUID;
BEGIN
    SELECT id INTO job1_id FROM manufacturing_jobs WHERE job_number = 'JOB-001';
    SELECT id INTO job2_id FROM manufacturing_jobs WHERE job_number = 'JOB-002';
    SELECT id INTO job3_id FROM manufacturing_jobs WHERE job_number = 'JOB-003';
    
    IF job1_id IS NOT NULL THEN
        INSERT INTO production_steps (job_id, step_number, step_name, description, status, assigned_to, completed_by, completed_at) VALUES 
        (job1_id, 1, 'Material Preparation', 'Prepare all raw materials and components', 'completed', 'operator@nizamcp.com', 'operator@nizamcp.com', NOW() - INTERVAL '1 day'),
        (job1_id, 2, 'Assembly Process', 'Main assembly of widget components', 'in_progress', 'operator@nizamcp.com', NULL, NULL),
        (job1_id, 3, 'Quality Inspection', 'Inspect assembled widgets for defects', 'pending', 'inspector@nizamcp.com', NULL, NULL),
        (job1_id, 4, 'Packaging', 'Package completed widgets', 'pending', 'operator@nizamcp.com', NULL, NULL),
        (job1_id, 5, 'Shipping Preparation', 'Prepare for shipping', 'pending', 'operator@nizamcp.com', NULL, NULL);
    END IF;
    
    IF job2_id IS NOT NULL THEN
        INSERT INTO production_steps (job_id, step_number, step_name, description, status, assigned_to) VALUES 
        (job2_id, 1, 'Equipment Setup', 'Setup and calibrate equipment', 'pending', 'engineer@nizamcp.com'),
        (job2_id, 2, 'Batch Processing', 'Process the quality check batch', 'pending', 'operator@nizamcp.com'),
        (job2_id, 3, 'Data Analysis', 'Analyze quality metrics', 'pending', 'engineer@nizamcp.com');
    END IF;
    
    IF job3_id IS NOT NULL THEN
        INSERT INTO production_steps (job_id, step_number, step_name, description, status, completed_by, completed_at) VALUES 
        (job3_id, 1, 'Final Visual Inspection', 'Complete visual inspection', 'completed', 'inspector@nizamcp.com', NOW() - INTERVAL '3 days'),
        (job3_id, 2, 'Documentation', 'Complete inspection documentation', 'completed', 'inspector@nizamcp.com', NOW() - INTERVAL '3 days'),
        (job3_id, 3, 'Approval', 'Final approval and sign-off', 'completed', 'manager@nizamcp.com', NOW() - INTERVAL '3 days');
    END IF;
END $$;

-- Insert sample quality notifications
DO $$
DECLARE
    job1_id UUID;
BEGIN
    SELECT id INTO job1_id FROM manufacturing_jobs WHERE job_number = 'JOB-001';
    
    IF job1_id IS NOT NULL THEN
        INSERT INTO quality_notifications (job_id, notification_type, title, message, severity, created_by, assigned_to) VALUES 
        (job1_id, 'quality_issue', 'Minor Surface Defect Found', 'Small scratch detected on widget surface during assembly. Requires attention before proceeding to packaging.', 'medium', 'operator@nizamcp.com', 'inspector@nizamcp.com'),
        (job1_id, 'process_update', 'Assembly Speed Optimization', 'Assembly time reduced by 15% through process optimization. Update documentation accordingly.', 'info', 'engineer@nizamcp.com', 'manager@nizamcp.com');
    END IF;
END $$;

-- Create a function to log system updates (for real-time polling)
CREATE OR REPLACE FUNCTION log_system_update(
    p_update_type VARCHAR(100),
    p_entity_type VARCHAR(100),
    p_entity_id UUID,
    p_data JSONB,
    p_created_by VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    update_id UUID;
BEGIN
    INSERT INTO system_updates (update_type, entity_type, entity_id, data, created_by)
    VALUES (p_update_type, p_entity_type, p_entity_id, p_data, p_created_by)
    RETURNING id INTO update_id;
    
    RETURN update_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically log updates
CREATE OR REPLACE FUNCTION trigger_log_job_updates()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_system_update('created', 'job', NEW.id, to_jsonb(NEW), NEW.created_by);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_system_update('updated', 'job', NEW.id, to_jsonb(NEW), NEW.created_by);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_log_step_updates()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_system_update('created', 'step', NEW.id, to_jsonb(NEW), NEW.assigned_to);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_system_update('updated', 'step', NEW.id, to_jsonb(NEW), COALESCE(NEW.completed_by, NEW.assigned_to));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_log_notification_updates()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_system_update('created', 'notification', NEW.id, to_jsonb(NEW), NEW.created_by);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_system_update('updated', 'notification', NEW.id, to_jsonb(NEW), COALESCE(NEW.resolved_by, NEW.created_by));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the triggers
DROP TRIGGER IF EXISTS job_updates_trigger ON manufacturing_jobs;
CREATE TRIGGER job_updates_trigger
    AFTER INSERT OR UPDATE ON manufacturing_jobs
    FOR EACH ROW EXECUTE FUNCTION trigger_log_job_updates();

DROP TRIGGER IF EXISTS step_updates_trigger ON production_steps;
CREATE TRIGGER step_updates_trigger
    AFTER INSERT OR UPDATE ON production_steps
    FOR EACH ROW EXECUTE FUNCTION trigger_log_step_updates();

DROP TRIGGER IF EXISTS notification_updates_trigger ON quality_notifications;
CREATE TRIGGER notification_updates_trigger
    AFTER INSERT OR UPDATE ON quality_notifications
    FOR EACH ROW EXECUTE FUNCTION trigger_log_notification_updates();

-- Clean up old system updates (keep only last 24 hours)
CREATE OR REPLACE FUNCTION cleanup_system_updates()
RETURNS void AS $$
BEGIN
    DELETE FROM system_updates 
    WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;