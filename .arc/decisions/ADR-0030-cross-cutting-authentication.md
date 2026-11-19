---
id: ADR-0030
category: cross_cutting
title: 'Cross-cutting: Authentication'
status: accepted
superseded_by: null
component_id: null
rule: No system stores passwords; every API validates Entra ID tokens and enforces
  its own role checks server-side.
decision: All three systems sign users in with Microsoft Entra ID; each API validates
  Entra tokens and maps users to its own roles. Marketplace customer sign-up and password
  reset (STORY-013) are therefore handled through Entra ID rather than app-stored
  passwords.
evidence: 'human: ''Both use Entra ID''; EPIC-018'
---

## Context

human: 'Both use Entra ID'; EPIC-018

## Decision

All three systems sign users in with Microsoft Entra ID; each API validates Entra tokens and maps users to its own roles. Marketplace customer sign-up and password reset (STORY-013) are therefore handled through Entra ID rather than app-stored passwords.
