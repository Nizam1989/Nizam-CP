# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a Manufacturing Tracking System built with React, TypeScript, and Vite. It's a production-ready application for managing manufacturing jobs, quality control, and dossier generation in Azure Completion Products operations.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Tech Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom components
- **Routing**: React Router v7
- **PDF Generation**: jspdf and html2canvas
- **Icons**: Lucide React

### Core Application Structure
- **Authentication**: JWT-based authentication with protected routes via `AuthContext`
- **API Integration**: Centralized API service (`src/lib/api.ts`) with async operations replacing localStorage
- **Data Layer**: Abstract data service (`src/lib/dataService.ts`) handles all backend communication
- **Error Handling**: Global ErrorBoundary components with user-friendly error states
- **State Management**: React Context for authentication, component-level state for features

### Key Architectural Patterns
1. **Protected Routes**: All main routes require authentication through `ProtectedRoute` wrapper
2. **API-First Design**: All data operations go through the API service layer - no localStorage for production data
3. **Component Organization**: Features grouped by domain (Jobs, Dossier, QualityNotification, etc.)
4. **Reusable UI Components**: Shared components in `src/components/ui/`

## Backend Integration Requirements

The application expects a backend API at the URL specified in `VITE_API_BASE_URL` environment variable.

Required API endpoints include:
- Authentication: `/api/auth/*` (signin, signup, signout, me)
- Users: `/api/users/*` (CRUD operations with approval workflow)
- Jobs: `/api/jobs/*` (job management and manufacturing steps)
- Quality Notifications: `/api/quality-notifications/*`
- Analytics & Reports: `/api/analytics`, `/api/reports`
- Settings: `/api/settings`

See `PRODUCTION_READY.md` for complete API specification.

## Environment Configuration

Create a `.env` file with:
```bash
VITE_API_BASE_URL=https://your-api-domain.com/api  # Required
```

## Important Implementation Notes

1. **No Test Framework**: Currently no test setup. Consider adding Vitest for unit tests.
2. **TypeScript Path Alias**: Use `@/` to import from `src/` directory
3. **Production Build**: Uses Vite's optimized production build with code splitting
4. **PDF Generation**: Custom PDF generators in `src/utils/` for dossiers and reports
5. **Authentication Flow**: Token stored in memory, automatic refresh handling implemented

## Key Features
- Manufacturing job tracking with multi-step workflows
- Quality notification system for issue tracking
- Automated dossier generation with PDF export
- User management with approval workflows
- Real-time analytics dashboard
- Configurable system settings