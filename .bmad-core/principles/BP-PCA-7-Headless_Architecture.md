---
title: Headless Architecture
url: https://backbase.atlassian.net/wiki/spaces/ARCH/pages/4513761174/Use+Headless+Architecture+paradigm+for+Platform+Functionality
date: 2025-06-10 08:54:42
---

# Headless Architecture

**Original**: Use Headless Architecture paradigm for Platform Functionality

Principle Reference: BP-PCA-7

## Statement

Engagement Banking Capabilities must be usable by non-EBP front-end components, with the Client API and foundational services as the primary integration point.

## Rational

This supports customers who wish to build their own front-end applications due to different technology stacks, custom journey requirements, or the need to integrate with multiple channels.

## Implications

- Clear documentation is required for using EBP capabilities in a headless setup.
- All relevant capabilities must be designed and tested for headless operation.
- Non-UI integration, such as exposing APIs for Open Banking, is not currently supported.