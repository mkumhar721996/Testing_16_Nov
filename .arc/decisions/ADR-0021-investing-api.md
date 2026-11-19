---
id: ADR-0021
category: component
title: Investing API
status: accepted
superseded_by: null
component_id: comp_investing_api
responsibility: 'REST API of the investing dashboard: market data for indices and
  sparklines behind one feed boundary, watchlist, stock search and buy orders, SIPs,
  IPO listings and applications.'
kind: api_service
serves:
- TESTING-16-NOV-EPIC-012
- TESTING-16-NOV-EPIC-013
- TESTING-16-NOV-EPIC-014
- TESTING-16-NOV-EPIC-015
- TESTING-16-NOV-EPIC-016
split_reason: Separate system with its own data and integrations
talks_to:
- component_id: comp_investing_database
  interaction: sync
  evidence: EPIC-014 to EPIC-016 persistent data
rule: All market data enters through the single feed boundary so indices, charts and
  sparklines share one source and period.
evidence: EPIC-012 to EPIC-016; STORY-025
---

## Context

EPIC-012 to EPIC-016; STORY-025

Serves: TESTING-16-NOV-EPIC-012, TESTING-16-NOV-EPIC-013, TESTING-16-NOV-EPIC-014, TESTING-16-NOV-EPIC-015, TESTING-16-NOV-EPIC-016.

## Decision

REST API of the investing dashboard: market data for indices and sparklines behind one feed boundary, watchlist, stock search and buy orders, SIPs, IPO listings and applications.

Kept separate because Separate system with its own data and integrations.

## Talks to

- **Investing Database** (sync) — EPIC-014 to EPIC-016 persistent data
