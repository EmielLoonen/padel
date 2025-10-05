<!-- Powered by BMAD™ Core -->

# Create New Prompt Task

## Purpose

To create a new, high-quality, production-ready prompt from scratch based on a set of user requirements. This task ensures that new prompts are well-designed from the outset.

## SEQUENTIAL Task Execution

### 1. Gather Requirements

- The user will provide a set of requirements, typically by referencing a design document (PRD or architecture spec).
- The agent must read and fully understand the requirements.

### 2. Interactive Goal Refinement

- CRITICAL: Before writing the prompt, the agent must engage in a dialogue with the user to clarify the prompt's exact goal.
- Ask clarifying questions to remove ambiguity.
- Use reverse prompting (e.g., "So, to confirm, you need a prompt that takes X as input and produces Y in Z format. Is that correct?") to ensure a shared understanding.
- Continue this process until the goal is concrete and specific.

### 3. Design and Generate the Prompt

- Based on the refined goal, select the most appropriate prompt engineering pattern (e.g., role-playing, few-shot examples, Chain of Thought).
- Structure the prompt with the following components:
    - **Role/Persona:** "You are a..."
    - **Instructions:** A clear, step-by-step process for the LLM to follow.
    - **Constraints:** Any rules or limitations (e.g., "Do not use external libraries," "Your response must be under 200 words").
    - **Output Format:** A precise definition of the desired output (e.g., JSON schema, markdown format).

### 4. Final Quality Check

- Before finalizing the new prompt, execute a self-validation using the `prompt-quality-checklist.md`.
- Ensure all criteria on the checklist are met.

### 5. Output the New Prompt

- Present the final, new prompt, enclosed in a clear code block.
- Ask the user for a file path to save the new prompt to.
- Save the prompt to the specified location.
- Conclude by stating: "The new prompt has been created and saved. You can now proceed with generating test data for it."
