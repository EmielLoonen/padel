# E2E Test Generation

Generate Playwright E2E tests using MCP service integration for web applications with proper Gherkin feature file processing and project structure validation.

## Purpose

This task orchestrates the generation of comprehensive Playwright E2E tests by collecting required inputs, validating project structure, and interfacing with the remote MCP service for test generation. It ensures proper integration between Gherkin feature specifications and Playwright test implementations.

## Context

Use this task when you need to generate or extend Playwright E2E tests for web applications that follow the journey-library pattern. The task handles MCP service communication, validates project structure, and ensures generated tests align with existing patterns.

## Prerequisites

- MCP server connection configured in cursor settings
- Playwright project structure exists in target application
- Gherkin feature files are properly formatted
- Journey library structure follows established patterns

## Required Inputs

- **gherkin_feature**: Full content of the .feature file (must include 'Feature:' and at least one 'Scenario:')
- **lib_name**: Name of the journey-library to generate/extend (lib-level identifier)
- **target_app**: Playwright application that will run the tests (app-level identifier)

## Optional Inputs

- **existing_files**: Pre-collected list of project files (auto-scanned if omitted)
- **additional_info**: Additional documentation or context files

## Workflow Steps

1. **Validate MCP Connection**
   - Verify MCP server is configured and accessible
   - Test connection to remote-devs-mcp-server
   - Halt if connection fails with clear error message

2. **Collect Required Inputs**
   - Elicit gherkin_feature file path or content
   - Validate Gherkin syntax (Feature: and Scenario: present)
   - Collect lib_name (journey library identifier)
   - Collect target_app (Playwright app identifier)

3. **Validate Project Structure**
   - Verify target_app exists and has Playwright configuration
   - Confirm lib_name directory structure exists or can be created
   - Check for existing page objects and spec files in lib_name/e2e-tests/

4. **Prepare File Context**
   - Scan existing_files if not provided
   - Identify relevant page objects in lib_name/e2e-tests/page-objects/
   - Identify existing spec files in lib_name/e2e-tests/specs/
   - Collect additional documentation if specified

5. **Execute MCP Test Generation**
   - Check MCP server connection
   - On MCP error: Attempt ONE retry with connection/parameter validation
   - If retry fails: **IMMEDIATELY HALT EXECUTION - DO NOT PROCEED WITH MANUAL GENERATION**
   - **CRITICAL: MCP failure means TASK FAILURE - user intervention required**
   - Format inputs according to MCP service requirements
   - Execute playwright_e2e_instructions command using template below
   - Monitor generation progress and handle errors with retry logic
   - Validate generated output structure only if MCP succeeds

6. **Validate Generated Tests**
   - Verify generated test files follow Playwright patterns
   - Check integration with existing page objects
   - Validate test structure and imports
   - Ensure tests can be executed without errors

7. **Integration Verification**
   - Run generated tests to verify functionality
   - Check test output and reporting
   - Validate integration with existing test suite
   - Document any integration issues

## Validation Steps

1. MCP connection responds successfully
2. All required inputs are properly formatted
3. Project structure validation passes
4. Generated tests compile without errors
5. Tests execute successfully in Playwright
6. Generated files follow established patterns
7. Integration with existing codebase is seamless

## Quality Criteria

- Generated tests follow Playwright best practices
- Page object integration is properly implemented
- Test scenarios match Gherkin specifications exactly
- Generated code is clean and maintainable
- All imports and dependencies are correctly resolved
- Tests provide meaningful assertions and validation

## Expected Outputs

- Generated Playwright test files (.spec.ts)
- Updated or new page object files (.po.ts)
- Test configuration updates if needed
- Integration documentation

## Key Deliverables

- Functional E2E tests that execute successfully
- Proper integration with journey library structure
- Clean, maintainable test code following patterns
- Documentation of any new patterns or approaches

## Elicitation Format

When collecting inputs, use this format:

**Select gherkin feature source:**
1. Provide file path to existing .feature file
2. Paste feature content directly
3. Create new feature file interactively

**Journey Library Configuration:**
- lib_name: `libs/[journey-name]` (e.g., libs/journey-accounts)
- target_app: `apps/[app-name]` (e.g., apps/playwright-e2e)

**Additional Context (optional):**
- existing_files: List of relevant project files
- additional_info: Documentation or API references

## Error Handling

- **MCP Connection Failed**: 
  - Attempt ONE retry with connection validation
  - If retry fails: HALT execution and display message: "❌ **E2E TEST GENERATION FAILED** - MCP server connection failed. This task requires MCP-provided instructions and cannot proceed with manual generation. Please verify MCP server configuration in cursor settings and ensure connectivity before retrying."
  - Log full error details to debug log
  - **DO NOT CONTINUE WITH TASK EXECUTION**
- **MCP Service Error**: 
  - Attempt ONE retry with adjusted/validated parameters
  - If retry fails: HALT execution and display message: "❌ **E2E TEST GENERATION FAILED** - MCP service returned an error. This task requires MCP-provided instructions and cannot proceed with manual generation. Please review inputs and resolve MCP service issues before retrying."
  - Log full error context to debug log
  - **DO NOT CONTINUE WITH TASK EXECUTION**
- **Invalid Gherkin**: Show syntax requirements and examples
- **Project Structure Issues**: Guide user through structure creation
- **CRITICAL**: Never proceed with E2E test generation without valid MCP instructions - user intervention is required for all MCP failures

## MCP Integration Template

```
[MCP] playwright_e2e_instructions for Playwright E2E test generation

CRITICAL: Strictly follow instructions provided by the MCP service exactly. You must not shift your focus from the MCP instructions or supplement them with your own patterns.

Generate Playwright E2E test.

Inputs:
gherkin_feature: {{gherkin_feature_path_or_content}}
target_app: {{target_app}}
lib_name: {{lib_name}}
existing_files:
{{#each existing_files}}
  - {{this}}
{{/each}}
{{#if additional_info}}
additional-info: {{additional_info}}
{{/if}}
```
