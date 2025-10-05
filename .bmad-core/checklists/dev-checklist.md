# Developer Checklist Task

## Instructions for Developer Agent

Before coding, ensure you have activated the ai logging system.

[[LLM: INITIALIZATION INSTRUCTIONS - DEV CHECKLIST VALIDATION

This checklist is for DEVELOPER AGENTS to self-validate they are ready to code.

IMPORTANT: This is a self-assessment. Be honest about what's actually done vs what should be done. It's better to identify issues now than have them found in review.

EXECUTION APPROACH:

1. Go through each section systematically
2. Mark items as [x] Done, [ ] Not Done, or [N/A] Not Applicable
3. Add brief comments explaining any [ ] or [N/A] items
4. Be specific about what was actually implemented
5. Flag any concerns or technical debt created

The goal is quality delivery, not just checking boxes.]]

## Checklist Items

1. **Logging System:**

   [[LLM: Be specific - ensure each requirement is met before starting to code]]
   Initialize logging system
      - [ ] Read core-config.yaml
      - [ ] Verify/create .ai directory
      - [ ] Verify/create or amend debug log file
      - [ ] Never overwrite existing debug log file
      - [ ] Only amend to the debug log. 
      - [ ] Never change existing log entries.
      - [ ] Log activation event

2. **Code Creation and Documentation:**

   [[LLM: Be specific - ensure each requirement is met before starting to code]]
   - [ ] Read aidev.md BEFORE any file creation
   - [ ] ALL new files MUST include AIDEV comments at creation time
   - [ ] NEVER create files without AIDEV comments
   - [ ] Include ALL relevant AIDEV tags (GENERATED, PROMPT, NOTE, etc.)
   - [ ] If the full file is new, only include the GENERATED tag
   - [ ] Log all code creation and modification in debug log
