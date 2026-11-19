---
id: ADR-0016
category: component
title: Marketplace Web App
status: accepted
superseded_by: null
component_id: comp_marketplace_web_app
responsibility: 'Browser frontend of the food-delivery marketplace for customers,
  restaurant partners, delivery partners and admins: discovery, menus, cart, checkout,
  order tracking, partner and admin consoles.'
kind: web_ui
serves:
- TESTING-16-NOV-EPIC-003
- TESTING-16-NOV-EPIC-004
- TESTING-16-NOV-EPIC-005
- TESTING-16-NOV-EPIC-006
- TESTING-16-NOV-EPIC-007
- TESTING-16-NOV-EPIC-008
- TESTING-16-NOV-EPIC-009
- TESTING-16-NOV-EPIC-010
- TESTING-16-NOV-EPIC-011
split_reason: Separate system with its own client runtime and users
talks_to:
- component_id: comp_marketplace_api
  interaction: sync
  evidence: Same pattern as the existing Web App to Platform API seam
rule: Marketplace screens live in the Marketplace Web App and reach data only through
  the Marketplace API.
evidence: 'EPIC-003 to EPIC-011; human: ''Keep all three in this draft as separate
  component sets'''
---

## Context

EPIC-003 to EPIC-011; human: 'Keep all three in this draft as separate component sets'

Serves: TESTING-16-NOV-EPIC-003, TESTING-16-NOV-EPIC-004, TESTING-16-NOV-EPIC-005, TESTING-16-NOV-EPIC-006, TESTING-16-NOV-EPIC-007, TESTING-16-NOV-EPIC-008, TESTING-16-NOV-EPIC-009, TESTING-16-NOV-EPIC-010, TESTING-16-NOV-EPIC-011.

## Decision

Browser frontend of the food-delivery marketplace for customers, restaurant partners, delivery partners and admins: discovery, menus, cart, checkout, order tracking, partner and admin consoles.

Kept separate because Separate system with its own client runtime and users.

## Talks to

- **Marketplace API** (sync) — Same pattern as the existing Web App to Platform API seam
