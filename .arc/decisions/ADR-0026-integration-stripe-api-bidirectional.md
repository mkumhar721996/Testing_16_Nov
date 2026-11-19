---
id: ADR-0026
category: integration_surface
title: 'Integration: Stripe API (bidirectional)'
status: accepted
superseded_by: null
component_id: comp_marketplace_api
rule: Payments and refunds go only through Stripe; card details are entered with Stripe
  and never stored or logged, and orders reach restaurants only after payment confirmation.
evidence: 'human: ''Stripe''; EPIC-007 online payment before the restaurant receives
  the order, refunds to original payment method'
---

## Context

human: 'Stripe'; EPIC-007 online payment before the restaurant receives the order, refunds to original payment method

## Decision

Stripe API (bidirectional)

Applies to Marketplace API.
