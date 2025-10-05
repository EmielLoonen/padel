---
title: Out-of-the-Box External Integration
url: https://backbase.atlassian.net/wiki/spaces/ARCH/pages/4514414870/Capabilities+with+external+integration+must+have+it+implemented+out+of+the+box+by+default
date: 2025-06-10 08:55:57
---

# Out-of-the-Box External Integration

**Original**: Capabilities with external integration must have it implemented out of the box by default

Principle Reference: I-PCA-2

## Statement

Capabilities requiring external integration must be implemented out-of-the-box with at least one opinionated third-party or core banking service.

## Rational

This approach ensures that capabilities are tested with real integrations, improving quality and leveraging the IP of external providers. It also promotes alignment with the Grand Central integration strategy.

## Implications

- Capability teams must prioritize real integrations over mocks.
- Mocks should only be used as an exception with approval from Product Directors.
- The quality and content of data are critical for both real and mocked integrations.