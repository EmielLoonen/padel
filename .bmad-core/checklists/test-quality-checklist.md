# Test Quality Checklist

- [ ] **Test Coverage:**
  - [ ] Overall test coverage percentage is above the project's defined threshold (e.g., 80%).
  - [ ] Critical business logic and complex modules have high test coverage (>90%).
  - [ ] Branch coverage is analyzed and acceptable.
  - [ ] No significant gaps in test coverage for new features.

- [ ] **Test Case Quality:**
  - [ ] Test names are descriptive and reflect the tested behavior (e.g., `Given_When_Then` or `test_should_...`).
  - [ ] Each test focuses on a single responsibility/behavior.
  - [ ] Tests are independent and can be run in any order.
  - [ ] Test cases include positive, negative, and edge-case scenarios.
  - [ ] Assertions are specific, meaningful, and avoid complex logic. There is at least one assertion per test.

- [ ] **Code Quality in Tests:**
  - [ ] Tests are readable and maintainable.
  - [ ] No commented-out test code.
  - [ ] Avoids logic (loops, conditions) within test cases.
  - [ ] Test code follows the same coding standards as production code.
  - [ ] Mocks and stubs are used appropriately to isolate tests.

- [ ] **Test Suite Health:**
  - [ ] The test suite runs reliably without flaky tests.
  - [ ] Test execution time is reasonable.
  - [ ] Deprecated tests are removed or updated.
  - [ ] Test data is managed effectively and is representative of production scenarios.
