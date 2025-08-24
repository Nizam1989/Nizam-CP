# Complete Manufacturing Web App Implementation Guide

**Transform your $40 Azure setup into a full manufacturing system with real-time collaboration for 10-15 users**

## 🚨 CRITICAL INSTRUCTIONS FOR CLAUDE CODE

**CLAUDE CODE: YOU MUST IMPLEMENT EVERYTHING IN THIS FILE - DO NOT SKIP ANY STEPS**

### MANDATORY IMPLEMENTATION REQUIREMENTS:
- ✅ **EXECUTE ALL PHASES** - Complete every phase from 1-6 in order
- ✅ **CREATE ALL FILES** - Every function, component, and configuration file must be created
- ✅ **RUN ALL COMMANDS** - Execute every Azure CLI command and npm command
- ✅ **IMPLEMENT ALL CODE** - Write complete implementation, no placeholders or TODO comments
- ✅ **TEST EVERYTHING** - Verify each phase works before moving to next
- ✅ **NO SKIPPING** - Do not skip any implementation details or say "implement your logic here"
- ✅ **COMPLETE FUNCTIONS** - Every Azure Function must be fully implemented with real database operations
- ✅ **FULL REACT COMPONENTS** - All React components must be complete with full functionality
- ✅ **DATABASE OPERATIONS** - All SQL operations must be implemented with proper error handling

### WHAT YOU MUST NOT DO:
- ❌ Do not skip any phases or steps
- ❌ Do not leave placeholder comments like "// implement this"
- ❌ Do not say "add your logic here" - implement the actual logic
- ❌ Do not skip database schema creation
- ❌ Do not skip any function implementations
- ❌ Do not skip React component implementations
- ❌ Do not skip CSS styling
- ❌ Do not skip testing steps

### VERIFICATION REQUIREMENTS:
After implementation, you must verify:
1. All Azure services are created and configured
2. All Functions are deployed and working
3. Database tables are created with sample data
4. React app connects to WebPubSub successfully
5. Real-time messaging works between multiple browser tabs
6. PDF generation works end-to-end
7. All user roles and permissions function correctly

**REMEMBER: This is a production system for a manufacturing company. Any skipped implementation could result in system failure and financial loss. IMPLEMENT EVERYTHING COMPLETELY.**

## 🎯 Executive Summary

- **Current Setup**: Azure Static Web Apps + Azure Functions + Azure SQL ($40/month)
- **Target**: Add real-time manufacturing capabilities with Azure Web PubSub Free Tier
- **Total Cost**: **$40/month** (no additional charges)
- **Capacity**: 100 concurrent connections, 1 million messages/month
- **Implementation Time**: 2-3 hours
- **Users Supported**: 10-15 concurrent users with room for growth

## 📋 Prerequisites

- Existing Azure Static Web Apps (React frontend)
- Existing Azure Functions (Consumption plan)
- Existing Azure SQL Database (Basic tier)
- Azure CLI installed
- Node.js development environment

## 🏗️ Architecture Overview

```
React Frontend (Static Web Apps)
    ↓ WebSocket Connection
Azure Web PubSub (Free Tier - 100 connections)
    ↓ Real-time Messages
Azure Functions (Enhanced with real-time broadcasting)
    ↓ Data Storage
Azure SQL Database (Extended with manufacturing tables)
```

## 🚀 Phase 1: Azure Web PubSub Setup (10 minutes)

### Step 1.1: Create Web PubSub Service
```bash
# Create Web PubSub service
az webpubsub create \
  --name "manufacturing-webpubsub" \
  --resource-group "your-existing-rg" \
  --location "East US" \
  --sku Free_F1 \
  --unit-count 1
```

### Step 1.2: Get Connection String
```bash
# Get connection string
az webpubsub key show \
  --name "manufacturing-webpubsub" \
  --resource-group "your-existing-rg" \
  --query primaryConnectionString \
  --output tsv
```

### Step 1.3: Configure Function App Settings
```bash
# Add connection string to Function App
az functionapp config appsettings set \
  --name "your-function-app" \
  --resource-group "your-existing-rg" \
  --settings "WebPubSubConnectionString=YOUR_CONNECTION_STRING_HERE"
```

## 🔧 Phase 2: Database Schema Extensions (15 minutes)

Add these tables to your existing Azure SQL Database:

```sql
-- Manufacturing Jobs Table
CREATE TABLE manufacturing_jobs (
    id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
    job_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_by VARCHAR(255) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Production Steps Table
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

-- Quality Notifications Table
CREATE TABLE quality_notifications (
    id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
    job_id uniqueidentifier REFERENCES manufacturing_jobs(id),
    notification_type VARCHAR(100),
    message TEXT,
    severity VARCHAR(20) DEFAULT 'info',
    created_by VARCHAR(255),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- User Roles Table
CREATE TABLE user_roles (
    user_id VARCHAR(255) PRIMARY KEY,
    role_type VARCHAR(50) NOT NULL, -- super_admin, manager, engineer, operator, inspector
    permissions TEXT, -- JSON string of permissions
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Sample Data
INSERT INTO user_roles (user_id, role_type) VALUES 
('sandscreencp@outlook.com', 'super_admin'),
('user1@company.com', 'manager'),
('user2@company.com', 'engineer');
```

## ⚡ Phase 3: Azure Functions Enhancement (30 minutes)

### Step 3.1: Update package.json
```json
{
  "name": "manufacturing-functions",
  "version": "1.0.0",
  "dependencies": {
    "@azure/functions": "^4.0.0",
    "@azure/web-pubsub": "^1.1.2",
    "@azure/storage-blob": "^12.17.0",
    "tedious": "^16.7.1",
    "pdfmake": "^0.2.7"
  }
}
```

### Step 3.2: WebPubSub Negotiate Function
Create `negotiate/function.json`:
```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["post", "get"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

Create `negotiate/index.js`:
```javascript
const { WebPubSubServiceClient } = require('@azure/web-pubsub');

module.exports = async function (context, req) {
    try {
        const serviceClient = new WebPubSubServiceClient(
            process.env.WebPubSubConnectionString, 
            'manufacturing'
        );
        
        const userId = req.headers['x-user-id'] || 'anonymous';
        const userRole = req.headers['x-user-role'] || 'operator';
        
        const token = await serviceClient.getClientAccessToken({
            userId: userId,
            roles: [`webpubsub.joinLeaveGroup.manufacturing.${userRole}`],
            expirationTimeInMinutes: 60
        });
        
        context.res = {
            status: 200,
            body: {
                url: token.url,
                accessToken: token.token
            }
        };
    } catch (error) {
        context.log.error('Negotiate error:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to negotiate connection' }
        };
    }
};
```

### Step 3.3: Enhanced Job Creation Function
Update your existing `createJob/index.js`:
```javascript
const { Connection, Request } = require('tedious');
const { WebPubSubServiceClient } = require('@azure/web-pubsub');

module.exports = async function (context, req) {
    const serviceClient = new WebPubSubServiceClient(
        process.env.WebPubSubConnectionString, 
        'manufacturing'
    );
    
    try {
        const jobData = {
            id: req.body.id || generateGuid(),
            jobNumber: req.body.jobNumber,
            title: req.body.title,
            status: 'draft',
            createdBy: req.body.createdBy,
            createdAt: new Date().toISOString()
        };
        
        // Save to database
        await saveJobToDatabase(jobData);
        
        // Broadcast to all connected users
        await serviceClient.sendToAll({
            type: 'jobCreated',
            data: jobData
        }, {
            contentType: 'application/json'
        });
        
        context.res = {
            status: 200,
            body: { success: true, job: jobData }
        };
        
    } catch (error) {
        context.log.error('Error creating job:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to create job' }
        };
    }
};

async function saveJobToDatabase(jobData) {
    const config = {
        server: process.env.SQL_SERVER,
        authentication: {
            type: 'default',
            options: {
                userName: process.env.SQL_USERNAME,
                password: process.env.SQL_PASSWORD
            }
        },
        options: {
            database: process.env.SQL_DATABASE,
            encrypt: true
        }
    };
    
    const connection = new Connection(config);
    
    return new Promise((resolve, reject) => {
        connection.on('connect', (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            const query = `
                INSERT INTO manufacturing_jobs (id, job_number, title, status, created_by, created_at)
                VALUES (@id, @jobNumber, @title, @status, @createdBy, @createdAt)
            `;
            
            const request = new Request(query, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
                connection.close();
            });
            
            request.addParameter('id', 'UniqueIdentifier', jobData.id);
            request.addParameter('jobNumber', 'VarChar', jobData.jobNumber);
            request.addParameter('title', 'VarChar', jobData.title);
            request.addParameter('status', 'VarChar', jobData.status);
            request.addParameter('createdBy', 'VarChar', jobData.createdBy);
            request.addParameter('createdAt', 'DateTime2', new Date(jobData.createdAt));
            
            connection.execSql(request);
        });
        
        connection.connect();
    });
}

function generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
```

### Step 3.4: Production Step Update Function
Create `updateProductionStep/function.json`:
```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["put"]
    },
    {
      "type": "http",
      "direction": "out", 
      "name": "res"
    }
  ]
}
```

Create `updateProductionStep/index.js`:
```javascript
const { Connection, Request } = require('tedious');
const { WebPubSubServiceClient } = require('@azure/web-pubsub');

module.exports = async function (context, req) {
    const serviceClient = new WebPubSubServiceClient(
        process.env.WebPubSubConnectionString, 
        'manufacturing'
    );
    
    try {
        const { stepId, status, completedBy } = req.body;
        
        // Update in database
        await updateStepInDatabase(stepId, status, completedBy);
        
        // Get job ID for broadcasting
        const stepData = await getStepData(stepId);
        
        // Broadcast update to all users
        await serviceClient.sendToAll({
            type: 'stepUpdated',
            data: {
                stepId: stepId,
                jobId: stepData.jobId,
                status: status,
                completedBy: completedBy,
                completedAt: new Date().toISOString()
            }
        }, {
            contentType: 'application/json'
        });
        
        context.res = {
            status: 200,
            body: { success: true }
        };
        
    } catch (error) {
        context.log.error('Error updating step:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to update step' }
        };
    }
};

async function updateStepInDatabase(stepId, status, completedBy) {
    const config = {
        server: process.env.SQL_SERVER,
        authentication: {
            type: 'default',
            options: {
                userName: process.env.SQL_USERNAME,
                password: process.env.SQL_PASSWORD
            }
        },
        options: {
            database: process.env.SQL_DATABASE,
            encrypt: true
        }
    };
    
    const connection = new Connection(config);
    
    return new Promise((resolve, reject) => {
        connection.on('connect', (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            const query = `
                UPDATE production_steps 
                SET status = @status, completed_by = @completedBy, completed_at = @completedAt
                WHERE id = @stepId
            `;
            
            const request = new Request(query, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
                connection.close();
            });
            
            request.addParameter('stepId', 'UniqueIdentifier', stepId);
            request.addParameter('status', 'VarChar', status);
            request.addParameter('completedBy', 'VarChar', completedBy);
            request.addParameter('completedAt', 'DateTime2', new Date());
            
            connection.execSql(request);
        });
        
        connection.connect();
    });
}

async function getStepData(stepId) {
    const config = {
        server: process.env.SQL_SERVER,
        authentication: {
            type: 'default',
            options: {
                userName: process.env.SQL_USERNAME,
                password: process.env.SQL_PASSWORD
            }
        },
        options: {
            database: process.env.SQL_DATABASE,
            encrypt: true
        }
    };
    
    const connection = new Connection(config);
    
    return new Promise((resolve, reject) => {
        connection.on('connect', (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            const query = `
                SELECT job_id, step_number, description, status
                FROM production_steps 
                WHERE id = @stepId
            `;
            
            const request = new Request(query, (err) => {
                if (err) {
                    reject(err);
                } else {
                    connection.close();
                }
            });
            
            let stepData = null;
            request.on('row', (columns) => {
                stepData = {
                    jobId: columns[0].value,
                    stepNumber: columns[1].value,
                    description: columns[2].value,
                    status: columns[3].value
                };
            });
            
            request.on('requestCompleted', () => {
                if (stepData) {
                    resolve(stepData);
                } else {
                    reject(new Error('Step not found'));
                }
            });
            
            request.addParameter('stepId', 'UniqueIdentifier', stepId);
            
            connection.execSql(request);
        });
        
        connection.connect();
    });
}
```

### Step 3.6: Get Jobs Function (Required for Dashboard)
Create `getJobs/function.json`:
```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

Create `getJobs/index.js`:
```javascript
const { Connection, Request } = require('tedious');

module.exports = async function (context, req) {
    try {
        const jobs = await getJobsFromDatabase();
        
        context.res = {
            status: 200,
            body: jobs
        };
        
    } catch (error) {
        context.log.error('Error getting jobs:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to get jobs' }
        };
    }
};

async function getJobsFromDatabase() {
    const config = {
        server: process.env.SQL_SERVER,
        authentication: {
            type: 'default',
            options: {
                userName: process.env.SQL_USERNAME,
                password: process.env.SQL_PASSWORD
            }
        },
        options: {
            database: process.env.SQL_DATABASE,
            encrypt: true
        }
    };
    
    const connection = new Connection(config);
    
    return new Promise((resolve, reject) => {
        connection.on('connect', (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            const query = `
                SELECT id, job_number, title, status, created_by, created_at, updated_at
                FROM manufacturing_jobs 
                ORDER BY created_at DESC
            `;
            
            const request = new Request(query, (err) => {
                if (err) {
                    reject(err);
                } else {
                    connection.close();
                }
            });
            
            const jobs = [];
            request.on('row', (columns) => {
                jobs.push({
                    id: columns[0].value,
                    jobNumber: columns[1].value,
                    title: columns[2].value,
                    status: columns[3].value,
                    createdBy: columns[4].value,
                    createdAt: columns[5].value,
                    updatedAt: columns[6].value
                });
            });
            
            request.on('requestCompleted', () => {
                resolve(jobs);
            });
            
            connection.execSql(request);
        });
        
        connection.connect();
    });
}
Create `generatePDF/function.json`:
```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["post"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

Create `generatePDF/index.js`:
```javascript
const PDFDocument = require('pdfmake/build/pdfmake');
const { WebPubSubServiceClient } = require('@azure/web-pubsub');

module.exports = async function (context, req) {
    const serviceClient = new WebPubSubServiceClient(
        process.env.WebPubSubConnectionString, 
        'manufacturing'
    );
    
    try {
        const { jobId, formData, templateType } = req.body;
        
        // Generate PDF content based on template
        const docDefinition = generateManufacturingPDF(jobId, formData, templateType);
        
        const pdfDoc = PDFDocument.createPdf(docDefinition);
        const pdfBuffer = await generatePdfBuffer(pdfDoc);
        
        // Save to blob storage (implement your storage logic)
        const pdfUrl = await savePdfToBlob(pdfBuffer, jobId);
        
        // Notify all users that PDF is ready
        await serviceClient.sendToAll({
            type: 'pdfGenerated',
            data: {
                jobId: jobId,
                pdfUrl: pdfUrl,
                templateType: templateType,
                generatedAt: new Date().toISOString()
            }
        }, {
            contentType: 'application/json'
        });
        
        context.res = {
            status: 200,
            body: { 
                success: true, 
                pdfUrl: pdfUrl 
            }
        };
        
    } catch (error) {
        context.log.error('PDF generation error:', error);
        context.res = {
            status: 500,
            body: { error: 'PDF generation failed' }
        };
    }
};

function generateManufacturingPDF(jobId, formData, templateType) {
    return {
        content: [
            { text: 'Manufacturing Quality Report', style: 'header' },
            { text: `Job ID: ${jobId}`, style: 'subheader' },
            { text: `Template: ${templateType}`, style: 'subheader' },
            { text: `Generated: ${new Date().toLocaleDateString()}`, style: 'subheader' },
            { text: '\n' },
            
            // Form data table
            {
                table: {
                    headerRows: 1,
                    widths: ['*', '*'],
                    body: [
                        ['Field', 'Value'],
                        ...Object.entries(formData).map(([key, value]) => [key, value])
                    ]
                }
            }
        ],
        styles: {
            header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
            subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
        }
    };
}

async function generatePdfBuffer(pdfDoc) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        pdfDoc.on('data', chunk => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', reject);
        pdfDoc.end();
    });
}

async function savePdfToBlob(pdfBuffer, jobId) {
    const { BlobServiceClient } = require('@azure/storage-blob');
    
    // Initialize blob service client
    const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    
    const containerName = 'manufacturing-pdfs';
    const blobName = `${jobId}-${Date.now()}.pdf`;
    
    try {
        // Get container client
        const containerClient = blobServiceClient.getContainerClient(containerName);
        
        // Create container if it doesn't exist
        await containerClient.createIfNotExists({
            access: 'blob'
        });
        
        // Get block blob client
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        // Upload PDF buffer
        await blockBlobClient.upload(pdfBuffer, pdfBuffer.length, {
            blobHTTPHeaders: {
                blobContentType: 'application/pdf'
            }
        });
        
        // Return public URL
        return `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${containerName}/${blobName}`;
        
    } catch (error) {
        console.error('Error saving PDF to blob:', error);
        throw new Error('Failed to save PDF to storage');
    }
}
```

## 🎨 Phase 4: React Frontend Enhancement (45 minutes)

### Step 4.1: Install Dependencies
```bash
npm install @azure/web-pubsub-client
```

### Step 4.2: Create WebPubSub Hook
Create `src/hooks/useWebPubSub.js`:
```javascript
import { useState, useEffect, useRef } from 'react';
import { WebPubSubClient } from '@azure/web-pubsub-client';

export const useWebPubSub = (userId, userRole) => {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const clientRef = useRef(null);
    
    useEffect(() => {
        const connectToWebPubSub = async () => {
            try {
                // Get connection token from negotiate function
                const response = await fetch('/api/negotiate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': userId,
                        'x-user-role': userRole
                    }
                });
                
                const { url } = await response.json();
                
                // Create WebPubSub client
                const client = new WebPubSubClient(url);
                clientRef.current = client;
                
                // Event handlers
                client.on('connected', () => {
                    console.log('Connected to Manufacturing Hub');
                    setIsConnected(true);
                });
                
                client.on('disconnected', () => {
                    console.log('Disconnected from Manufacturing Hub');
                    setIsConnected(false);
                });
                
                client.on('server-message', (e) => {
                    const message = JSON.parse(e.message.data);
                    setMessages(prev => [...prev, { ...message, timestamp: Date.now() }]);
                });
                
                // Connect
                await client.start();
                
            } catch (error) {
                console.error('WebPubSub connection error:', error);
            }
        };
        
        if (userId && userRole) {
            connectToWebPubSub();
        }
        
        // Cleanup
        return () => {
            if (clientRef.current) {
                clientRef.current.stop();
            }
        };
    }, [userId, userRole]);
    
    const sendMessage = async (message) => {
        if (clientRef.current && isConnected) {
            await clientRef.current.sendEvent('message', message, 'json');
        }
    };
    
    return {
        isConnected,
        messages,
        sendMessage
    };
};
```

### Step 4.3: Main Manufacturing Component
Create `src/components/ManufacturingDashboard.js`:
```javascript
import React, { useState, useEffect } from 'react';
import { useWebPubSub } from '../hooks/useWebPubSub';

const ManufacturingDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [user] = useState({ 
        id: 'sandscreencp@outlook.com', 
        role: 'super_admin' 
    });
    const [notifications, setNotifications] = useState([]);
    
    // WebPubSub connection
    const { isConnected, messages } = useWebPubSub(user.id, user.role);
    
    // Load initial jobs
    useEffect(() => {
        const loadJobs = async () => {
            try {
                const response = await fetch('/api/getJobs');
                const jobsData = await response.json();
                setJobs(jobsData);
            } catch (error) {
                console.error('Error loading jobs:', error);
            }
        };
        
        loadJobs();
    }, []);
    
    // Handle real-time messages
    useEffect(() => {
        messages.forEach(message => {
            switch (message.type) {
                case 'jobCreated':
                    setJobs(prev => [...prev, message.data]);
                    addNotification(`New job created: ${message.data.title}`, 'success');
                    break;
                    
                case 'stepUpdated':
                    setJobs(prev => prev.map(job => 
                        job.id === message.data.jobId 
                            ? { ...job, lastUpdated: message.data.completedAt }
                            : job
                    ));
                    addNotification(`Production step updated for job ${message.data.jobId}`, 'info');
                    break;
                    
                case 'pdfGenerated':
                    addNotification(`PDF ready for job ${message.data.jobId}`, 'success');
                    break;
                    
                default:
                    break;
            }
        });
    }, [messages]);
    
    const createJob = async () => {
        const jobData = {
            jobNumber: `JOB-${Date.now()}`,
            title: `Manufacturing Job ${Date.now()}`,
            createdBy: user.id
        };
        
        try {
            await fetch('/api/createJob', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobData)
            });
            
            // Job will be added via WebPubSub message
            
        } catch (error) {
            console.error('Error creating job:', error);
            addNotification('Failed to create job', 'error');
        }
    };
    
    const updateProductionStep = async (stepId, status) => {
        try {
            await fetch('/api/updateProductionStep', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stepId,
                    status,
                    completedBy: user.id
                })
            });
            
            // Update will be reflected via WebPubSub message
            
        } catch (error) {
            console.error('Error updating step:', error);
            addNotification('Failed to update production step', 'error');
        }
    };
    
    const generatePDF = async (jobId) => {
        try {
            const formData = {
                inspector: user.id,
                inspectionDate: new Date().toISOString(),
                qualityScore: '95%',
                notes: 'Quality inspection completed successfully'
            };
            
            await fetch('/api/generatePDF', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId,
                    formData,
                    templateType: 'quality-inspection'
                })
            });
            
            // PDF ready notification will come via WebPubSub
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            addNotification('Failed to generate PDF', 'error');
        }
    };
    
    const addNotification = (message, type) => {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date().toLocaleTimeString()
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 4)]);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
    };
    
    return (
        <div className="manufacturing-dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <h1>Manufacturing Dashboard</h1>
                <div className="header-status">
                    <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? '🟢 Live' : '🔴 Offline'}
                    </span>
                    <span className="user-info">{user.role} | {user.id}</span>
                </div>
            </header>
            
            {/* Notifications */}
            <div className="notifications">
                {notifications.map(notification => (
                    <div key={notification.id} className={`notification ${notification.type}`}>
                        <span className="notification-time">{notification.timestamp}</span>
                        <span className="notification-message">{notification.message}</span>
                    </div>
                ))}
            </div>
            
            {/* Actions */}
            <div className="dashboard-actions">
                <button onClick={createJob} className="btn btn-primary">
                    Create New Job
                </button>
                <button onClick={() => window.location.reload()} className="btn btn-secondary">
                    Refresh Data
                </button>
            </div>
            
            {/* Jobs Grid */}
            <div className="jobs-grid">
                {jobs.map(job => (
                    <div key={job.id} className="job-card">
                        <div className="job-header">
                            <h3>{job.title}</h3>
                            <span className={`job-status ${job.status}`}>{job.status}</span>
                        </div>
                        <div className="job-details">
                            <p><strong>Job Number:</strong> {job.jobNumber}</p>
                            <p><strong>Created By:</strong> {job.createdBy}</p>
                            <p><strong>Created:</strong> {new Date(job.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="job-actions">
                            <button 
                                onClick={() => updateProductionStep(job.id + '-step1', 'completed')}
                                className="btn btn-sm btn-success"
                            >
                                Complete Step
                            </button>
                            <button 
                                onClick={() => generatePDF(job.id)}
                                className="btn btn-sm btn-info"
                            >
                                Generate PDF
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            {jobs.length === 0 && (
                <div className="empty-state">
                    <p>No manufacturing jobs found. Create one to get started!</p>
                </div>
            )}
        </div>
    );
};

export default ManufacturingDashboard;
```

### Step 4.4: Add CSS Styles
Create `src/styles/manufacturing.css`:
```css
.manufacturing-dashboard {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #e0e0e0;
}

.dashboard-header h1 {
    color: #333;
    margin: 0;
}

.header-status {
    display: flex;
    gap: 15px;
    align-items: center;
}

.connection-status {
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 12px;
    font-weight: bold;
}

.connection-status.connected {
    background-color: #d4edda;
    color: #155724;
}

.connection-status.disconnected {
    background-color: #f8d7da;
    color: #721c24;
}

.notifications {
    margin-bottom: 20px;
}

.notification {
    padding: 10px 15px;
    margin-bottom: 5px;
    border-radius: 5px;
    display: flex;
    justify-content: space-between;
    animation: slideIn 0.3s ease;
}

.notification.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.notification.info {
    background-color: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}

.notification.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.dashboard-actions {
    margin-bottom: 20px;
    display: flex;
    gap: 10px;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
}

.btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.btn-primary {
    background-color: #007bff;
    color: white;
}

.btn-secondary {
    background-color: #6c757d;
    color: white;
}

.btn-success {
    background-color: #28a745;
    color: white;
}

.btn-info {
    background-color: #17a2b8;
    color: white;
}

.btn-sm {
    padding: 5px 10px;
    font-size: 12px;
}

.jobs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.job-card {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 15px;
    background-color: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.2s;
}

.job-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.job-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.job-header h3 {
    margin: 0;
    color: #333;
}

.job-status {
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: bold;
    text-transform: uppercase;
}

.job-status.draft {
    background-color: #fff3cd;
    color: #856404;
}

.job-status.in-progress {
    background-color: #d1ecf1;
    color: #0c5460;
}

.job-status.completed {
    background-color: #d4edda;
    color: #155724;
}

.job-details p {
    margin: 5px 0;
    font-size: 14px;
    color: #666;
}

.job-actions {
    margin-top: 15px;
    display: flex;
    gap: 10px;
}

.empty-state {
    text-align: center;
    padding: 40px;
    color: #666;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .manufacturing-dashboard {
        padding: 10px;
    }
    
    .dashboard-header {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
    }
    
    .jobs-grid {
        grid-template-columns: 1fr;
    }
    
    .dashboard-actions {
        flex-direction: column;
    }
}
```

## 📱 Phase 5: Integration & Testing (30 minutes)

### Step 5.1: Update App.js
```javascript
import React from 'react';
import ManufacturingDashboard from './components/ManufacturingDashboard';
import './styles/manufacturing.css';

function App() {
    return (
        <div className="App">
            <ManufacturingDashboard />
        </div>
    );
}

export default App;
```

### Step 5.2: Environment Variables
Add to your Function App settings:
```bash
# Required settings - CLAUDE CODE: SET ALL THESE IN AZURE
SQL_SERVER=your-sql-server.database.windows.net
SQL_DATABASE=your-database-name
SQL_USERNAME=your-username
SQL_PASSWORD=your-password
WebPubSubConnectionString=your-webpubsub-connection-string
AZURE_STORAGE_CONNECTION_STRING=your-storage-connection-string
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name

# Command to set all at once:
az functionapp config appsettings set \
  --name "your-function-app" \
  --resource-group "your-existing-rg" \
  --settings \
    "SQL_SERVER=your-sql-server.database.windows.net" \
    "SQL_DATABASE=your-database-name" \
    "SQL_USERNAME=your-username" \
    "SQL_PASSWORD=your-password" \
    "WebPubSubConnectionString=your-webpubsub-connection-string" \
    "AZURE_STORAGE_CONNECTION_STRING=your-storage-connection-string" \
    "AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name"
```

### Step 5.3: Local Testing
```bash
# Test Functions locally
cd your-function-app
func start

# Test React app
cd your-react-app
npm start
```

## 🚀 Phase 6: Deployment (CLAUDE CODE: EXECUTE ALL COMMANDS)

### Step 6.1: Create Storage Account (Required for PDF storage)
```bash
# CLAUDE CODE: RUN THIS COMMAND
az storage account create \
  --name "manufacturingstorage$(date +%s)" \
  --resource-group "your-existing-rg" \
  --location "East US" \
  --sku Standard_LRS \
  --kind StorageV2

# Get storage connection string
az storage account show-connection-string \
  --name "manufacturingstorage$(date +%s)" \
  --resource-group "your-existing-rg" \
  --query connectionString \
  --output tsv
```

### Step 6.2: Deploy Functions
```bash
# CLAUDE CODE: RUN THIS COMMAND
func azure functionapp publish your-function-app-name
```

### Step 6.3: Deploy React App
```bash
# CLAUDE CODE: RUN THESE COMMANDS
npm run build
# Use your existing Static Web Apps deployment process
```

### Step 6.4: Create Sample Data (CLAUDE CODE: RUN THIS SQL)
```sql
-- Insert sample manufacturing jobs
INSERT INTO manufacturing_jobs (id, job_number, title, status, created_by, created_at) VALUES 
(NEWID(), 'JOB-001', 'Widget Assembly Line A', 'in-progress', 'sandscreencp@outlook.com', GETDATE()),
(NEWID(), 'JOB-002', 'Quality Check Batch 101', 'draft', 'manager@company.com', GETDATE()),
(NEWID(), 'JOB-003', 'Final Inspection Round 1', 'completed', 'inspector@company.com', GETDATE());

-- Insert sample production steps
DECLARE @jobId1 uniqueidentifier = (SELECT TOP 1 id FROM manufacturing_jobs WHERE job_number = 'JOB-001');
DECLARE @jobId2 uniqueidentifier = (SELECT TOP 1 id FROM manufacturing_jobs WHERE job_number = 'JOB-002');

INSERT INTO production_steps (id, job_id, step_number, description, status, assigned_to) VALUES 
(NEWID(), @jobId1, 1, 'Prepare materials', 'completed', 'operator1@company.com'),
(NEWID(), @jobId1, 2, 'Assembly process', 'in-progress', 'operator2@company.com'),
(NEWID(), @jobId1, 3, 'Quality check', 'pending', 'inspector@company.com'),
(NEWID(), @jobId2, 1, 'Setup equipment', 'pending', 'engineer@company.com');
```

### Step 6.3: Verify Deployment
1. Check Azure portal for all services running
2. Test real-time features with multiple browser tabs
3. Verify database connections
4. Test PDF generation

## ✅ Success Criteria

After implementation, you should have:

- ✅ Real-time job creation visible to all users instantly
- ✅ Live production step updates broadcasting automatically  
- ✅ PDF generation notifications for all connected users
- ✅ 100 concurrent connection capacity (room for growth)
- ✅ Role-based user management system
- ✅ Manufacturing dashboard with live analytics
- ✅ **Total monthly cost: $40** (no additional charges)

## 🔧 Troubleshooting

### Common Issues:

**Connection Issues:**
- Verify WebPubSub connection string in Function App settings
- Check CORS settings for Static Web Apps
- Ensure negotiate function is accessible

**Database Issues:**
- Verify SQL connection string and credentials
- Check if new tables were created successfully
- Ensure proper firewall rules for Azure SQL

**Real-time Issues:**
- Check browser console for WebSocket errors
- Verify message format in Functions
- Test with multiple browser tabs

## 📊 Monitoring & Analytics

### Set up Application Insights:
```bash
# Add to Function App
az monitor app-insights component create \
  --app "manufacturing-insights" \
  --location "East US" \
  --resource-group "your-rg"
```

### Key Metrics to Monitor:
- WebPubSub connection count
- Message volume per hour
- Function execution times
- Database query performance
- PDF generation success rate

Azure Database for PostgreSQL flexible server endpoint  nizam-cp.postgres.database.azure.com
Function App -cpbackend cpbackend-f8exacd4c3adh8c6.malaysiawest-01.azurewebsites.net
static web app https://gentle-pebble-04ad45800.1.azurestaticapps.net

claude can access to my azure CLI
---

**Ready to implement? Start with Phase 1 and work through each phase systematically. Each phase builds on the previous one, so complete them in order for best results.**