---
id: ADR-0025
category: integration_surface
title: 'Integration: Email Provider (outbound)'
status: accepted
superseded_by: null
component_id: comp_marketplace_worker
rule: All outgoing marketplace email is sent by the Marketplace Worker through the
  email provider.
evidence: EPIC-010 email order updates, STORY-013 password-reset email; Amazon SES
  accepted default
---

## Context

EPIC-010 email order updates, STORY-013 password-reset email; Amazon SES accepted default

## Decision

Email Provider (outbound)

Applies to Marketplace Worker.
