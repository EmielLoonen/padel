<!-- Powered by BMAD™ Core -->

# Refine Prompt Task

## Purpose

To take an existing prompt and an analysis report and produce a new, improved version that incorporates the recommended changes. This task provides a clear and traceable path from analysis to implementation.

## SEQUENTIAL Task Execution

### 1. Gather Inputs

- The user will provide the existing prompt (as a file path or text).
- The agent should have the analysis report from the `analyze` task in its current context. If not, it should run the `analyze-prompt` task first.

### 2. Apply Recommendations

- Systematically go through each recommendation in the "Areas for Improvement" section of the analysis report.
- Rewrite the prompt, applying each recommendation.

### 3. Generate a Changelog

- After refining the prompt, create a "Refinement Summary" in markdown format.
- This summary must include:
    - A bulleted list of the changes that were made.
    - For each change, a brief explanation of the "why" – how this change addresses a specific weakness identified in the analysis.
    - **Example:** "- **Change:** Added specific XML tags for output. **Reason:** To ensure a consistent, machine-readable output format, addressing the 'ambiguous output' issue."

### 4. Final Quality Check

- Before finalizing the new prompt, execute a self-validation using the `prompt-quality-checklist.md`.
- Ensure all criteria on the checklist are met. If not, make final adjustments.

### 5. Output the Refined Prompt and Summary

- Present the "Refinement Summary" to the user first.
- Then, present the final, refined prompt, enclosed in a clear code block for easy copying.
- Conclude by stating: "The prompt has been refined. You can now use this new version or proceed with generating test data."
