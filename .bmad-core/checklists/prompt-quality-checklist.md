<!-- Powered by BMAD™ Core -->

# Prompt Quality Checklist

## Purpose

To provide a final quality gate for a prompt before it is finalized. This checklist ensures that all prompts created or refined by the `pe` agent meet a consistent standard of quality.

## Checklist Criteria

### Core Requirements
- [ ] **Clarity:** Is the prompt's objective clear, specific, and unambiguous?
- [ ] **Role Definition:** Is the persona or role for the AI clearly defined?
- [ ] **Instructional Integrity:** Are the instructions sequential, logical, and easy for an LLM to follow?
- [ ] **Completeness:** Does the prompt contain all necessary information for the LLM to complete the task without needing to make assumptions?

### Structure & Formatting
- [ ] **Output Format:** Is the desired output format explicitly and clearly defined (e.g., JSON schema, markdown structure)?
- [ ] **Constraints:** Are all constraints, limitations, and negative constraints ("Do not do X") clearly stated?
- [ ] **Use of Delimiters:** Does the prompt make effective use of delimiters (e.g., ```, ###, <xml tags>) to separate sections?

### Security & Efficiency
- [ ] **Security:** Has the risk of prompt injection been considered and mitigated where possible?
- [ ] **Conciseness:** Is the prompt as concise as it can be without sacrificing clarity? Are there redundant tokens or instructions?

### Testability
- [ ] **Testable:** Can the prompt's output be objectively verified against a set of test cases?
