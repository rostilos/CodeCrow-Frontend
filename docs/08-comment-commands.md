# Comment Commands

CodeCrow supports triggering analysis and interacting with the AI directly from pull request comments. This feature allows you to:

- Re-run analysis on demand
- Generate summaries and documentation
- Ask questions about code or issues

## Requirements

Comment commands require:
1. **App-based integration** (Bitbucket App or GitHub App)
2. **Comment commands enabled** in project settings
3. **Appropriate user permissions** (workspace member for private repos)

## Available Commands

### `/codecrow analyze`

Triggers a full PR analysis on the current commit.

**Behavior:**
- If analysis exists for the same commit hash, returns cached results
- If auto-PR analysis is enabled, posts the existing analysis as a new comment
- Otherwise, runs a new analysis and posts results

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
- Analyzes the PR diff and context
- Retrieves relevant codebase information via RAG
- Generates documentation for the changes
- Creates diagrams (Mermaid for GitHub, ASCII for Bitbucket)
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
- Processes your question with context from:
  - Current PR analysis results
  - PR diff
  - RAG-indexed codebase
- Responds as a reply to your comment
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
| `commentCommandsEnabled` | Enable/disable comment commands | `false` |
| `commentRateLimit` | Max commands per hour | `10` |
| `commentRateLimitWindow` | Rate limit window (minutes) | `60` |
| `allowPublicRepoCommands` | Allow commands on public repos | `false` |

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

### Analyze & Summarize
- Creates a **new PR comment** with results
- For analyze: Deletes previous CodeCrow analysis comments first
- For summarize: Deletes previous CodeCrow summary comments first

### Ask
- Creates a **reply** to the triggering comment
- Original comment preserved
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

1. **Check if enabled**: Verify comment commands are enabled in project settings
2. **Check integration type**: Only App integrations support comment commands
3. **Check permissions**: Ensure you're a workspace member
4. **Check rate limits**: You may have exceeded the rate limit

### Slow Responses

- Summarize commands take longer due to RAG queries
- Complex questions may take 30-60 seconds
- Check MCP client and RAG pipeline logs for bottlenecks

### Incorrect Responses

- Ensure RAG indexing is enabled and complete
- Check if the AI connection is properly configured
- Review the prompt context in MCP client logs
