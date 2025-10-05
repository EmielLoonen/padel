# Task: Refactor Code

**Objective:** To analyze a given piece of code, identify refactoring opportunities based on common code smells and design principles, and apply the refactorings with clear explanations.

**Elicit**: true

## Steps:

1.  **Elicit Target Code:**
    -   Ask the user to provide the code to be refactored. This can be a file path, a class name, a method, or a code snippet.

2.  **Load Checklist:**
    -   Load the `refactoring-checklist.md`.

3.  **Analyze the Code:**
    -   Review the code against the checklist, identifying code smells and violations of SOLID principles.
    -   For each identified issue, determine the appropriate refactoring technique (e.g., Extract Method, Move Field, Replace Magic Number with Symbolic Constant).

4.  **Propose Refactorings:**
    -   Present a summary of the identified issues and the proposed refactorings to the user.
    -   For each refactoring, explain:
        -   **What:** The specific change you want to make.
        -   **Why:** The code smell or principle violation it addresses.
        -   **How:** The refactoring technique you will use.

5.  **Apply Refactorings:**
    -   Upon user approval, apply the refactorings to the code.
    -   Ensure that the refactored code is functionally equivalent to the original and that all tests (if any) still pass.

6.  **Present Result:**
    -   Show the refactored code to the user.
    -   Provide a final summary of the improvements made.
