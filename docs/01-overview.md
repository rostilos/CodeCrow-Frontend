# Overview

## What is CodeCrow?

CodeCrow is an automated code review platform that integrates with your version control system to provide AI-powered code analysis. It supports multiple VCS providers including Bitbucket Cloud and GitHub, analyzing code changes in pull requests and branches using Model Context Protocol (MCP) servers combined with Retrieval-Augmented Generation (RAG) for contextual understanding of your codebase.

## Supported Platforms

| Platform | App Integration | OAuth | Personal Token | Webhooks | PR Comments |
|----------|-----------------|-------|----------------|----------|-------------|
| Bitbucket Cloud | ✅ | ✅ | ✅ | ✅ | ✅ |
| GitHub | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bitbucket Server | ❌ | ❌ | ✅ | ✅ | ✅ |
| GitLab | 🚧 Coming soon | 🚧 | 🚧 | 🚧 | 🚧 |

## Key Features

### Automated Code Analysis
- **Pull Request Analysis**: Automatically analyze PRs when created or updated
- **Branch Analysis**: Analyze branch pushes and track issue resolution
- **Comment Commands**: Trigger analysis via PR comments (`/codecrow analyze`, `/codecrow summarize`, `/codecrow ask`)

### AI-Powered Reviews
- Uses LLM models through OpenRouter, OpenAI, or Anthropic
- Context-aware analysis using RAG pipeline
- Intelligent issue detection with severity classification

### Multi-Platform Support
- Connect Bitbucket Cloud and GitHub simultaneously
- App-based integration for simplified setup
- OAuth and personal token support

### Issue Tracking
- Tracks issues across branches and pull requests
- Automatic detection of resolved issues
- Issue linking between PR and branch analysis

### Enterprise Features
- Multi-workspace organization
- Role-based access control
- Rate limiting per project
- Private repository support

## System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                   VCS Platform (Bitbucket/GitHub)               │
└────────────────────────────┬────────────────────────────────────┘
                             │ Webhooks
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Pipeline Agent (8082)                      │
│  • Webhook processing        • Rate limiting                    │
│  • Comment command parsing   • Analysis orchestration           │
└───────┬─────────────────────────────────────┬───────────────────┘
        │                                     │
        ▼                                     ▼
┌──────────────────┐           ┌──────────────────────────┐
│  MCP Client      │◄──────────┤    RAG Pipeline          │
│    (8000)        │  Context  │      (8001)              │
│                  │           │                          │
│ • Prompt Gen     │           │ • Codebase indexing     │
│ • MCP Tools      │           │ • Semantic search       │
│ • LLM Client     │           │ • Vector operations     │
└──────────────────┘           └──────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│      Web Server (8081)        │
│ • REST API                    │
│ • User management             │
│ • Project configuration       │
└───────┬──────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│      Web Frontend (8080)      │
│ • React Dashboard             │
│ • Analysis visualization      │
└──────────────────────────────┘
```

## Analysis Flow

1. **Trigger**: Webhook from VCS (PR event, push, or comment command)
2. **Validation**: Pipeline agent validates request and checks rate limits
3. **Context**: RAG pipeline provides relevant codebase context
4. **Analysis**: MCP client generates prompts and calls AI model
5. **Results**: Issues stored in database, comments posted to VCS
6. **Visualization**: Results available in web interface

## Core Concepts

### Workspaces
Top-level organizational unit containing projects and members with specific roles.

### Projects
Repository representation within a workspace, bound to VCS repositories and AI connections.

### Analysis Types
- **PR Analysis**: Analyzes changed files in pull requests
- **Branch Analysis**: Incremental analysis after merges, tracks issue resolution
- **Summarize**: Generates documentation and diagrams for PR changes
- **Ask**: Interactive Q&A about code and analysis results

### Issue Severity
- **HIGH**: Critical issues requiring immediate attention
- **MEDIUM**: Important issues to address
- **LOW**: Minor suggestions and improvements

### Comment Commands
Trigger analysis via PR comments:
- `/codecrow analyze` - Run full PR analysis
- `/codecrow summarize` - Generate summary with diagrams
- `/codecrow ask <question>` - Ask about code or issues

## Technology Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React, TypeScript, Vite, shadcn/ui |
| Backend | Java 17, Spring Boot 3.2.5 |
| Python Services | FastAPI, LangChain, LlamaIndex |
| Database | PostgreSQL 15, Redis 7, Qdrant |
| AI Integration | OpenRouter, OpenAI, Anthropic |
| Infrastructure | Docker, Docker Compose |

## Next Steps

- [Quick Start](./02-quick-start.md) - Get CodeCrow running
- [Configuration](./04-configuration.md) - Customize your setup
- [VCS Integration](./05-vcs-integration.md) - Connect your repositories
