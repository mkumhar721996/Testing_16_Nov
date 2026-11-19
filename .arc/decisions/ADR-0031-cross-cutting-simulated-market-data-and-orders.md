---
id: ADR-0031
category: cross_cutting
title: 'Cross-cutting: Simulated market data and orders'
status: accepted
superseded_by: null
component_id: null
rule: The Investing API reads market data only through one feed boundary and never
  sends orders or IPO applications to an external brokerage or exchange.
decision: Index, chart and sparkline data comes from a sample feed behind a single
  feed boundary in the Investing API; buy orders and IPO applications are recorded
  in the Investing Database only and not sent to any brokerage or exchange. No external
  market integration exists in this release.
evidence: 'human: ''Sample feed and simulated orders only''; STORY-025'
---

## Context

human: 'Sample feed and simulated orders only'; STORY-025

## Decision

Index, chart and sparkline data comes from a sample feed behind a single feed boundary in the Investing API; buy orders and IPO applications are recorded in the Investing Database only and not sent to any brokerage or exchange. No external market integration exists in this release.
