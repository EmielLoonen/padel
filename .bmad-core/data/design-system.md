# Backbase Design System Knowledge Base

## Overview

The Backbase Design System provides a comprehensive foundation for building consistent, scalable, and accessible financial services interfaces. It leverages **design tokens** for systematic design decisions and **atomic design methodology** for component organization.

**Key Resources:**
- Design System: https://designsystem.backbase.com/
- Design Tokens: https://designsystem.backbase.com/design-tokens
- Figma Plugin: https://www.figma.com/community/plugin/1242854170633510478/design-system-visualizer

## Design Tokens Architecture

### Three-Tier Token System

1. **Primitive Tokens**: Foundational HEX-based colors, not for direct UI use
2. **Semantic Tokens**: Reference primitive tokens, provide functional meaning
3. **Component Tokens**: Apply semantic tokens to specific UI components

### Token Categories

#### Primitive Colors
- Low-level tokens that define semantic tokens
- HEX-based definitions (e.g., `primitive.blue.600: "#1565C0"`)
- Not intended for direct UI use
- Neutral, agnostic color descriptions

#### Semantic Colors
- Reference primitive tokens instead of HEX codes
- Six categories for comprehensive UI coverage:

**Background Colors**: Surface hierarchies and page backgrounds
- `background/page`: Primary page background
- `background/surface-1`: Elevated container background
- `background/brand`: Brand-colored backgrounds

**Foreground Colors**: Text and icon colors
- `text/primary`: Primary text color
- `text/secondary`: Secondary text color
- `text/brand`: Brand-colored text

**Border Colors**: UI element separators
- `border/default`: Standard border color
- `border/separator`: Divider color
- `border/focus`: Focus state borders

**On Background Colors**: Special foreground colors for specific backgrounds
- Ensure accessible contrast ratios
- Designed for various theming scenarios

**Focus Colors**: Interactive element highlighting
- `focus/default`: Standard focus indicator
- Used on neutral backgrounds for accessibility

**Link Colors**: Hyperlink colors for different contexts
- `link/default`: Standard link color
- `link/on-color`: For dark/saturated backgrounds

### Motion Tokens
- Consistent animation and micro-interaction patterns
- Available at: https://designsystem.backbase.com/motion-beta/motion-tokens

## Atomic Design Implementation

### Component Hierarchy

#### 1. Atoms (Basic Building Blocks)
**Typography**: Text, Heading, Label
**Form Elements**: Input, Button, Checkbox, Radio, Select
**Visual Elements**: Icon, Avatar, Badge, Divider
**Financial Atoms**: Currency, Percentage, Account Number

#### 2. Molecules (Simple Groups)
**Navigation**: Breadcrumb, Pagination, Tab Group
**Forms**: Input Group, Search Bar, Filter Control
**Content**: Card Header, List Item, Alert
**Financial**: Account Summary, Transaction Item, Portfolio Item

#### 3. Organisms (Complex Assemblies)
**Navigation**: Header, Sidebar, Footer
**Content**: Data Table, Card Grid, Dashboard Panel
**Financial**: Account Dashboard, Transaction History, Portfolio Overview, Payment Form

#### 4. Templates (Page Structures)
**Layouts**: Dashboard Layout, Detail Page Layout, Modal Layout
**Financial**: Account Overview Template, Transaction Template, Transfer Template

#### 5. Pages (Specific Instances)
**Core Pages**: Account Dashboard, Transaction History, Transfer Money, Investment Portfolio

## Implementation Guidelines

### Token Usage Rules
- **Always reference tokens**, never hard-coded values
- **Use semantic tokens** for UI implementation, not primitive tokens
- **Follow three-tier hierarchy**: Primitive → Semantic → Component
- **Leverage token references** for automatic global updates

### CSS Implementation
```css
:root {
  --bb-color-primary: var(--semantic-background-brand);
  --bb-text-primary: var(--semantic-text-primary);
  --bb-border-default: var(--semantic-border-default);
}
```

### Component Naming Convention
```yaml
# Semantic Token Pattern
semantic.category.purpose: "{primitive.color.shade}"

# Examples
semantic.background.brand: "{primitive.blue.600}"
semantic.text.primary: "{primitive.neutral.900}"
semantic.border.separator: "{primitive.neutral.300}"
```

## Financial Services Considerations

### Security & Trust
- High-contrast styling for critical actions
- Clear error states for security violations
- Multi-step verification patterns
- Loading states for sensitive operations

### Accessibility Standards
- **WCAG 2.1 AA compliance** for all components
- **4.5:1 contrast ratio** minimum for text
- **3:1 contrast ratio** minimum for interactive elements
- **Full keyboard navigation** support
- **Screen reader compatibility** with semantic markup

### Localization Support
- RTL language support in design tokens
- Locale-aware currency formatting
- Regional date/time formatting
- Locale-specific number formatting

## Design System Tooling

### Figma Integration
- **Design System Visualizer Plugin**: Converts brand colors to complete token sets
- **Automated Asset Import**: Direct import to iOS, Android, and Web apps
- **Token Synchronization**: Maintains consistency across design and development

### Migration Support
- **Web Migration Guide**: Step-by-step semantic token API transition
- **iOS Migration Guide**: Platform-specific migration process
- **Figma Migration**: Specialized tools and plugins for design file updates
- **Deprecated Token Support**: Backward compatibility during migration periods

## UX Expert Integration

### Component Specification Best Practices
- Reference specific token names in documentation
- Include accessibility requirements for each component
- Document interactive states using semantic tokens
- Specify responsive behavior using layout tokens

### Design Handoff Requirements
- Include token mappings in developer specifications
- Validate designs against established token values
- Generate style guides from token definitions
- Document component variants using atomic hierarchy

### Quality Assurance
- Test color contrast ratios using semantic tokens
- Validate token usage across breakpoints
- Ensure accessibility compliance with focus tokens
- Test with assistive technologies

## Quick Reference

### Essential Token Patterns
```yaml
# Colors
semantic.background.surface: Primary container background
semantic.text.primary: Main text color
semantic.border.default: Standard borders
semantic.background.brand: Brand accent color

# Interactive States
semantic.focus.default: Focus indicators
semantic.link.default: Standard links
semantic.button.primary: Primary action buttons

# Financial Context
semantic.positive: Gains/profits
semantic.negative: Losses/debts
semantic.pending: Pending transactions
```

### Component Development Checklist
- [ ] Use semantic tokens for all styling
- [ ] Follow atomic design hierarchy
- [ ] Include all interactive states
- [ ] Test accessibility compliance
- [ ] Validate responsive behavior
- [ ] Document token dependencies

### Migration Priorities
1. Update color references to semantic tokens
2. Replace hard-coded values with token references
3. Implement new token hierarchy structure
4. Test cross-platform consistency
5. Update documentation and style guides

## Additional Resources

**Documentation**: https://designsystem.backbase.com/design-tokens
**Migration Guides**: Platform-specific guides available for Web, iOS, and Figma
**Community**: Design Tokens Community Group standards
**Tooling**: Figma plugins and automated token generation tools
