# ADR Index

One line per decision — the rule, not the reasoning. Read the full ADR (`.arc/decisions/ADR-NNNN-*.md`) for context and rationale.

## Accepted — binding rules

| ADR | Category | Status | Rule |
|---|---|---|---|
| ADR-0005 | nfr | accepted | The system sustains 1,000 concurrent users and 50 requests/sec peak. |
| ADR-0006 | nfr | accepted | Production meets 99.9% monthly availability; the database runs Multi-AZ. |
| ADR-0008 | integration_surface | accepted | Sign-in for all three systems is delegated to Microsoft Entra ID; no API stores passwords. Platform API, Marketplace API and Investing API each validate Entra tokens. |
| ADR-0012 | component | accepted | Fundraising admin screens live in the Web App and reach data only through the Platform API. |
| ADR-0013 | component | accepted | Every non-public endpoint enforces role and organization checks on the server; the UI never decides access. |
| ADR-0014 | component | accepted | Background and scheduled work runs in the Platform Worker, never inside API request handlers. |
| ADR-0015 | component | accepted | Fundraising data lives only in this database; only the Platform API and Platform Worker access it. |
| ADR-0016 | component | accepted | Marketplace screens live in the Marketplace Web App and reach data only through the Marketplace API. |
| ADR-0017 | component | accepted | Every non-public endpoint enforces the caller's role and ownership on the server. |
| ADR-0018 | component | accepted | Marketplace background work runs in the Marketplace Worker, never inside API request handlers. |
| ADR-0019 | component | accepted | Marketplace data lives only in this database; only the Marketplace API and Worker access it. |
| ADR-0020 | component | accepted | Investing screens live in the Investing Web App and reach data only through the Investing API. |
| ADR-0021 | component | accepted | All market data enters through the single feed boundary so indices, charts and sparklines share one source and period. |
| ADR-0022 | component | accepted | Investing data lives only in this database; only the Investing API accesses it. |
| ADR-0023 | nfr | accepted | Card details are handled only by Stripe and never stored or logged by the system. |
| ADR-0024 | deployment_target | accepted | All components run in AWS ap-south-1 as containers on ECS/Fargate with RDS Multi-AZ; no cross-region replication. |
| ADR-0025 | integration_surface | accepted | All outgoing marketplace email is sent by the Marketplace Worker through the email provider. |
| ADR-0026 | integration_surface | accepted | Payments and refunds go only through Stripe; card details are entered with Stripe and never stored or logged, and orders reach restaurants only after payment confirmation. |
| ADR-0027 | cross_cutting | accepted | Data stays in ap-south-1, is encrypted at rest and in transit, and administrative and access changes write audit records. |
| ADR-0028 | cross_cutting | accepted | Every tenant-owned row carries an organization ID and every query is filtered by the caller's entitled organizations. |
| ADR-0029 | cross_cutting | accepted | Each of the three domains has its own components, database and integrations; none shares a database or API with another. |
| ADR-0030 | cross_cutting | accepted | No system stores passwords; every API validates Entra ID tokens and enforces its own role checks server-side. |
| ADR-0031 | cross_cutting | accepted | The Investing API reads market data only through one feed boundary and never sends orders or IPO applications to an external brokerage or exchange. |

## Superseded and retired — not binding

| ADR | Category | Status | Title |
|---|---|---|---|
| ADR-0001 | component | superseded by ADR-0012 | Web App |
| ADR-0002 | component | superseded by ADR-0013 | Platform API |
| ADR-0003 | component | superseded by ADR-0014 | Platform Worker |
| ADR-0004 | component | superseded by ADR-0015 | Relational Database |
| ADR-0007 | deployment_target | superseded by ADR-0024 | Deployment target: AWS, containers on ECS/Fargate for the Platform API and Platform Worker; Web… |
| ADR-0009 | integration_surface | retired | Integration: Email Provider (outbound) |
| ADR-0010 | cross_cutting | superseded by ADR-0027 | Cross-cutting: Compliance and data residency |
| ADR-0011 | cross_cutting | superseded by ADR-0028 | Cross-cutting: Tenant isolation |
