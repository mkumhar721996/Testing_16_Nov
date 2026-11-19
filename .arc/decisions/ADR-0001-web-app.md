---
id: ADR-0001
category: component
title: Web App
status: superseded
superseded_by: ADR-0012
component_id: comp_web_app
responsibility: 'Responsive frontend for end users and administrators: dashboard,
  management screens, configuration pages, reporting, shared UI components.'
kind: web_ui
split_reason: Separate client runtime (browser)
talks_to:
- component_id: comp_platform_api
  interaction: sync
  evidence: 'human: REST APIs supporting the web application'
evidence: 'human: ''Responsive frontend application for end users and administrators'''
---

## Context

human: 'Responsive frontend application for end users and administrators'

## Decision

Responsive frontend for end users and administrators: dashboard, management screens, configuration pages, reporting, shared UI components.

Kept separate because Separate client runtime (browser).

## Talks to

- **Platform API** (sync) — human: REST APIs supporting the web application
