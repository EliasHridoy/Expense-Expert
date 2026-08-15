---
name: write-plan
description: >
  Template and instructions for producing a well-structured implementation plan
  in workspace/plan.md. Used by planner-queen.
---

# Write Plan Skill

A good implementation plan is **specific enough to execute without asking
questions**. Every vague decision is a bug waiting to happen.

## Quality Criteria

A plan is ready when:
- [ ] The Goal is one clear paragraph (what + why, not how)
- [ ] Every tech choice has an explicit rationale
- [ ] Every task has measurable acceptance criteria
- [ ] Risks are identified with mitigations (not just listed)
- [ ] The task list is ordered by dependency (no task requires a later task)

## Tech Stack Section Guide

For each technology decision, address:
1. **What** — the specific library/framework/tool with version
2. **Why this** — the concrete reason for this choice
3. **Why not X** — why the obvious alternative was rejected

Bad: `Database: PostgreSQL`
Good: `Database: PostgreSQL 16 — chosen for JSONB support needed for flexible schema; SQLite rejected because we need concurrent writes from multiple workers`

## Task Writing Guide

Each task follows this pattern:
```
- [ ] **Task N: Title**
  - Action: What specifically to do (files, functions, APIs)
  - Acceptance: How to verify it is done (test command, observable behavior)
```

Bad task: `- [ ] Add authentication`
Good task:
```
- [ ] **Task 3: Implement JWT authentication middleware**
  - Create `src/middleware/auth.py` with a `require_auth` decorator
  - Decorator validates Bearer token in `Authorization` header
  - Returns HTTP 401 with JSON `{"error": "Unauthorized"}` on failure
  - Acceptance: `pytest tests/test_auth.py -v` passes; curl without token returns 401
```

## Risk Table Format

| Risk | Severity | Mitigation |
|------|----------|------------|
| Rate limiting from external API | HIGH | Implement exponential backoff with jitter; cache responses for 60s |
| N+1 query problem | MED | Use select_related() / eager loading in all list endpoints |

## Revision Discipline

When updating plan.md after receiving research.md:
- Address every Recommendation from the researcher directly
- Update the Tech Stack if a better library was identified
- Add tasks if gaps were found
- Update Risk table with newly identified risks
- Do NOT remove tasks that were in the original plan unless they are provably unnecessary
