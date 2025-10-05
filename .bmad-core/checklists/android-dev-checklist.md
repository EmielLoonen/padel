# Android Developer Checklist

## Instructions for Android Developer Agent

Before coding, ensure you have activated the ai logging system and completed all Android development setup requirements.

[[LLM: INITIALIZATION INSTRUCTIONS - ANDROID DEV CHECKLIST VALIDATION

This checklist is for ANDROID DEVELOPER AGENTS to self-validate they are ready to code with Android SDK 36, Kotlin 2.1.10, and Koin 4.0.2.

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

### 2. **Android Environment Setup:**

[[LLM: Verify Android/Kotlin development environment is properly configured]]
   - [ ] Android SDK 36 or lower is configured
   - [ ] Kotlin 2.1.10 or lower is configured
   - [ ] Gradle build system is working
   - [ ] Android emulator or device available for testing
   - [ ] Koin 4.0.2 dependency injection library integrated
   - [ ] Target SDK ≤ 36 with proper backwards compatibility to Android 12

### 3. **Code Creation and Documentation:**

[[LLM: Be specific - ensure each requirement is met before starting to code]]
   - [ ] Read aidev.md BEFORE any file creation
   - [ ] ALL new Kotlin/Java/XML files MUST include AIDEV comments
   - [ ] NEVER create Android files without AIDEV comments
   - [ ] Include ALL relevant AIDEV tags (GENERATED, PROMPT, NOTE, etc.)
   - [ ] If the full file is new, only include the GENERATED tag
   - [ ] Log all code creation and modification in debug log

### 4. **Android Project Configuration:**

[[LLM: Ensure proper Android project setup and configuration]]
   - [ ] Android manifest configured correctly
   - [ ] Gradle build files properly configured
   - [ ] ProGuard/R8 configuration if needed
   - [ ] Android permissions declared appropriately
   - [ ] Version codes and names properly managed
   - [ ] Build variants configured (debug/release)

### 5. **Kotlin and Architecture:**

[[LLM: Verify proper Kotlin usage and Android architecture]]
   - [ ] Kotlin coroutines used for async operations
   - [ ] MVVM architecture pattern implemented
   - [ ] Android Architecture Components used (ViewModel, LiveData/StateFlow)
   - [ ] Data binding or view binding implemented
   - [ ] Repository pattern used for data management
   - [ ] Proper separation of concerns maintained

### 6. **Dependency Injection with Koin:**

[[LLM: Ensure proper Koin 4.0.2 setup and usage]]
   - [ ] Koin 4.0.2 properly configured in Application class
   - [ ] Modules defined correctly for different layers
   - [ ] ViewModels injected using Koin
   - [ ] Repository and data source dependencies managed by Koin
   - [ ] No manual dependency creation where Koin should be used

### 7. **UI and Material Design:**

[[LLM: Follow Material Design 3 guidelines and Android UI best practices]]
   - [ ] Material Design 3 components used appropriately
   - [ ] Layouts work across different screen sizes and orientations
   - [ ] Dark mode support implemented if required
   - [ ] Navigation component used for app navigation
   - [ ] Proper use of themes and styles
   - [ ] Accessibility features implemented (content descriptions, etc.)

### 8. **Testing Requirements:**

[[LLM: Comprehensive testing setup and execution]]
   - [ ] Unit tests written with JUnit for business logic
   - [ ] Android instrumented tests for UI components
   - [ ] Espresso tests for user interactions if applicable
   - [ ] Mockito or MockK used for mocking dependencies
   - [ ] All unit tests pass (./gradlew testDebugUnitTest)
   - [ ] All instrumented tests pass (./gradlew connectedAndroidTest)

### 9. **Build and Compilation:**

[[LLM: Ensure clean builds and proper Gradle configuration]]
   - [ ] Kotlin compilation successful (./gradlew compileDebugKotlin)
   - [ ] Gradle build passes (./gradlew build)
   - [ ] APK builds successfully (./gradlew assembleDebug)
   - [ ] No build warnings for new code
   - [ ] Android Lint passes (./gradlew lint)

### 10. **Android Lifecycle and Performance:**

[[LLM: Proper Android lifecycle handling and performance considerations]]
   - [ ] Activity and Fragment lifecycles handled correctly
   - [ ] Memory leaks prevented (proper cleanup in onDestroy)
   - [ ] Background processing follows Android guidelines
   - [ ] Database operations performed off main thread
   - [ ] Image loading optimized (Glide/Coil/Picasso)
   - [ ] Network requests handled properly with error states

### 11. **Platform Compatibility:**

[[LLM: Ensure compatibility across target Android versions]]
   - [ ] App works on Android 12 (API 31)
   - [ ] App works on Android 13 (API 33)
   - [ ] App works on Android 14 (API 34)
   - [ ] App works on Android 15+ (API 35/36)
   - [ ] Backwards compatibility handled properly
   - [ ] Runtime permissions handled correctly

### 12. **Security and Best Practices:**

[[LLM: Follow Android security and development best practices]]
   - [ ] Network security configuration if applicable
   - [ ] Sensitive data properly encrypted
   - [ ] API keys and secrets properly secured
   - [ ] Proper input validation implemented
   - [ ] No hardcoded credentials in code

## Final Validation

[[LLM: Complete final verification before marking ready for review]]

- [ ] **APK Build:** Debug APK builds and installs successfully
- [ ] **App Launch:** Application launches without crashes
- [ ] **Core Functionality:** All implemented features work as expected
- [ ] **Test Suite:** All unit and instrumented tests pass
- [ ] **Lint Checks:** Android Lint passes without violations
- [ ] **Performance:** App performs acceptably on target devices
- [ ] **Documentation:** All new code properly documented with AIDEV comments

## Notes Section

_Add any specific notes about technical decisions, deviations from standards, or areas requiring future attention:_

