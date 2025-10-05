---
title: Configure, Extend, Build
url: https://backbase.atlassian.net/wiki/spaces/ARCH/pages/4530241729/Configure+before+Extend+before+Build
date: 2025-06-10 08:54:34
---

# Configure, Extend, Build

**Original**: Configure before Extend before Build

Principle Reference: BP-PCA-6

## Statement

Changes to platform functionality should be implemented through configuration first, then extension, and finally as a separate build. This applies to all platform functionalities and implementations.

## Rational

This structured approach ensures stability, consistency, and predictability while reducing implementation time and increasing flexibility. It prioritizes configuration to maintain architectural integrity and simplifies upgrades.

## Implications

- All functionalities must provide clear configuration options.
- Data and functional extensions should be validated and implemented with clear extension points.
- Over-dependence on single components for configuration should be avoided.
- Upgrade strategies must be considered for all configurations and extensions.
- All configuration and extension possibilities must be documented.