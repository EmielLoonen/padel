---
title: Replaceable Engagement Orchestration
url: https://backbase.atlassian.net/wiki/spaces/ARCH/pages/4547248214/Engagement+orchestration+is+replaceable
date: 2025-06-10 08:55:32
---

# Replaceable Engagement Orchestration

**Original**: Engagement orchestration is replaceable

Principle Reference: EM-PCA-1

## Statement

Engagement orchestration is replaceable, allowing channels to be used with either the Engage App or a third-party tool.

## Rational

Decoupling orchestration from channels provides flexibility, allowing customers to use their preferred marketing or notification tools while still leveraging Backbase's engagement channels.

## Implications

- Engagement channels and orchestration are decoupled.
- Orchestration logic resides in the Engagements capability or a third-party tool, not in the channels themselves.
- Channels are primitive and agnostic of the orchestration system.
- The Message Delivery layer is the entry point to channels for all orchestration systems.