# Manager App

A comprehensive management application built with React + Express SSR in TypeScript, featuring staff management, property management, and administrative functions with Prisma ORM and MySQL database integration.

## Features

- **Authentication System**: Secure login with JWT tokens and session management
- **Database Integration**: Prisma ORM with MySQL for type-safe database operations
- **Localization**: Dynamic language switching (English/Japanese)
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Server-Side Rendering**: Express SSR with React 18 for optimal performance
- **Modern Stack**: React 18, TypeScript, React Native Web, Prisma ORM

## Tech Stack

- **Frontend**: React 18, TypeScript, React Native Web, Tailwind CSS, Radix UI
- **Backend**: Express.js, Prisma ORM, MySQL 8.0, JWT Authentication
- **Database**: MySQL 8.0 with Prisma migrations and seeding
- **Build Tools**: Webpack, SWC, PostCSS
- **Testing**: Jest, React Testing Library, Supertest

## Platform-Specific Setup

- **Windows Users**: See [WINDOWS-SETUP.md](./WINDOWS-SETUP.md) for Windows-specific instructions and troubleshooting
- **macOS/Linux**: Follow the standard setup instructions below
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

## Getting Started

### Prerequisites

- **Node.js**: Version 18.0 or higher
- **MySQL**: Version 8.0 or higher (running on port 3307)
- **npm**: Version 8.0 or higher

### Quick Setup

1. **Install dependencies and start development**:
   ```bash
   npm install
   npm run dev
   ```

2. **Setup MySQL database** (if not already done):
   ```sql
   CREATE DATABASE manager_app_db;
   ```

3. **Configure environment** (if `.env` doesn't exist):
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

The system will automatically:
- Generate Prisma client
- Run database migrations
- Seed the database with test data
- Start both frontend and backend servers

## Windows-Specific Commands

### Prisma Operations

- `npm run prisma:clean` - Safely remove Prisma client files
- `npm run prisma:generate:safe` - Generate Prisma client with Windows optimizations
- `npm run prisma:generate:force` - Force regenerate (if stuck)
- `npm run prisma:migrate:safe` - Run migrations safely
- `npm run prisma:seed:safe` - Seed database safely

#

## Development Setup

After cloning and installing dependencies:

```bash
npm install  # Sets up Prisma client and environment
npm run dev  # Start both server and client together
```

The post-install script will:
- Generate Prisma client
- Create .env file if missing
- Prepare development environment

## Troubleshooting

### Proxy Connection Issues After Fresh `npm install`

If you encounter `[HPM] Error occurred while proxying request localhost:3000/api/auth/login to http://127.0.0.1:3001/ [ECONNREFUSED]` after deleting `node_modules` and running `npm install`:

**Root Cause**: The webpack dev server (client) tries to connect to the Express server (backend) before it's ready.

**Solution**:

```bash
npm install  # Sets up environment (does NOT start server)
npm run dev  # Starts server first, then client (FIXED)
```

The `npm run dev` command now:
1. Starts the Express server on port 3001
2. Waits for server to be ready and responding
3. Then starts the webpack dev server on port 3000
4. Client proxy connects successfully to running server

**Alternative Commands**:
- `npm run dev:server` - Start server only (port 3001)
- `npm run dev:client` - Start client only (port 3000)
- `npm run dev:concurrent` - Start both simultaneously (old behavior)

**Verification**:
- Server health: http://127.0.0.1:3001/api/health
- Client app: http://localhost:3000
- Check server status: `npm run dev:server:check`

### EPERM Errors

If you encounter "operation not permitted" errors:

1. **Close all Node.js processes:**

   ```powershell
   Get-Process node | Stop-Process -Force
   ```

2. **Clean and regenerate:**

   ```bash
   npm run prisma:clean
   npm run prisma:generate:force
   ```

3. **If still failing, use manual cleanup:**
   ```powershell
   # In PowerShell as Administrator
   Remove-Item -Path "node_modules\.prisma" -Recurse -Force
   npm run prisma:generate
   ```

For comprehensive troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

5. **Start development servers**:
   ```bash
   npm run dev
   ```

This will start:

- Client development server on http://localhost:3000
- API server on http://localhost:3001

### Test Credentials

- **Admin**: `admin` / `admin123`
- **User**: `user` / `user123`

### Available Scripts

#### Development

- `npm run dev` - Start both client and server in development mode
- `npm run dev:server` - Start server only (port 3001)
- `npm run dev:client` - Start client only (port 3000)
- `npm run dev:safe` - Start development with server status check
- `npm run dev:client:safe` - Start client with server status check
- `npm run dev:server:check` - Check if development server is running
- `npm run dev:fresh` - Fresh start with Prisma generation

#### Database

- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with sample data
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:reset` - Reset database and run migrations
- `npm run db:reset-and-seed` - Complete database reset with seeding

#### Build & Deploy

- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run verify:build` - Verify build integrity

#### Testing

- `npm test` - Run all tests
- `npm run test:server` - Run server-side tests
- `npm run test:client` - Run client-side tests
- `npm run test:coverage` - Run tests with coverage report

#### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking

#### Migration & Data

- `npm run migrate:sqlite-to-mysql` - Migrate from SQLite to MySQL
- `npm run verify:migration` - Verify migration integrity

## Project Structure

```
manager-app/
├── src/
│   ├── client/              # React client-side code
│   │   ├── components/      # UI components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/           # Page components
│   │   └── services/        # API client services
│   ├── server/              # Express server code
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   ├── services/        # Business logic layer
│   │   └── utils/           # Server utilities
│   ├── shared/              # Shared types and utilities
│   │   ├── types/           # TypeScript definitions
│   │   └── utils/           # Shared utility functions
│   └── setupTests.ts        # Test configuration
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Migration files
│   └── seed.ts              # Database seeding
├── scripts/                 # Utility scripts
├── uploads/                 # File upload storage
└── dist/                    # Built application
```

## Key Features

### Database Integration

- **Prisma ORM**: Type-safe database operations with auto-generated types
- **MySQL 8.0**: Production-ready database with proper indexing
- **Migrations**: Automated schema management and versioning
- **Seeding**: Comprehensive test data for all administrative roles

### Development Experience

- **Hot Module Replacement**: Fast development with instant updates
- **Type Safety**: End-to-end TypeScript from database to UI
- **Code Splitting**: Optimized bundles for better performance
- **SSR Integration**: Server-side rendering with Prisma data fetching

### Architecture

- **Standalone SSR**: Self-contained React + Express application
- **Service Layer**: Clean separation of business logic
- **Error Handling**: Comprehensive error management and recovery
- **Performance**: Optimized queries and caching strategies

## Documentation

- **[Development Guide](DEVELOPMENT.md)**: Complete setup and development instructions
- **[Deployment Guide](DEPLOYMENT.md)**: Production deployment procedures
- **[Migration Guide](MIGRATION_GUIDE.md)**: SQLite to MySQL migration process
- **[Database Seeding](DATABASE_SEEDING.md)**: Sample data and seeding procedures
- **[Troubleshooting](TROUBLESHOOTING.md)**: Common issues and solutions
- **[SSR + Prisma Patterns](SSR_PRISMA_PATTERNS.md)**: Integration patterns and best practices
- **[Error Handling](ERROR_HANDLING.md)**: Comprehensive error handling implementation
- **[Schema Mapping](SCHEMA_MAPPING.md)**: Database schema transformation details
