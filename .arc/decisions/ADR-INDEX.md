# ADR Index

One line per decision — the rule, not the reasoning. Read the full ADR (`.arc/decisions/ADR-NNNN-*.md`) for context and rationale.

| ADR | Category | Status | Title |
|---|---|---|---|
| ADR-0001 | component | accepted | Web App |
| ADR-0002 | component | accepted | Platform API |
| ADR-0003 | component | accepted | Platform Worker |
| ADR-0004 | component | accepted | Relational Database |
| ADR-0005 | nfr | accepted | NFR: scale — 1,000 concurrent users, 50 requests/sec peak |
| ADR-0006 | nfr | accepted | NFR: availability — 99.9% (Multi-AZ, single region) |
| ADR-0007 | deployment_target | accepted | Deployment target: AWS, containers on ECS/Fargate for the Platform API and Platform Worker; Web… |
| ADR-0008 | integration_surface | accepted | Integration: Microsoft Entra ID (outbound) |
| ADR-0009 | integration_surface | accepted | Integration: Email Provider (outbound) |
| ADR-0010 | cross_cutting | accepted | Cross-cutting: Compliance and data residency |
| ADR-0011 | cross_cutting | accepted | Cross-cutting: Tenant isolation |
