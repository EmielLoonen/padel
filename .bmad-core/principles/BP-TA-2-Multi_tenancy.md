---
title: Multi-Tenancy by Design
url: https://backbase.atlassian.net/wiki/spaces/ARCH/pages/5404721377/Multi-tenancy+by+Design
date: 2025-06-10 08:55:07
---

# Multi-Tenancy by Design

**Original**: Multi-tenancy by Design

Principle Reference: BP-TA-2

## Statement

Engagement Banking Platform capabilities are designed for a technical multi-tenancy setup, ensuring data isolation for each tenant while sharing resources.

## Rational

Multi-tenancy provides operational efficiency and cost reduction by sharing resources across tenants, which is ideal for organizations with multiple subsidiaries or similar banking entities.

## Implications

- The platform must technically support multi-tenancy, including data isolation and tenant identification.
- Gaps in multi-tenancy support must be identified and addressed.
- New software and technology selections must include multi-tenancy as a requirement.
- Exceptions for new services must be documented, with a backlog item to add multi-tenancy later.