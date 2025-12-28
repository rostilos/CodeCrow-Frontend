# Comment Commands

CodeCrow supports triggering analysis and interacting with the AI directly from pull request comments. This feature allows you to:

- Re-run analysis on demand
- Generate summaries and documentation
- Ask questions about code or issues

> **✅ Enabled by Default**: Comment commands are enabled by default when you create a new project. You can disable or configure them in **Project Settings → Analysis Settings → Comment Commands**.

> **📝 Note on AI Models**: The quality of responses from `/codecrow summarize` and `/codecrow ask` commands depends heavily on the AI model configured for your project. Low-tier or free models may produce inconsistent, incomplete, or incorrect results. For best results, we recommend using **mid-tier models** with at least **200k context window**. See recommended models below.

## Recommended AI Models

For reliable code review and command responses, use mid-tier or higher models:

| Model | Provider | Context Window | Tier |
|-------|----------|----------------|------|
| `google/gemini-2.5-flash` | Google | 1M tokens | Mid-tier ✅ |
| `openai/gpt-5.1-codex-mini` | OpenAI | 200k tokens | Mid-tier ✅ |
| `anthropic/claude-haiku-4.5` | Anthropic | 200k tokens | Mid-tier ✅ |
| `x-ai/grok-4.1-fast` | xAI | 200k tokens | Mid-tier ✅ |

⚠️ **Not recommended**: Free-tier or low-parameter models (< 70B params) often produce incomplete or incorrect analysis results, especially for large PRs.

## Requirements

Comment commands require:
1. **App-based integration** (Bitbucket App or GitHub App)
2. **Comment commands enabled** in project settings
3. **Appropriate user permissions** (workspace member for private repos)

## Available Commands

### `/codecrow analyze`

Triggers a full PR analysis on the current commit.

**Behavior:**
- Posts a **placeholder comment immediately** showing analysis has started
- If analysis exists for the same commit hash, **updates the placeholder** with cached results
- Otherwise, runs a new analysis and **updates the placeholder** with results

**Example:**
```
/codecrow analyze
```

**Response:** New PR comment with full analysis results, including:
- Summary of changes
- Detected issues by severity
- Code suggestions

---

### `/codecrow summarize`

Generates a comprehensive summary of the PR changes with documentation and diagrams.

**Behavior:**
- Posts a **placeholder comment immediately** showing processing has started
- Analyzes the PR diff and context
- Retrieves relevant codebase information via RAG
- Generates documentation for the changes
- Creates diagrams (Mermaid for GitHub, ASCII for Bitbucket)
- **Updates the placeholder** with the summary when complete
- Caches results per commit hash

**Example:**
```
/codecrow summarize
```

**Response:** New PR comment containing:
- High-level summary of changes
- Impact analysis
- Architecture diagrams (if applicable)
- Related code references from the codebase

---

### `/codecrow ask <question>`

Ask questions about the PR, code, or analysis results.

**Behavior:**
- Posts a **placeholder comment** while processing your question
- Processes your question with context from:
  - Current PR analysis results
  - PR diff
  - RAG-indexed codebase
- **Responds as a reply** to your comment (placeholder is deleted)
- No caching (each question is processed fresh)

**Examples:**
```
/codecrow ask What does this change do?
```

```
/codecrow ask How can I fix issue #3?
```

```
/codecrow ask Why was the authentication logic changed?
```

```
/codecrow ask Can you suggest a better approach for the error handling in UserService?
```

**Response:** Reply comment with the AI's answer.

## Configuration

### Enabling Comment Commands

1. Navigate to **Project Settings → Analysis Settings**
2. Enable **Comment Commands**
3. Configure rate limits (optional)

### Project Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `commentCommandsEnabled` | Enable/disable comment commands | `true` |
| `commentRateLimit` | Max commands per hour | `10` |
| `commentRateLimitWindow` | Rate limit window (minutes) | `60` |
| `allowPublicRepoCommands` | Allow commands on public repos | `false` |

> **💡 Tip**: Comment commands can be enabled or disabled at the project level. This allows you to control which projects have access to interactive commands without affecting automatic PR analysis.

### Rate Limiting

Rate limits are applied at the project level:

- Default: 10 commands per hour per project
- Configurable per project in settings
- Applies to all command types combined
- Resets on a rolling window basis

### Permission Requirements

| Repository Type | Who Can Use Commands |
|-----------------|---------------------|
| Private | Workspace members only |
| Public | High-privilege users only (configurable) |

## Webhook Events

Comment commands require specific webhook events to be enabled:

### Bitbucket Cloud
- `pullrequest:comment_created` - For general PR comments
- `pullrequest:comment_updated` - For edited comments (optional)

### GitHub
- `issue_comment` - For PR comments

These events are automatically configured when using App-based integration.

## Response Behavior

### Immediate Feedback (Placeholder Comments)

When you trigger a CodeCrow command or when auto-PR analysis starts, CodeCrow immediately posts a **placeholder comment** to let you know processing has begun:

```
🔄 **CodeCrow is analyzing this PR...**

This may take a few minutes depending on the size of the changes.
This comment will be updated with the results when complete.
```

Once processing completes, the placeholder comment is **updated in place** with the actual results. This provides:
- **Immediate feedback** - Know your command was received
- **Single comment** - No clutter from multiple comments
- **Progress visibility** - Clear indication that analysis is in progress

> **Note**: If analysis fails, the placeholder comment is updated with an error message explaining what went wrong.

### Analyze & Summarize
- Posts a **placeholder comment** immediately when processing starts
- **Updates the placeholder** with results when complete
- For analyze: Deletes previous CodeCrow analysis comments before posting placeholder
- For summarize: Deletes previous CodeCrow summary comments before posting placeholder

### Ask
- Posts a **placeholder comment** while processing
- Creates a **reply** to the triggering comment with the answer
- Placeholder is deleted when the reply is posted
- Multiple questions can be asked in sequence

## Caching

| Command | Cached? | Cache Key |
|---------|---------|-----------|
| `/codecrow analyze` | Yes | `project_id + commit_hash + pr_id` |
| `/codecrow summarize` | Yes | `project_id + commit_hash + pr_id + "summarize"` |
| `/codecrow ask` | No | N/A |

## Security

### Input Sanitization

All user questions in `/codecrow ask` are sanitized to prevent:
- Prompt injection attacks
- System prompt manipulation
- Unauthorized data access

### Access Control

- Commands respect workspace membership
- Issue references are validated against project scope
- Only issues from the same project can be referenced

## Examples

### Requesting Analysis
```
/codecrow analyze

Please run a fresh analysis on these changes.
```

### Getting Documentation
```
/codecrow summarize

Generate documentation for this feature implementation.
```

### Asking About Issues
```
/codecrow ask The analysis found a potential null pointer in line 42 of UserService.java. 
Can you explain why this is an issue and suggest a fix?
```

### Referencing Specific Issues
```
/codecrow ask How should I fix issue HIGH-1 from the analysis?
```

## Troubleshooting

### Commands Not Working

1. **Check if enabled**: Verify comment commands are enabled in project settings (**Project Settings → Analysis Settings → Comment Commands**)
2. **Check integration type**: Only App integrations support comment commands (Bitbucket App or GitHub App)
3. **Check permissions**: Ensure you're a workspace member for private repositories
4. **Check rate limits**: You may have exceeded the rate limit (default: 10 commands/hour)
5. **Check AI configuration**: Ensure an AI connection is configured for your project

### Slow Responses

- Summarize commands take longer due to RAG queries
- Complex questions may take 30-60 seconds
- Check MCP client and RAG pipeline logs for bottlenecks

### Incorrect or Weird Responses

AI model quality significantly impacts response quality:

| Model Tier | Expected Behavior |
|------------|-------------------|
| **Premium** (GPT-4, Claude 3, etc.) | Consistent, high-quality responses |
| **Mid-tier** (70B+ params) | Good responses, occasional inconsistencies |
| **Free/Low-tier** (<30B params) | May produce incomplete, incorrect, or nonsensical results |

**Recommendations:**
- Use a model with at least 70B parameters for reliable results
- Enable RAG indexing for better codebase context
- Ensure adequate token limits in AI configuration (8K+ recommended)
- Review the prompt context in MCP client logs for debugging

### Job Marked as Failed

When a command job fails, check:
1. **AI provider rate limits**: OpenRouter, OpenAI, and other providers may rate limit requests
2. **MCP tool errors**: VCS API calls may fail due to authentication or permission issues
3. **Token limit exceeded**: Large PRs may exceed the model's context window
4. **Network issues**: Connectivity problems between services

The job details page shows error messages with specific failure reasons.
