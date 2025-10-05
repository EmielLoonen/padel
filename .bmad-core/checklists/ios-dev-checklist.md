# iOS Developer Checklist

## Instructions for iOS Developer Agent

Before coding, ensure you have activated the ai logging system and completed all iOS development setup requirements.

[[LLM: INITIALIZATION INSTRUCTIONS - IOS DEV CHECKLIST VALIDATION

This checklist is for IOS DEVELOPER AGENTS to self-validate they are ready to code with iOS 15-18+, Xcode 16.2+, and Swift.

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

### 2. **iOS Development Environment Setup:**

[[LLM: Verify Xcode/iOS development environment is properly configured]]
   - [ ] Xcode 16.2+ is installed and configured
   - [ ] iOS SDK 15-18+ available for development
   - [ ] Swift Package Manager configured
   - [ ] iOS Simulator available for testing
   - [ ] Apple Developer account configured if needed
   - [ ] Code signing certificates properly setup

### 3. **Code Creation and Documentation:**

[[LLM: Be specific - ensure each requirement is met before starting to code]]
   - [ ] Read aidev.md BEFORE any file creation
   - [ ] ALL new Swift/Objective-C files MUST include AIDEV comments
   - [ ] NEVER create iOS files without AIDEV comments
   - [ ] Include ALL relevant AIDEV tags (GENERATED, PROMPT, NOTE, etc.)
   - [ ] If the full file is new, only include the GENERATED tag
   - [ ] Log all code creation and modification in debug log

### 4. **iOS Project Configuration:**

[[LLM: Ensure proper iOS project setup and configuration]]
   - [ ] Xcode project/workspace configured correctly
   - [ ] Deployment target set appropriately (iOS 15+)
   - [ ] Bundle identifier and version properly configured
   - [ ] Info.plist configured with required permissions
   - [ ] Schemes configured for different environments
   - [ ] Build settings optimized for target deployment

### 5. **Swift and Architecture:**

[[LLM: Verify proper Swift usage and iOS architecture patterns]]
   - [ ] Modern Swift features used appropriately (async/await, Result types)
   - [ ] MVVM or similar architecture pattern implemented
   - [ ] Combine framework used for reactive programming
   - [ ] SwiftUI or UIKit used consistently
   - [ ] Dependency injection implemented properly
   - [ ] Protocol-oriented programming patterns used

### 6. **UI and Human Interface Guidelines:**

[[LLM: Follow Apple Human Interface Guidelines and iOS design patterns]]
   - [ ] Apple Human Interface Guidelines followed
   - [ ] UI works across different iPhone screen sizes
   - [ ] UI works on iPad if universal app
   - [ ] Dark mode support implemented
   - [ ] Dynamic Type support for accessibility
   - [ ] Navigation patterns follow iOS conventions
   - [ ] Proper use of system colors and fonts

### 7. **Data Management:**

[[LLM: Proper data persistence and management]]
   - [ ] Core Data or SwiftData used for local persistence
   - [ ] UserDefaults used appropriately for simple settings
   - [ ] Keychain used for sensitive data storage
   - [ ] Network layer properly implemented (URLSession/Alamofire)
   - [ ] Data models properly defined with Codable
   - [ ] Error handling implemented with Result types

### 8. **Testing Requirements:**

[[LLM: Comprehensive testing setup and execution]]
   - [ ] Unit tests written with XCTest framework
   - [ ] UI tests written with XCUITest where applicable
   - [ ] Mock objects used for testing dependencies
   - [ ] Test coverage adequate for business logic
   - [ ] All unit tests pass (xcodebuild test)
   - [ ] All UI tests pass if present

### 9. **Build and Compilation:**

[[LLM: Ensure clean builds and proper Xcode configuration]]
   - [ ] Swift compilation successful (xcodebuild build)
   - [ ] No compiler warnings for new code
   - [ ] App builds for all target devices/simulators
   - [ ] Static analysis passes (Xcode Analyzer)
   - [ ] Archive builds successfully for distribution

### 10. **iOS Lifecycle and Performance:**

[[LLM: Proper iOS lifecycle handling and performance considerations]]
   - [ ] App lifecycle states handled correctly
   - [ ] Memory management proper (no retain cycles)
   - [ ] Background processing follows iOS guidelines
   - [ ] Network requests handled with proper error states
   - [ ] Image loading and caching optimized
   - [ ] Instruments profiling shows acceptable performance

### 11. **Platform Compatibility:**

[[LLM: Ensure compatibility across target iOS versions]]
   - [ ] App works on iOS 15
   - [ ] App works on iOS 16
   - [ ] App works on iOS 17
   - [ ] App works on iOS 18+
   - [ ] Backwards compatibility handled with @available checks
   - [ ] Feature availability checked at runtime

### 12. **Security and Privacy:**

[[LLM: Follow iOS security and privacy best practices]]
   - [ ] App Transport Security configured properly
   - [ ] Privacy permissions requested appropriately
   - [ ] Sensitive data encrypted and secured
   - [ ] API keys and secrets properly secured
   - [ ] Privacy policy compliance if applicable
   - [ ] App Store guidelines followed

### 13. **Accessibility:**

[[LLM: Ensure iOS accessibility features are properly implemented]]
   - [ ] VoiceOver support implemented
   - [ ] Accessibility labels and hints provided
   - [ ] Dynamic Type support for font scaling
   - [ ] High contrast mode support
   - [ ] Reduce Motion preferences respected
   - [ ] Accessibility Inspector validation passed

## Final Validation

[[LLM: Complete final verification before marking ready for review]]

- [ ] **App Build:** App builds and launches successfully
- [ ] **Core Functionality:** All implemented features work as expected
- [ ] **Test Suite:** All unit and UI tests pass
- [ ] **Static Analysis:** Xcode Analyzer passes without issues
- [ ] **Performance:** App performs acceptably on target devices
- [ ] **Human Interface Guidelines:** UI follows Apple design principles
- [ ] **App Store Compliance:** App follows App Store submission guidelines
- [ ] **Documentation:** All new code properly documented with AIDEV comments

## Notes Section

_Add any specific notes about technical decisions, deviations from standards, or areas requiring future attention:_

