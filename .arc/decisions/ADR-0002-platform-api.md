---
id: ADR-0002
category: component
title: Platform API
status: accepted
superseded_by: null
component_id: comp_platform_api
responsibility: 'REST API for the web app and external consumers: authentication,
  user management, role-based access control, notifications, audit logging, configuration
  management, reporting. Contains the integration connectors (identity providers,
  messaging, enterprise platforms) as a module.'
kind: api_service
split_reason: Separate runtime serving the UI and other products' services
talks_to:
- component_id: comp_relational_database
  interaction: sync
  evidence: 'human: database stores users, roles, permissions, audit records'
evidence: 'human: ''REST APIs supporting the web application and external integrations'''
---

## Context

human: 'REST APIs supporting the web application and external integrations'

## Decision

REST API for the web app and external consumers: authentication, user management, role-based access control, notifications, audit logging, configuration management, reporting. Contains the integration connectors (identity providers, messaging, enterprise platforms) as a module.

Kept separate because Separate runtime serving the UI and other products' services.

## Talks to

- **Relational Database** (sync) — human: database stores users, roles, permissions, audit records
