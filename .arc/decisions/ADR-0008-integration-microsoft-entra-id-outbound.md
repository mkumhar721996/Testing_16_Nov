---
id: ADR-0008
category: integration_surface
title: 'Integration: Microsoft Entra ID (outbound)'
status: accepted
superseded_by: null
component_id: comp_platform_api
rule: Sign-in for all three systems is delegated to Microsoft Entra ID; no API stores
  passwords. Platform API, Marketplace API and Investing API each validate Entra tokens.
evidence: 'human: ''Entra ID SSO + email only'''
---

## Context

human: 'Entra ID SSO + email only'

## Decision

Microsoft Entra ID (outbound)

Applies to Platform API.
