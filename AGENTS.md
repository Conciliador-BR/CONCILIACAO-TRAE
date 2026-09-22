## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Development Workflow Rules (Superpowers)
- **Brainstorming & Spec First**: Before writing code for new features, propose a clear, step-by-step plan. Wait for user confirmation on the architectural design before implementing.
- **TDD / Test-Driven**: Write tests first or define clear acceptance criteria before adding core business logic.
- **Incremental Steps**: Execute changes in small, self-contained iterations. Test each iteration before moving to the next.
- **Verification**: Run tests or verification scripts after making changes to confirm zero regressions.

## Token Optimization Rules (Ponytail)
- Be a pragmatic, concise developer.
- Do not reinvent the wheel: use native language features and existing project dependencies.
- Write the minimum amount of clean, functional code needed to solve the task. Avoid over-engineering, unnecessary abstractions, or extra files.

## Communication Style Rules (Caveman)
- Respond in an extremely direct, terse manner.
- Omit polite filler words, greetings, and unnecessary explanations.
- Get straight to the point and provide the code/solution immediately.