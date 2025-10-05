# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Better-chatbot is a Next.js 15 AI chatbot application that supports multiple LLM providers (OpenAI, Anthropic, Google, xAI, Ollama, OpenRouter) with MCP (Model Context Protocol) integration, custom agents, visual workflows, and realtime voice chat.

**Tech Stack:**
- **Framework:** Next.js 15 (App Router, React 19, TypeScript)
- **Database:** PostgreSQL with Drizzle ORM
- **AI:** Vercel AI SDK with multi-provider support
- **Auth:** better-auth with OAuth support (Google, GitHub, Microsoft)
- **Storage:** Vercel Blob (default), S3 (planned)
- **MCP:** @modelcontextprotocol/sdk for tool integration
- **Testing:** Vitest (unit), Playwright (e2e)
- **Package Manager:** pnpm (required)

## Common Commands

### Development
```bash
pnpm dev                    # Start dev server with hot reload
pnpm dev:turbopack         # Dev with Turbopack (faster)
pnpm build                 # Production build
pnpm build:local           # Build without HTTPS (recommended for local)
pnpm start                 # Start production server
```

### Database
```bash
pnpm docker:pg             # Start local PostgreSQL in Docker
pnpm db:migrate            # Run database migrations
pnpm db:generate           # Generate migration files from schema
pnpm db:push               # Push schema changes directly to DB
pnpm db:studio             # Open Drizzle Studio (DB GUI)
pnpm db:reset              # Drop and recreate all tables
```

### Testing
```bash
pnpm test                  # Run unit tests (vitest)
pnpm test:watch            # Watch mode for unit tests
pnpm test:e2e              # Run all Playwright e2e tests
pnpm test:e2e:ui           # Run e2e tests with Playwright UI
pnpm test:e2e:seed         # Seed test users for e2e tests
pnpm test:e2e:clean        # Clean up all test data
pnpm playwright:install    # Install Playwright browsers
```

### Code Quality
```bash
pnpm lint                  # Run ESLint and Biome linters
pnpm lint:fix              # Auto-fix linting issues
pnpm format                # Format code with Biome
pnpm check-types           # TypeScript type checking
pnpm check                 # Run lint:fix + check-types + test
```

### Docker
```bash
pnpm docker-compose:up     # Start all services (app + PostgreSQL)
pnpm docker-compose:down   # Stop all services
pnpm docker-compose:logs   # View logs
pnpm docker:redis          # Start Redis (if needed)
```

### Running a Single Test
```bash
# Unit test
pnpm test src/lib/utils.test.ts

# E2E test
pnpm test:e2e tests/agents/agent-visibility.spec.ts
pnpm test:e2e tests/agents/agent-visibility.spec.ts --headed  # With browser UI
```

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (chat, mcp, agent, workflow, auth)
│   ├── (auth)/            # Auth pages (sign-in, sign-up)
│   ├── (chat)/            # Main chat UI and related pages
│   └── (public)/          # Public pages (export, share)
├── components/            # React components
│   └── ui/               # Shadcn UI components
├── lib/                   # Core business logic
│   ├── ai/               # AI-related code
│   │   ├── mcp/          # MCP client management and config storage
│   │   ├── tools/        # Built-in tools (code, http, web, visualization)
│   │   ├── agent/        # Agent logic
│   │   ├── workflow/     # Workflow execution engine
│   │   └── models.ts     # LLM provider configurations
│   ├── db/               # Database layer
│   │   ├── pg/           # PostgreSQL schema and queries
│   │   └── migrations/   # Drizzle migrations
│   ├── auth/             # Authentication logic
│   ├── file-storage/     # File upload/storage abstractions
│   └── utils.ts          # Shared utilities
├── hooks/                 # React hooks
├── types/                 # TypeScript type definitions
└── middleware.ts          # Next.js middleware (auth, i18n)

tests/                     # E2E tests (Playwright)
scripts/                   # Build and maintenance scripts
custom-mcp-server/         # Custom MCP server implementation
```

### Key Architectural Concepts

**MCP (Model Context Protocol) Integration:**
- MCP servers can be added via UI or file-based config (`FILE_BASED_MCP_CONFIG=true`)
- Two storage modes: database (`db-mcp-config-storage.ts`) or file-based (`fb-mcp-config-storage.ts`)
- MCP client manager (`create-mcp-clients-manager.ts`) handles connections and tool discovery
- MCP tools are exposed to LLMs alongside built-in tools

**Agent System:**
- Agents are AI assistants with custom instructions and tool access
- Stored in PostgreSQL (`AgentTable` in `schema.pg.ts`)
- Support visibility levels: `public`, `private`, `readonly`
- Can be invoked in chat using `@agent_name` mentions

**Workflow System:**
- Visual workflow builder using `@xyflow/react`
- Workflows consist of LLM nodes and Tool nodes
- Published workflows become callable tools via `@workflow_name`
- Stored in `WorkflowTable` with nodes and edges in separate tables

**Multi-LLM Support:**
- Provider configs in `src/lib/ai/models.ts`
- Uses Vercel AI SDK provider adapters
- Support for OpenAI-compatible endpoints via `create-openai-compatiable.ts`

**Authentication:**
- Uses `better-auth` library
- Supports email/password and OAuth (Google, GitHub, Microsoft)
- Session management with secure cookies
- User preferences stored in `UserTable.preferences` (JSON column)

**File Storage:**
- Abstracted via `src/lib/file-storage/` with driver pattern
- Default: Vercel Blob (`BLOB_READ_WRITE_TOKEN` required)
- S3 support in progress

### Database Schema

Key tables:
- `user` - User accounts and preferences
- `chat_thread` - Chat conversations
- `chat_message` - Individual messages with parts (text, tool calls, images)
- `agent` - Custom AI agents
- `mcp_server` - MCP server configurations
- `workflow` / `workflow_node` / `workflow_edge` - Workflow definitions
- `bookmark` - User bookmarks for agents/workflows/MCP servers

Schema location: `src/lib/db/pg/schema.pg.ts`

### Path Aliases

Configured in `tsconfig.json`:
- `@/*` → `src/*`
- `ui/*` → `src/components/ui/*`
- `auth/*` → `src/lib/auth/*`
- `app-types/*` → `src/types/*`
- `lib/*` → `src/lib/*`
- `logger` → `src/lib/logger.ts`
- `load-env` → `src/lib/load-env.ts`

## Important Notes

### Environment Variables
- `.env` is auto-generated on `pnpm i` (see `scripts/postinstall.ts`)
- At minimum, provide: `POSTGRES_URL`, `BETTER_AUTH_SECRET`, and one LLM API key
- For local dev with `pnpm build:local`, use `NO_HTTPS=1`

### Database Migrations
- Always run `pnpm db:migrate` after pulling changes
- Schema changes require `pnpm db:generate` to create migration files
- Use `pnpm db:push` for quick prototyping (skips migrations)

### Testing Requirements
- **E2E tests require:** PostgreSQL, LLM API key, `BETTER_AUTH_SECRET`
- Use `pnpm test:e2e:seed` to create test users before running e2e tests
- Clean up with `pnpm test:e2e:clean` after tests

### Pull Request Conventions
- PR titles MUST follow Conventional Commits format (enforced by release-please)
- Examples: `feat: add voice mode`, `fix: MCP tool calling`, `chore: update deps`
- Squash merge is used, so only PR title matters for changelog

### Code Quality
- Linting: ESLint + Biome (configured in `biome.json` and `.eslintrc.json`)
- Pre-commit hooks via Husky run `pnpm format` and `pnpm lint:fix`
- Always run `pnpm check` before submitting PRs

### Internationalization (i18n)
- Uses `next-intl` for translations
- Message files in `messages/` directory
- See `messages/language.md` for adding new languages

### Docker Deployment
- Production Dockerfile: `docker/Dockerfile`
- Docker Compose: `docker/compose.yml` (includes PostgreSQL + app)
- Build with `pnpm docker-compose:up` for full stack deployment
