---
name: web-search
description: >
  Instructions for effective web research: query construction, source
  evaluation, and synthesizing findings into actionable insights.
  Used by researcher-queen.
---

# Web Search Skill

## When to Search

Search when you need:
- **Current library versions** — package ecosystems change fast; always verify
- **Security advisories** — known CVEs, recent vulnerabilities
- **Community consensus** — "what does the community recommend for X in 2025?"
- **Specific API signatures** — exact function names, parameters, return types
- **Benchmark data** — performance comparisons between alternatives

Do NOT search for:
- Fundamental concepts you already know (HTTP, REST, SQL basics)
- Information clearly stated in the plan or requirements
- Opinion-based questions with no objective answer

## Query Construction

### Be specific and current
| ❌ Vague | ✅ Specific |
|---------|-----------|
| `python auth library` | `python JWT authentication library 2025 best practices fastapi` |
| `react state management` | `react state management comparison zustand vs jotai vs redux 2025` |
| `database for node` | `postgresql vs mysql nodejs performance comparison 2025` |

### Use site: qualifiers for authoritative sources
```
site:docs.python.org asyncio best practices
site:github.com fastapi performance benchmarks
```

### Search for pitfalls explicitly
```
"common mistakes" python async database connection pooling
"gotchas" react useEffect cleanup 2025
```

## Source Evaluation

### Tier 1 — Highest trust
- Official documentation (docs.python.org, react.dev, docs.aws.amazon.com)
- GitHub repositories (source code, issues, PRs)
- OWASP (security guidance)
- RFC documents

### Tier 2 — Good trust
- Well-known engineering blogs (engineering.atspotify.com, netflixtechblog.com)
- Stack Overflow accepted answers with high votes (check date)
- Medium/Substack posts from recognized contributors

### Tier 3 — Verify independently
- Random blog posts
- AI-generated content
- Answers older than 2 years for fast-moving ecosystems

## Synthesizing Findings

Do NOT copy-paste search results into research.md.

Instead:
1. **Identify the consensus** — what do multiple sources agree on?
2. **Note the exceptions** — where do sources disagree? Why?
3. **Extract the actionable** — what should the planner-queen do differently?
4. **Flag the uncertain** — what requires more context from the user?

## Research Depth Guidelines

For each major technology in the plan, spend proportional effort:
- **Core stack choices** (language, framework, database) — deep research
- **Supporting libraries** (auth, logging, testing) — medium research
- **Utility packages** (date formatting, HTTP client) — quick verification of latest version and any known issues

## Output Discipline

- Name specific packages with versions: `bcrypt 4.1.x` not "a password hashing library"
- Include links to sources in your findings (markdown format)
- Flag anything that contradicts the plan directly to the planner-queen
- Keep findings focused — do not research tangential topics not in the plan
