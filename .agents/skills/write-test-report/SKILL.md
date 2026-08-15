---
name: write-test-report
description: >
  Template and instructions for producing a test report in workspace/test-report.md.
  The STATUS line is machine-parsed by hub.sh — formatting it incorrectly breaks
  the pipeline retry logic. Used by tester-prince.
---

# Write Test Report Skill

## CRITICAL: STATUS Line

**The very first line of test-report.md MUST be one of:**
```
STATUS: PASS
STATUS: FAIL
STATUS: PARTIAL
```

No other text, no blank lines before it, no formatting. This line is parsed by
`hub.sh` with: `grep -m1 "^STATUS:" test-report.md | awk '{print $2}'`

**Definitions:**
| Status | Meaning |
|--------|---------|
| `PASS` | All tasks implemented, all tests green, no blocking issues |
| `PARTIAL` | Most tasks done, tests mostly pass, non-blocking issues only |
| `FAIL` | Blocking bugs, test failures, or significant missing requirements |

## Test Commands to Run (try all that apply)

Run commands from the project root. Capture output including errors.

```bash
# Python
pytest --tb=short -q

# Node.js / JavaScript
npm test
npx jest --ci
npx vitest run

# Go
go test ./...

# Rust
cargo test

# Ruby
bundle exec rspec

# PHP
./vendor/bin/phpunit

# Generic
make test
./run_tests.sh
```

If no test framework is configured, note this explicitly and perform manual validation.

## Validation Against Plan

For each task in plan.md, verify:
1. Was this task implemented? (cross-reference implementation.md)
2. Was the acceptance criterion met?
3. Are edge cases handled?

## Security Checklist

Quick scan for common issues:
- [ ] No hardcoded credentials, API keys, or secrets
- [ ] SQL queries use parameterized inputs (no string concatenation)
- [ ] User input is validated and sanitized
- [ ] Error messages don't expose internals
- [ ] Sensitive data is not logged

## Report Structure

```markdown
STATUS: PASS

## Tests Run
| Command | Result | Duration |
|---------|--------|----------|
| `pytest -q` | 14 passed, 0 failed | 1.2s |

## Acceptance Criteria Check
| Task # | Task Name | Criteria Met | Notes |
|--------|-----------|-------------|-------|
| 1 | JWT middleware | ✅ | All 4 test cases pass |
| 2 | Rate limiting | ⚠️ Partial | Works but missing retry-after header |
| 3 | Logging | ❌ | Not implemented |

## Issues Found
### Blocking
- None

### Non-blocking (warnings)
- Task 2: Missing `Retry-After` header on 429 response (RFC 6585)

### Security
- No issues found

## Recommendations for implementor-queen
If STATUS is PASS: write "None — ready to ship."
If STATUS is FAIL or PARTIAL: list specific, actionable fixes:
- Add `Retry-After: 60` header to rate limit responses in `src/middleware/ratelimit.py:L45`
```
