<!-- Powered by BMAD™ Core -->

# Generate Prompt Test Data Task

## Purpose

To create a structured dataset of test cases for a given prompt, enabling systematic and automated evaluation using frameworks like DeepEval.

## SEQUENTIAL Task Execution

### 1. Gather Inputs

- The user will provide a finalized prompt (as a file path or text) for which to generate test data.

### 2. Define Test Strategy

- Engage with the user to define the test strategy. Ask clarifying questions:
    - "What are the most critical success factors for this prompt?"
    - "Are there any specific edge cases or failure modes you are concerned about?"
    - "How many test cases should we generate for this initial evaluation?"

### 3. Generate Test Cases

- Based on the strategy, generate a list of test cases. Each test case must include:
    - `input`: A sample input for the prompt.
    - `expected_output`: The ideal, high-quality response that the prompt should produce for that input.
- CRITICAL: The generated test cases must be diverse and include:
    - **Happy Path Cases:** Standard, valid inputs.
    - **Edge Cases:** Inputs that test the boundaries or limits of the prompt.
    - **Negative Cases:** Inputs that are intentionally malformed or invalid, to test the prompt's error handling.

### 4. Format for Evaluation Framework

- The agent must format the generated test cases into a structured file.
- Ask the user for the desired format (e.g., YAML, JSON, CSV). Default to YAML if unsure.
- The structure must be compatible with popular evaluation tools, using common keys like `input` and `expected_output`.

### 5. Output the Test Data File

- Present the full set of test cases to the user for a final review.
- Ask the user for a file path to save the test data to.
- Save the structured data to the specified location.
- Conclude by stating: "The test data has been generated and saved. You can now use this file with your prompt evaluation framework."
