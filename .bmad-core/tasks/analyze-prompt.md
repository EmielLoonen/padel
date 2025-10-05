<!-- Powered by BMAD™ Core -->

# Analyze Prompt Task

## Purpose

To systematically evaluate an existing prompt to identify its objective, assess its quality against best practices, and produce a structured report of findings and recommendations. This task ensures that any prompt refinement is based on a thorough and consistent analysis.

## SEQUENTIAL Task Execution

### 1. Identify Prompt and Context

- The user will provide a prompt as a file path or a block of text.
- Request any relevant context from the user, such as the target LLM, the intended audience, or the high-level goal of the prompt.

### 2. Deconstruct the Prompt

- **Identify the Core Objective:** Determine the primary goal of the prompt. What is the desired output?
- **Analyze the Structure:** Break down the prompt into its key components (e.g., persona/role, instructions, constraints, examples, output format).
- **Assess Clarity and Ambiguity:** Read through the prompt to identify any vague language, jargon, or potentially confusing instructions.
- **Evaluate Security:** Check for potential vulnerabilities, such as prompt injection risks or exposure of sensitive information.
- **Analyze Efficiency:** Assess the prompt for unnecessary verbosity or complexity that could lead to high token usage.

### 3. Generate Analysis Report

- Create a structured report in markdown format.
- The report must include the following sections:
    - **Prompt Objective:** A clear statement of the prompt's goal.
    - **Strengths:** What the prompt does well.
    - **Areas for Improvement:** A bulleted list of specific, actionable recommendations. For each recommendation, provide a brief explanation of *why* it's an improvement (e.g., "Clarify the output format to ensure consistent JSON responses").
    - **Security Assessment:** A summary of any identified security risks.
    - **Overall Score:** A simple rating (e.g., Good, Needs Improvement, Poor).

### 4. Output the Report

- Present the full analysis report to the user.
- Conclude by stating: "This analysis is complete. To apply these recommendations, you can now run the `refine` command."
