# Facilitate Threat Modeling Session

## Objective
Guide a team through a structured threat modeling session using the STRIDE methodology to identify, categorize, and plan mitigation for security threats.

## Prerequisites
- Application/feature scope defined
- System architecture diagrams prepared (Data Flow, Sequence diagrams)
- Core team assembled (developers, security, architects)
- Threat model template ready

## Process Overview

### 1. Session Preparation
- **Scope Definition**: Clearly define the feature/component being analyzed
- **Diagram Review**: Ensure all participants understand the system architecture
- **Tool Setup**: Prepare threat table template for capturing findings

### 2. Threat Identification Using STRIDE Questionnaire

**How to use the questionnaire**: The main idea is *not* to answer "yes" or "no" to each question, but rather start a discussion around the questions to kick off the brainstorming process.

#### Spoofed Identity
Guide the team through these discussion points:

1. Is it possible for an attacker to impersonate another user (spoof an identity) and exploit their privileges?
2. Can someone use another users authentication information to access the data?
3. Can someone change cookies/access token parameters or URL to pose as other user?
4. Can an attacker exploit social engineering techniques to gain unauthorised access to a user's account? Is there anything we can do to defend against that?

#### Tampering with Input
Facilitate discussion around:

1. Can someone tamper with API parameters manipulate or delete data in the database, affect business logic, or redirect users to unintended locations? Do you enforce the most strict backend validation possible?
2. Can someone tamper with cookies / HTTP headers to perform unintended actions within the application?
3. Are iterable numeric values used within the application? Ensure that IDs (such as UUIDs) are non-sequential and not easily guessable for security.
4. Is there a risk of directory traversal or path manipulation when handling file paths or URLs?
5. If there is a file upload feature:
   - Can an attacker manipulate file upload inputs to upload malicious files that could compromise the system?
   - Are file uploads thoroughly validated and restricted to specific file types and sizes?
   - Can attackers exploit insecure file permissions to gain unauthorised access to uploaded files?

#### Repudiation of Action
Explore these scenarios:

1. Can someone perform an action (in general) and deny performing it?
2. Can someone perform an illegal action or operation and there is no way to prove it?
3. Are user actions logged by the system to maintain an audit trail?
4. Can the system provide verifiable evidence of a user's specific actions?
5. Are timestamps and user identifiers included in audit logs to ensure traceability of actions?
6. Can an attacker manipulate client-side code to generate fake or modified audit logs?

#### Information Disclosure
Discuss potential data leakage:

1. Can someone access data/information that they are not supposed to access?
2. Is there a potential for actions performed by users to reveal more information than intended?
3. Is the API response appropriately limited to only the necessary information?
4. On failure, does the system disclose verbose error messages in API responses or web pages?
5. Can attackers infer sensitive information by analysing error messages or system responses (also from the application logs)?
6. Is sensitive data (such as user credentials, personal information, and payment details) encrypted both at rest and during transit?

#### Denial of Service
Analyze availability threats:

1. Can someone make the system/API unavailable to legitimate users? This can be done by overloading the server with many requests or a large amount of data or by turning logic into a repeating loop.
2. Can an attacker abuse functionality to cause excessive resource consumption, impacting system performance?
3. Is there a mechanism in place to restrict the frequency of API calls from a single source (e.g rate limiting)?
4. Are there any actions that users can perform without any restrictions or limitations?
5. If there is a file upload functionality: Is there a risk of Denial of Service (DoS) attacks through excessively large or maliciously crafted file uploads?

#### Elevation of Privileges
Review access control threats:

1. If there are different roles in the application, is it possible for a lower-privileged user to gain access to higher privilege actions? How this could happen? Should it be allowed?
2. Is the Backend designed to validate user authorization before performing actions?
3. Are there any privilege escalation vectors through which a user could gain unauthorised administrative access?

### 3. Threat Documentation

For each identified threat, capture:
- **Threat Description**: Clear description of the potential attack
- **STRIDE Category**: Which category it falls under
- **Severity**: Critical/High/Medium/Low
- **Mitigation Plan**: Specific steps to address the threat
- **Jira Ticket**: Reference for tracking implementation
- **Notes**: Additional context or considerations

### 4. STRIDE Reference Definitions

**Spoofing**: Pretending to be something, someone else
**Tampering**: Modifying something on the disk, network, memory, API parameters
**Repudiation**: Claiming that you did not do anything or were not responsible
**Information disclosure**: Providing or leaking information in unauthorised way
**Denial Of Service**: Exhausting the resources needed to provide service or make service unavailable
**Elevation of Privileges**: Acquire higher privileges than required

### 5. Session Closure

- **Review captured threats**: Ensure all identified threats are documented
- **Prioritize threats**: Rank by severity and impact
- **Assign action items**: Create specific tasks for threat mitigation
- **Schedule follow-up**: Plan review sessions for implementation progress

## Deliverables
- Completed threat model document
- Prioritized list of security threats
- Action plan with assigned responsibilities
- Jira tickets for tracking mitigation efforts

## Tips for Effective Facilitation
- Keep discussions focused but allow for creative thinking
- Encourage participation from all team members
- Don't dismiss seemingly minor threats
- Document everything, even if it seems obvious
- Use real attack scenarios when possible to make threats concrete
- Time-box discussions to maintain momentum

## Follow-up Actions
- Review and validate threat assessments
- Implement mitigation strategies
- Update security documentation
- Schedule periodic threat model reviews
- Share learnings with other teams
