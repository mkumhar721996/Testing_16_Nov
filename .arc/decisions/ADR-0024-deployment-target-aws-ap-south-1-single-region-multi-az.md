---
id: ADR-0024
category: deployment_target
title: "Deployment target: AWS ap-south-1 (single region, Multi-AZ): containers on\
  \ ECS/Fargate for the\u2026"
status: accepted
superseded_by: null
component_id: null
rule: All components run in AWS ap-south-1 as containers on ECS/Fargate with RDS Multi-AZ;
  no cross-region replication.
decision: 'AWS ap-south-1 (single region, Multi-AZ): containers on ECS/Fargate for
  the APIs and Workers of all three systems; Web Apps served as static/container assets;
  one PostgreSQL on RDS Multi-AZ per system.'
evidence: 'human: ''Single region (ap-south-1) with Multi-AZ''; earlier ''AWS, containers
  on ECS/Fargate'''
---

## Context

human: 'Single region (ap-south-1) with Multi-AZ'; earlier 'AWS, containers on ECS/Fargate'

## Decision

AWS ap-south-1 (single region, Multi-AZ): containers on ECS/Fargate for the APIs and Workers of all three systems; Web Apps served as static/container assets; one PostgreSQL on RDS Multi-AZ per system.
