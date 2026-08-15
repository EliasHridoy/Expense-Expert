---
name: git-commit
description: >
  Conventional commits format, staging strategy, commit message best practices,
  and guidelines for clean version control history. Used by git-princess.
---

# Git Commit Skill

## Conventional Commits Format

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types
| Type | When to use |
|------|-------------|
| `feat` | A new feature visible to the user |
| `fix` | A bug fix |
| `refactor` | Code restructuring with no behavior change |
| `test` | Adding or modifying tests only |
| `docs` | Documentation only |
| `chore` | Build system, CI config, tooling updates |
| `style` | Formatting, whitespace, semicolons (no logic change) |
| `perf` | Performance improvement |

### Scope
- Use the module, feature area, or file basename: `auth`, `api`, `db`, `ui`
- Omit scope for cross-cutting changes

### Short Description Rules
- Max **72 characters**
- **Imperative mood**: "add" not "added" or "adds"
- **No period** at the end
- **No "this commit"** — it's redundant

### Body (optional)
- Wrap at 72 chars per line
- Explain **WHY**, not what (the diff already shows what)
- Separate from subject with a blank line

### Footer (for breaking changes)
```
BREAKING CHANGE: previous auth tokens are invalidated; clients must re-authenticate
```

## Good vs Bad Examples

| ❌ Bad | ✅ Good |
|--------|---------|
| `fixed bug` | `fix(auth): handle expired JWT tokens gracefully` |
| `WIP` | `feat(api): add paginated endpoint for user listings` |
| `update files` | `refactor(db): extract connection pool into ConnectionManager` |
| `added tests for auth` | `test(auth): add coverage for token refresh edge cases` |

## Staging Strategy

1. **Never `git add -A` blindly** — review `git status` first
2. Stage only files that are part of this feature/fix
3. Use `git add -p` for partial file staging when needed
4. Always check `.gitignore` before staging — ensure env files, secrets, and
   build artifacts are excluded

## Files to NEVER commit
- `.env`, `.env.local`, `.env.*` — environment variables and secrets
- `*.key`, `*.pem`, `*.p12` — certificates and private keys
- `node_modules/`, `__pycache__/`, `.venv/`, `dist/`, `build/` — build artifacts
- `*.log` — log files
- `.DS_Store`, `Thumbs.db` — OS metadata

If any of these are untracked, add them to `.gitignore` before staging.

## Atomic Commits

Each commit should represent one logical change. If the implementation involved
multiple unrelated changes, consider splitting into multiple commits:
```bash
git add src/auth.py tests/test_auth.py
git commit -m "feat(auth): add JWT authentication middleware"

git add src/ratelimit.py tests/test_ratelimit.py
git commit -m "feat(api): add rate limiting to public endpoints"
```

## Push Decision

Push if:
- A remote is configured (`git remote -v` shows output)
- The current branch tracks a remote branch
- There are no merge conflicts

Do not push if:
- No remote is configured
- The branch has diverged from remote (requires manual resolution)
- Tests are FAIL status
