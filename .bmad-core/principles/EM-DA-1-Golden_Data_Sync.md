---
title: Golden Data Synchronization
url: https://backbase.atlassian.net/wiki/spaces/ARCH/pages/4547772501/Audiences+user+segments+should+always+be+synchronized+with+the+golden+copy+of+data
date: 2025-06-10 08:55:23
---

# Golden Data Synchronization

**Original**: Audiences & user segments should always be synchronized with the “golden copy of data“

Principle Reference: EM-DA-1

## Statement

Audiences and user segments must be synchronized with the golden copy of data in near real-time.

## Rational

The Audiences capability is a "silver copy" of data and requires timely synchronization with the source of truth to ensure that engagements are relevant and effective.

## Implications

- User segment collection is tied to continuous data ingestion.
- Collectors should integrate directly with the source of truth (e.g., Core Banking, CRM).
- Event-based or scheduled data pushes are preferred to ensure timely updates.