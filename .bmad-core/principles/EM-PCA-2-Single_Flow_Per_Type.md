---
title: Single Flow Per Engagement Type
url: https://backbase.atlassian.net/wiki/spaces/ARCH/pages/4547608707/Each+engagement+type+should+either+support+developer+or+marketer+flow.+Never+both
date: 2025-06-10 08:55:40
---

# Single Flow Per Engagement Type

**Original**: Each engagement type should either support developer or marketer flow. Never both

Principle Reference: EM-PCA-2

## Statement

Each engagement type must support either a developer flow or a marketer flow, but never both.

## Rational

Mixing developer and marketer flows for the same engagement type would create conflicts and merge issues, complicating the management and deployment of engagements.

## Implications

- Engagements have two distinct lifecycles: developer-managed (imported, eternal) and marketer-managed (created in-app, transient).
- These two lifecycles cannot be mixed for the same engagement type.
- The Realtime Engagement Orchestrator only deals with "final" engagements, regardless of their origin.