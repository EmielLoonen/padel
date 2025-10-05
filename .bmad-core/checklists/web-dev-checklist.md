# Web Developer Checklist

## Instructions for Web Developer Agent

Before coding, ensure you have activated the ai logging system and completed all web development setup requirements.

[[LLM: INITIALIZATION INSTRUCTIONS - WEB DEV CHECKLIST VALIDATION

This checklist is for WEB DEVELOPER AGENTS to self-validate they are ready to code with Node.js 22, Angular 21, ESLint, Bootstrap 5, and Playwright.

IMPORTANT: This is a self-assessment. Be honest about what's actually done vs what should be done. It's better to identify issues now than have them found in review.

EXECUTION APPROACH:

1. Go through each section systematically
2. Mark items as [x] Done, [ ] Not Done, or [N/A] Not Applicable
3. Add brief comments explaining any [ ] or [N/A] items
4. Be specific about what was actually implemented
5. Flag any concerns or technical debt created

The goal is quality delivery, not just checking boxes.]]

## Checklist Items

### 1. **Logging System:**

[[LLM: Be specific - ensure each requirement is met before starting to code]]
Initialize logging system
   - [ ] Read core-config.yaml
   - [ ] Verify/create .ai directory
   - [ ] Verify/create or amend debug log file
   - [ ] Never overwrite existing debug log file
   - [ ] Only amend to the debug log
   - [ ] Never change existing log entries
   - [ ] Log activation event

### 2. **Development Environment Setup:**

[[LLM: Verify Node.js/Angular/tooling environment is properly configured]]
   - [ ] Node.js 22 is installed and active
   - [ ] Angular CLI 21 is available and working
   - [ ] TypeScript compiler is configured correctly
   - [ ] ESLint configuration is present and working
   - [ ] Playwright 1.19+ is installed for E2E testing
   - [ ] Bootstrap 5 is properly integrated

### 3. **Code Creation and Documentation:**

[[LLM: Be specific - ensure each requirement is met before starting to code]]
   - [ ] Read aidev.md BEFORE any file creation
   - [ ] ALL new TypeScript/JavaScript/HTML/CSS files MUST include AIDEV comments
   - [ ] NEVER create web files without AIDEV comments
   - [ ] Include ALL relevant AIDEV tags (GENERATED, PROMPT, NOTE, etc.)
   - [ ] If the full file is new, only include the GENERATED tag
   - [ ] Log all code creation and modification in debug log

### 4. **Angular Configuration:**

[[LLM: Ensure proper Angular 21 setup and configuration]]
   - [ ] Angular workspace configuration is correct
   - [ ] TypeScript strict mode is enabled
   - [ ] Angular standalone components used where appropriate
   - [ ] Angular Material or ng-bootstrap integrated if needed
   - [ ] Routing configuration setup properly
   - [ ] Environment files configured for different targets

### 5. **TypeScript and Code Quality:**

[[LLM: Verify proper TypeScript usage and code standards]]
   - [ ] TypeScript interfaces and types properly defined
   - [ ] No TypeScript compilation errors
   - [ ] ESLint rules pass without violations
   - [ ] Proper use of Angular decorators (@Component, @Injectable, etc.)
   - [ ] RxJS patterns used correctly for reactive programming
   - [ ] Dependency injection implemented properly

### 6. **Responsive Design and Bootstrap:**

[[LLM: Ensure responsive design and proper Bootstrap usage]]
   - [ ] Bootstrap 5 utilities and components used correctly
   - [ ] Responsive design works on mobile (320px+)
   - [ ] Responsive design works on tablet (768px+)
   - [ ] Responsive design works on desktop (1024px+)
   - [ ] Bootstrap grid system used appropriately
   - [ ] Custom CSS follows Bootstrap patterns

### 7. **Testing Requirements:**

[[LLM: Comprehensive testing setup and execution]]
   - [ ] Unit tests written with Karma/Jasmine for new components
   - [ ] Component testing includes proper mocking
   - [ ] E2E tests written with Playwright for user journeys
   - [ ] All unit tests pass (ng test)
   - [ ] All E2E tests pass (npx playwright test)
   - [ ] Test coverage meets project requirements

### 8. **Build and Compilation:**

[[LLM: Ensure clean builds and proper Angular configuration]]
   - [ ] TypeScript compilation successful (ng build)
   - [ ] Development build works (ng serve)
   - [ ] Production build successful (ng build --configuration=production)
   - [ ] No build warnings for new code
   - [ ] Bundle size is within acceptable limits

### 9. **Performance and Optimization:**

[[LLM: Follow Angular and web performance best practices]]
   - [ ] OnPush change detection strategy used where appropriate
   - [ ] Lazy loading implemented for feature modules
   - [ ] Images optimized and properly sized
   - [ ] No memory leaks in subscriptions (proper unsubscribe)
   - [ ] Lighthouse performance score acceptable for key pages

### 10. **Accessibility and Standards:**

[[LLM: Ensure web accessibility and modern standards compliance]]
   - [ ] Basic WCAG 2.1 compliance implemented
   - [ ] Proper semantic HTML elements used
   - [ ] ARIA labels and roles added where needed
   - [ ] Keyboard navigation works properly
   - [ ] Screen reader compatibility verified
   - [ ] Color contrast meets accessibility standards

### 11. **Browser Compatibility:**

[[LLM: Verify cross-browser functionality]]
   - [ ] Application works in Chrome (latest)
   - [ ] Application works in Firefox (latest)
   - [ ] Application works in Safari (latest)
   - [ ] Application works in Edge (latest)
   - [ ] Mobile browsers tested (iOS Safari, Chrome Mobile)

## Final Validation

[[LLM: Complete final verification before marking ready for review]]

- [ ] **Full Build:** Production build passes without errors
- [ ] **Test Suite:** All unit and E2E tests pass
- [ ] **ESLint:** Code quality checks pass
- [ ] **Responsive Design:** Application works across all target devices
- [ ] **Performance:** Application loads and performs acceptably
- [ ] **Accessibility:** Basic accessibility requirements met
- [ ] **Documentation:** All new code properly documented with AIDEV comments

## Notes Section

_Add any specific notes about technical decisions, deviations from standards, or areas requiring future attention:_

