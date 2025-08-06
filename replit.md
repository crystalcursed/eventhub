# replit.md

## Overview

EventHub is a full-stack Local Community Event Aggregator web application that enables users to discover, create, and manage local community events. The platform features user authentication, event management capabilities, and comprehensive browsing/filtering functionality. Built as a production-quality showcase project demonstrating modern full-stack development practices.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Shadcn/ui component library built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Authentication**: Context-based authentication with JWT token storage in localStorage
- **Theme System**: Custom dark/light theme provider with CSS variables

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful API with structured route organization
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **Middleware**: Custom request logging, error handling, and authentication middleware
- **Development Integration**: Vite middleware integration for seamless development experience

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database interactions
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Connection**: Neon Database serverless PostgreSQL integration
- **Development Storage**: In-memory storage implementation for development/testing

### Database Schema Design
- **Users Table**: Comprehensive user profiles with authentication data, bio, location, and online status
- **Categories Table**: Event categorization with color coding and URL-friendly slugs
- **Events Table**: Full event details including date/time, location, capacity management, and organizer relationships
- **Event Attendees Table**: Many-to-many relationship tracking event participation

### Authentication & Authorization
- **JWT Implementation**: Secure token-based authentication with configurable secret
- **Password Security**: bcrypt hashing with salt rounds for secure password storage
- **Route Protection**: Middleware-based authentication for protected endpoints
- **Session Management**: Token-based sessions with automatic expiration handling

### API Structure
- **Authentication Routes**: `/api/auth/*` for login, register, and token management
- **User Routes**: `/api/users/*` for profile management and user-specific data
- **Event Routes**: `/api/events/*` for CRUD operations and event interactions
- **Category Routes**: `/api/categories/*` for event categorization
- **Attendance Routes**: Event join/leave functionality with capacity management

### Frontend Component Architecture
- **Page Components**: Route-level components for major application sections
  - Home: Event browsing with search and filters
  - Login/Register: User authentication forms
  - Profile: User profile management with photo upload capability
  - CreateEvent/EditEvent: Event creation and editing forms
  - EventDetails: Detailed event view with join/leave functionality
  - MyEvents: User's created events management dashboard
- **UI Components**: Reusable Shadcn/ui components with consistent theming
- **Context Providers**: Authentication and theme management across the application
- **Custom Hooks**: Specialized hooks for mobile detection and toast notifications

## External Dependencies

### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight client-side routing
- **drizzle-orm**: Type-safe database ORM
- **@neondatabase/serverless**: PostgreSQL database connectivity

### UI & Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **lucide-react**: Consistent icon library

### Authentication & Security
- **bcrypt**: Password hashing and verification
- **jsonwebtoken**: JWT token creation and verification
- **connect-pg-simple**: PostgreSQL session store

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety and developer experience
- **eslint & prettier**: Code quality and formatting
- **drizzle-kit**: Database schema management and migrations

### Additional Libraries
- **date-fns**: Date manipulation and formatting
- **zod**: Runtime type validation and schema definition
- **react-hook-form**: Form state management and validation