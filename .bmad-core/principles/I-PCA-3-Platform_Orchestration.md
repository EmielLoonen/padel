---
title: Platform-Owned Data Integration Orchestration
url: https://backbase.atlassian.net/wiki/spaces/ARCH/pages/4801527898/Any+data+integration+orchestration+happens+within+the+Platform
date: 2025-06-10 08:56:05
---

# Platform-Owned Data Integration Orchestration

**Original**: Any "data integration orchestration" happens within the Platform

Principle Reference: I-PCA-3

## Statement

The logic for the order of data insertion or updates from external sources into the EBP must reside within the EBP itself.

## Rational

Placing data integration orchestration within the EBP ensures consistency and avoids data inconsistencies that can arise from externalizing this logic. It gives Product control over platform behavior.

## Implications

- Existing data integration orchestration logic in external tools like Stream should be migrated into the platform.
- This type of orchestration should not be implemented in Grand Central.
- An impact assessment is needed to plan the migration of this logic.