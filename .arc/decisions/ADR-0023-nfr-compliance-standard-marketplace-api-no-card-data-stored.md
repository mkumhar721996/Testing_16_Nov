---
id: ADR-0023
category: nfr
title: "NFR: compliance_standard (Marketplace API) \u2014 no card data stored or processed\
  \ by our components"
status: accepted
superseded_by: null
dimension: compliance_standard
metric: payment_card_data_scope
threshold: no card data stored or processed by our components
component_id: comp_marketplace_api
needs_dedicated_tracking: true
rule: Card details are handled only by Stripe and never stored or logged by the system.
evidence: EPIC-007 secure online payment; Stripe chosen by human; threshold proposed
  from that wording
---

## Context

EPIC-007 secure online payment; Stripe chosen by human; threshold proposed from that wording

## Decision

payment_card_data_scope: no card data stored or processed by our components

Applies to Marketplace API.
