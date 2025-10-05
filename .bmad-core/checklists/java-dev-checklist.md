# Java Spring Boot Developer Checklist

## Instructions for Java Developer Agent

Before coding, ensure you have activated the ai logging system and completed all Java-specific setup requirements.

[[LLM: INITIALIZATION INSTRUCTIONS - JAVA DEV CHECKLIST VALIDATION

This checklist is for JAVA DEVELOPER AGENTS to self-validate they are ready to code with Java 21, Spring Boot 3.5, and Maven.

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

### 2. **Java Environment Setup:**

[[LLM: Verify Java/Spring/Maven environment is properly configured]]
   - [ ] Java 21 LTS is configured and available
   - [ ] Maven 3.6+ is available and working
   - [ ] Spring Boot 3.5 dependency versions are correct
   - [ ] Project uses proper Java 21 language level settings
   - [ ] Maven wrapper (mvnw) is available if required

### 3. **Code Creation and Documentation:**

[[LLM: Be specific - ensure each requirement is met before starting to code]]
   - [ ] Read aidev.md BEFORE any file creation
   - [ ] ALL new Java files MUST include AIDEV comments at creation time
   - [ ] NEVER create Java files without AIDEV comments
   - [ ] Include ALL relevant AIDEV tags (GENERATED, PROMPT, NOTE, etc.)
   - [ ] If the full file is new, only include the GENERATED tag
   - [ ] Log all code creation and modification in debug log

### 4. **Spring Boot Configuration:**

[[LLM: Ensure proper Spring Boot setup and configuration]]
   - [ ] Application properties/yaml configured correctly
   - [ ] Spring Boot main application class properly annotated
   - [ ] Component scanning configured if needed
   - [ ] Database configuration setup (if applicable)
   - [ ] Spring Boot Actuator endpoints configured
   - [ ] Proper profile-based configuration (dev, test, prod)

### 5. **Dependency Injection & Annotations:**

[[LLM: Verify proper use of Spring annotations and DI patterns]]
   - [ ] Use @Component, @Service, @Repository, @Controller appropriately
   - [ ] Proper constructor injection instead of field injection
   - [ ] @Autowired used sparingly and correctly
   - [ ] Configuration classes use @Configuration and @Bean properly
   - [ ] No circular dependencies in DI configuration

### 6. **Java 21 Modern Features:**

[[LLM: Leverage modern Java features where appropriate]]
   - [ ] Use Records for data transfer objects where appropriate
   - [ ] Pattern matching used where it improves readability
   - [ ] Virtual threads considered for I/O intensive operations
   - [ ] Text blocks used for multi-line strings
   - [ ] Switch expressions used instead of statements where beneficial

### 7. **Testing Requirements:**

[[LLM: Comprehensive testing setup and execution]]
   - [ ] JUnit 5 tests written for all new functionality
   - [ ] Spring Boot Test slices used appropriately (@WebMvcTest, @DataJpaTest, etc.)
   - [ ] MockBean and TestContainers used for integration testing
   - [ ] Test application properties configured
   - [ ] All unit tests pass (mvn test)
   - [ ] Integration tests pass if present (mvn verify)

### 8. **Build and Compilation:**

[[LLM: Ensure clean builds and proper Maven configuration]]
   - [ ] Maven compilation successful (mvn compile)
   - [ ] No compilation warnings for new code
   - [ ] Maven package builds successfully (mvn package)
   - [ ] Spring Boot application starts without errors
   - [ ] Application context loads successfully in tests

### 9. **Code Quality:**

[[LLM: Follow Java and Spring Boot best practices]]
   - [ ] Code follows Java naming conventions
   - [ ] Spring Boot best practices followed
   - [ ] Proper exception handling implemented
   - [ ] Logging configured and used appropriately (SLF4J)
   - [ ] No SonarQube violations if configured
   - [ ] Security best practices followed

### 10. **API and Documentation:**

[[LLM: If creating REST APIs, ensure proper documentation]]
   - [ ] REST endpoints follow RESTful conventions
   - [ ] Proper HTTP status codes returned
   - [ ] Request/Response DTOs properly defined
   - [ ] OpenAPI/Swagger documentation if required
   - [ ] Validation annotations used on input DTOs

## Final Validation

[[LLM: Complete final verification before marking ready for review]]

- [ ] **Full Maven Build:** Complete build passes (mvn clean package)
- [ ] **Application Startup:** Spring Boot application starts successfully
- [ ] **Test Suite:** All tests pass without errors
- [ ] **Code Standards:** Code follows established Java/Spring conventions
- [ ] **Documentation:** All new code properly documented with AIDEV comments
- [ ] **Performance:** No obvious performance issues introduced
- [ ] **Security:** Security considerations addressed appropriately

## Notes Section

_Add any specific notes about technical decisions, deviations from standards, or areas requiring future attention:_

