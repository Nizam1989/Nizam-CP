# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a complete Manufacturing Tracking System built with React, TypeScript, and Azure Functions. It's a production-ready application for Completion Products Pte.Ltd managing manufacturing jobs, quality control, and dossier generation with real-time updates.

## Repository Structure

### Frontend (`./project/`)
- **Framework**: React 18 with TypeScript and Vite
- **Production URL**: https://gentle-pebble-04ad45800.1.azurestaticapps.net
- **Environment**: Uses production API endpoints

### Backend (`./azure-functions-production/`)
- **Runtime**: Azure Functions v1 programming model (function.json)
- **Production URL**: https://cpbackend5.azurewebsites.net/api
- **Database**: Azure SQL Server (nizam-cp-sql.database.windows.net)
- **Working Endpoints**: ping, getJobs, createJob, updateStep, getUpdates, generatePDF

### Legacy/Development Code
- `./azure-functions/`: Development functions (not used in production)
- `./local-api-server/`: Local Node.js server (not used in production)

## Development Commands

### Frontend Development
```bash
cd project
npm install
npm run dev      # Development server at localhost:5173
npm run build    # Production build to dist/
npm run lint     # ESLint checking
npm run preview  # Preview production build
```

### Azure Functions Development
```bash
cd azure-functions-production
npm install
func start       # Local development
func azure functionapp publish cpbackend5  # Deploy to production
```

### Database Operations
```bash
# Initialize database with schema and sample data
node setup-database.js
```

## Architecture

### Production System Architecture
1. **React Frontend** → **Azure Static Web Apps** → **GitHub Actions CI/CD**
2. **Azure Functions** → **Azure SQL Database** → **Azure Blob Storage**
3. **Real-time Updates** via polling mechanism (3-second intervals)

### Key Architectural Patterns
- **API-First Design**: All data operations through REST endpoints, no localStorage
- **Real-time Polling**: `useRealTimeUpdates` hook polls `/getUpdates` endpoint
- **Protected Authentication Flow**: JWT-based auth with role-based access control
- **Manufacturing Workflow**: Multi-step job tracking with quality notifications
- **PDF Generation**: Automated reports stored in Azure Blob Storage

### Current Backend Implementation Status
**✅ FULLY IMPLEMENTED:**
- ✅ Job management (create, list, track progress)
- ✅ Manufacturing steps (update completion status)
- ✅ System updates (real-time change tracking)
- ✅ PDF generation (with Azure Blob Storage URLs)
- ✅ Database connectivity with proper error handling

**❌ NOT IMPLEMENTED (Mock/Placeholder):**
- ❌ Authentication endpoints (signIn, signUp, getCurrentUser)
- ❌ User management system
- ❌ Quality notification CRUD operations
- ❌ Analytics and reporting endpoints

## Database Schema
Live Azure SQL Database with tables:
- `manufacturing_jobs`: Job tracking with status and progress
- `production_steps`: Multi-step workflow tracking
- `system_updates`: Real-time change log for polling
- `pdf_reports`: Generated report metadata
- `user_roles`: User management (structure exists, auth not implemented)
- `quality_notifications`: Issue tracking (structure exists, CRUD not implemented)

## Environment Configuration

### Production Environment
```bash
# Frontend (.env.production)
VITE_API_BASE_URL=https://cpbackend5.azurewebsites.net/api
VITE_APP_NAME=Manufacturing Tracking System
NODE_ENV=production

# Azure Functions (local.settings.json)
SQL_SERVER=nizam-cp-sql.database.windows.net
SQL_USERNAME=sandscreen
SQL_PASSWORD=ManufacturingSQL2024!
SQL_DATABASE=manufacturing
```

## Critical Implementation Details

### Azure Functions v1 Pattern
All functions use function.json configuration files:
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

### Database Connection Pattern
```javascript
const { executeQuery, logSystemUpdate, uuidv4 } = require('../shared/database');

// All functions use this pattern for database operations
const result = await executeQuery(`
    SELECT * FROM manufacturing_jobs WHERE status = @param1
`, [statusValue]);
```

### Real-time Updates System
Frontend polls `/getUpdates` endpoint every 3 seconds for changes since last poll. All database modifications trigger `logSystemUpdate()` calls to track changes.

## Deployment Status
- **Frontend**: ✅ Deployed and operational
- **Backend**: ✅ All core endpoints working in production
- **Database**: ✅ Live with sample manufacturing data
- **Integration**: ✅ End-to-end functionality verified

## Authentication Implementation Gap
The system currently has a complete authentication UI but no backend implementation. To implement authentication:

1. Add authentication endpoints to Azure Functions
2. Implement user registration/approval workflow
3. Add JWT token validation middleware
4. Connect to existing `user_roles` database table

## Flow.md Integration
The repository contains flow.md with comprehensive implementation requirements. The current system implements polling-based real-time updates instead of the originally planned WebPubSub integration, as approved during development.

## Key Production URLs
- **Frontend**: https://gentle-pebble-04ad45800.1.azurestaticapps.net
- **API**: https://cpbackend5.azurewebsites.net/api
- **GitHub**: https://github.com/Nizam1989/Nizam-CP
- **Database**: nizam-cp-sql.database.windows.net
- **Storage**: nizamcpstorage44793.blob.core.windows.net