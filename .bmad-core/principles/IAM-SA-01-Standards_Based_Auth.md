---
title: Standards-Based Authentication and Authorization
url: https://backbase.atlassian.net/wiki/spaces/ARCH/pages/5120000747/User+Authentication+and+Proof-Driven+Authorization+are+Standards-Based
date: 2025-06-10 08:56:14
---

# Standards-Based Authentication and Authorization

**Original**: User Authentication and Proof-Driven Authorization are Standards-Based

Principle Reference: IAM-SA-01

## Statement

User authentication and proof-driven authorization on the EBP must use recognized, centralized, industry-standard protocols like OAuth and OpenID Connect.

## Rational

Using industry standards inspires customer confidence, relies on proven security practices, provides interoperability, and abstracts authentication from the EBP, reducing complexity and cost.

## Implications

- All EBP capabilities and applications must delegate authentication and proof-driven authorization to the Backbase Identity architecture.
- Capabilities and apps do not manage these processes locally.
- A degree of complexity is expected in implementing these standards, requiring domain expertise.