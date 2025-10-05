---
title: Replaceable External Integration
url: https://backbase.atlassian.net/wiki/spaces/ARCH/pages/4513760953/External+integration+service+provider+is+replaceable
date: 2025-06-10 08:55:49
---

# Replaceable External Integration

**Original**: External integration service provider is replaceable

Principle Reference: I-PCA-1

## Statement

Any EBP component that integrates with an external service provider must have a replaceable implementation.

## Rational

As an enterprise offering, the platform must allow implementation teams to replace out-of-the-box integrations with specific ones as required by the project.

## Implications

- Loosely coupled integrations should be replaceable through configuration without code changes.
- Tightly coupled integrations may require developing new components to replace.
- The effort to replace any external integration should be estimated and documented.
- A conscious decision must be made whether to standardize integrations.