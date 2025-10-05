# BMad Development Checklist

This checklist validates that BMad repository development work follows established patterns and maintains architectural compliance.

## Purpose

Ensure all BMad repository modifications (agents, tasks, templates, checklists, teams) adhere to BMad Method principles and maintain system integrity.

## When to Use

- Before committing any changes to the BMad repository
- After creating or modifying agents, tasks, templates, or checklists
- During repository development validation
- As part of PR review process

## Scope

This checklist covers all aspects of BMad repository development including agent creation, task development, template design, team configuration, and architectural compliance.

## Prerequisites

- [ ] BMad Method documentation has been reviewed (docs/core-architecture.md, docs/GUIDING-PRINCIPLES.md)
- [ ] Changes align with existing BMad patterns and standards
- [ ] Development environment is properly configured

## Success Criteria

All checklist items pass validation, ensuring the repository changes maintain BMad Method integrity and follow established patterns.

## Checklist Categories

## 1. Agent Development Validation

### Agent File Structure

- [ ] Agent file follows standard BMad agent structure (header, YAML block, complete definition)
- [ ] ACTIVATION-NOTICE is present and correctly formatted
- [ ] YAML block contains all required sections (IDE-FILE-RESOLUTION, activation-instructions, agent, persona, commands, dependencies)
- [ ] File uses standard BMad agent naming convention (agent-id.md)

### Agent Metadata
- [ ] Agent has unique ID following naming conventions (lowercase, hyphens)
- [ ] Agent has creative, memorable name
- [ ] Agent title clearly describes role and purpose
- [ ] Icon is appropriate and unique within the system
- [ ] whenToUse clearly explains agent's purpose and use cases

### Agent Persona
- [ ] Persona includes role, style, identity, and focus fields
- [ ] Core principles are specific to the agent's domain (minimum 5 principles)
- [ ] Persona reflects deep expertise in the agent's domain
- [ ] Identity clearly establishes the agent's professional character
- [ ] Style defines appropriate communication approach

### Agent Commands
- [ ] All commands require * prefix when used
- [ ] Help command provides numbered list of available commands
- [ ] Commands are specific to the agent's purpose and capabilities
- [ ] Exit command properly abandons persona
- [ ] Command descriptions are clear and actionable

### Agent Dependencies
- [ ] Dependencies include all necessary tasks, templates, checklists, and data
- [ ] Dependencies follow established BMad patterns
- [ ] All referenced dependencies exist in the repository
- [ ] Dependencies are appropriate for the agent's complexity level
- [ ] No unnecessary dependencies that violate "lean" principles where applicable

### Activation Instructions
- [ ] Standard activation sequence is implemented (read file, adopt persona, greet, HALT)
- [ ] Critical workflow rules are included
- [ ] Mandatory interaction rules are specified
- [ ] Documentation loading requirements are clearly defined
- [ ] Agent behavior after activation is properly specified

## 2. Task Development Validation

### Task Structure
- [ ] Task file follows BMad task writing rules
- [ ] Task has clear title and description
- [ ] Purpose and context are well-defined
- [ ] Prerequisites and inputs are clearly specified

### Task Content
- [ ] Steps are executable and specific
- [ ] Language is imperative and actionable
- [ ] Elicitation is properly implemented where user input is required
- [ ] Validation steps are included
- [ ] Expected outputs are clearly defined

### Task Integration
- [ ] Task integrates properly with agent commands
- [ ] Task follows established BMad workflow patterns
- [ ] Task can be executed independently
- [ ] Task produces expected deliverables

## 3. Template Development Validation

### Template Structure
- [ ] Template follows YAML template specification
- [ ] Template metadata is complete (id, name, version, output)
- [ ] Workflow configuration is appropriate
- [ ] Sections are properly structured with clear instructions

### Template Content
- [ ] Elicitation questions cover all required variables
- [ ] Template generates proper output format
- [ ] Instructions are clear for LLM processing
- [ ] Template supports the intended use cases

### Template Integration
- [ ] Template integrates with create-doc task
- [ ] Template can be used by appropriate agents
- [ ] Output format matches BMad standards
- [ ] Template variables are properly resolved

## 4. Checklist Development Validation

### Checklist Structure
- [ ] Checklist has clear purpose and scope
- [ ] Prerequisites are defined
- [ ] Success criteria are specified
- [ ] Categories organize items logically

### Checklist Content
- [ ] Items are specific and actionable
- [ ] Items are measurable and verifiable
- [ ] Items cover all aspects of the validation domain
- [ ] Validation steps are included

### Checklist Integration
- [ ] Checklist can be executed via execute-checklist task
- [ ] Checklist supports quality assurance workflows
- [ ] Sign-off requirements are appropriate
- [ ] Checklist maintains BMad quality standards

## 5. Team Configuration Validation

### Team Structure
- [ ] Team YAML file follows established format
- [ ] Team includes appropriate agents for its purpose
- [ ] Team workflows are properly defined
- [ ] Team configuration is complete

### Team Integration
- [ ] Team integrates with BMad orchestration system
- [ ] Team agents work together effectively
- [ ] Team serves a clear business purpose
- [ ] Team follows BMad team patterns

## 6. Repository Architecture Compliance

### BMad Principles Adherence
- [ ] Changes follow "Natural Language First" principle
- [ ] Agent complexity is appropriate (lean vs comprehensive)
- [ ] Core vs expansion pack placement is correct
- [ ] Changes maintain backward compatibility

### File Organization
- [ ] Files are placed in correct directories
- [ ] Naming conventions are followed consistently
- [ ] File structure maintains BMad organization
- [ ] Dependencies are properly organized

### Integration Testing
- [ ] Changes integrate properly with existing system
- [ ] No breaking changes to existing functionality
- [ ] Agent activation works correctly
- [ ] Commands execute as expected

## 7. Documentation and Quality

### Documentation
- [ ] All changes are properly documented
- [ ] README files are updated if needed
- [ ] Version information is current
- [ ] Change logs are maintained

### Code Quality
- [ ] YAML syntax is valid
- [ ] Markdown formatting is correct
- [ ] No linting errors
- [ ] Files are properly formatted

### Testing
- [ ] Agent activation tested
- [ ] Commands tested for functionality
- [ ] Templates generate expected output
- [ ] Checklists execute properly

## Validation Steps

1. **Automated Validation**
   - Run YAML syntax validation
   - Execute linting checks
   - Verify file structure integrity

2. **Manual Validation**
   - Test agent activation sequence
   - Verify command functionality
   - Validate template output
   - Execute checklist items

3. **Integration Testing**
   - Test with BMad orchestration system
   - Verify agent chain functionality
   - Test template integration with create-doc
   - Validate checklist execution

## Quality Gates

- [ ] All automated tests pass
- [ ] Manual validation confirms functionality
- [ ] Integration tests demonstrate proper system integration
- [ ] Documentation is complete and accurate
- [ ] Changes maintain BMad architectural principles

## Sign-off Requirements

This checklist must be completed and validated by:
- **Developer**: Confirms implementation follows BMad patterns
- **Reviewer**: Validates architectural compliance and quality
- **BMad Method Expert**: Ensures changes align with BMad principles

## Checklist Completion Record

- **Completed by**: _________________
- **Date**: _________________
- **Reviewed by**: _________________
- **Review Date**: _________________
- **Status**: [ ] Passed [ ] Failed [ ] Needs Revision
- **Notes**: 

_____________________________________________________________________________________

**Additional Comments:**

_____________________________________________________________________________________

**Identified Issues:**

_____________________________________________________________________________________

**Recommended Actions:**

_____________________________________________________________________________________
