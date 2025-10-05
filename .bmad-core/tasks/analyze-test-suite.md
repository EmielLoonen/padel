# Task: Analyze Test Suite

**Objective:** To perform a comprehensive analysis of the project's test suite, including running tests, checking coverage, and evaluating the quality of the tests against a checklist.

**Elicit**: false

## Steps:

1.  **Identify Project Type and Testing Framework:**
    -   Scan the project for key files (`package.json`, `pom.xml`, `build.gradle`, `Gemfile`, `requirements.txt`, etc.) to determine the project type (e.g., Node.js, Java, Ruby, Python).
    -   Based on the project type and dependencies, identify the testing framework in use (e.g., Jest, JUnit, RSpec, pytest).

2.  **Execute Tests:**
    -   Find the command to run the tests from the project's configuration (e.g., `npm test`, `mvn test`).
    -   Execute the test command and capture the results.
    -   Report any test failures. If tests fail, ask the user if you should proceed with the analysis.

3.  **Measure Test Coverage:**
    -   Find the command to run test coverage (e.g., `npm test -- --coverage`, `mvn jacoco:report`).
    -   Execute the command and capture the coverage report. Note the overall coverage percentage and any other relevant metrics.

4.  **Evaluate Test Quality:**
    -   Load the `test-quality-checklist.md`.
    -   Review a representative sample of test files from the project.
    -   For each item in the checklist, evaluate the test suite and provide an assessment. Document your findings.

5.  **Calculate Quality Score:**
    -   Based on the findings from the previous steps, assign a score (out of 100) to each of the following categories:
        -   **Test Organization:** (Structure, naming, separation of concerns)
        -   **Coverage Breadth:** (How much of the code is covered)
        -   **Test Patterns:** (Given-When-Then, mocking, assertions)
        -   **Infrastructure:** (Base classes, utilities, test data)
        -   **Maintainability:** (Readability, complexity, test setup)
    -   Calculate an overall score by averaging the scores of the categories.
    -   Assign a letter grade (e.g., A, B+, C) based on the overall score.

6.  **Generate Report:**
    -   Load the `test-analysis-tmpl.yaml` template.
    -   Populate the template with all the gathered information, including the calculated quality scores, test execution results, coverage metrics, and recommendations.

7.  **Present Report:**
    -   Present the final report generated from the template to the user.
