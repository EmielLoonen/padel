# STRIDE Threat Modeling Context

## Overview
STRIDE is a threat modeling methodology using six categories to systematically identify security threats in technical designs: **S**poofing, **T**ampering, **R**epudiation, **I**nformation disclosure, **D**enial of service, **E**levation of privilege.

## Spoofing - Identity Impersonation

**Definition**: Being able to impersonate someone or something else to gain unauthorized access.

### Common Attack Scenarios
1. **XSS Token Theft**: Obtaining user's JWT token from browser storage via Cross-Site Scripting
2. **Credential Reuse**: Stealing stored credentials from client/server and reusing them
3. **Weak Authentication**: Exploiting systems with default passwords or weak authentication
4. **Session Hijacking**: Manipulating cookies/access tokens to pose as another user
5. **Account Recovery Abuse**: Exploiting weak password recovery mechanisms
6. **Port/Socket Squatting**: Taking over random ports or sockets the server uses
7. **AI Model Substitution**: Using different AI models instead of preferred ones

### Key Questions
- Can someone spoof an identity and misuse authority?
- Can someone use another user's authentication information?
- Can someone change cookies/access token parameters to pose as someone else?
- Are credentials properly protected in storage and transit?
- Does the system force strong authentication methods?

## Tampering - Data Modification

**Definition**: Being able to modify data when you're not supposed to do that.

### Common Attack Scenarios
1. **Payment Redirection**: Intercepting payment requests and modifying account numbers
2. **API Parameter Manipulation**: Tampering with API parameters to alter database/business logic
3. **Custom Crypto Weakness**: Exploiting custom key exchange or integrity controls
4. **Access Control Bypass**: Bypassing permissions through non-canonical names
5. **State Information Control**: Providing or controlling application state
6. **Extension Point Exploitation**: Loading malicious code via extension points
7. **AI Model Poisoning**: Poisoning training data or altering system prompts
8. **Replay Attacks**: Replaying data without detection due to missing timestamps

### Key Questions
- Can someone tamper with API parameters to delete or modify data?
- Can someone tamper with cookies/HTTP headers for unintended actions?
- Does the application use iterable numeric values (prefer UUIDs)?
- Are there proper integrity protections for network data?
- Is input validation performed on trusted boundaries?

## Repudiation - Denial of Actions

**Definition**: Being able to claim you didn't do something when you actually did, due to insufficient audit trails.

### Common Attack Scenarios
1. **Log Deletion**: Deleting transaction logs without proper audit trails
2. **Log Manipulation**: Altering log messages or digital signatures
3. **Timestamp Absence**: Creating log entries without timestamps
4. **Log Overflow**: Making logs wrap around and lose data
5. **Shared Key Confusion**: Using shared keys that confuse principal identification
6. **Log Injection**: Getting arbitrary data into logs without validation
7. **Audit Trail Gaps**: Systems with no logs or incomplete logging

### Key Questions
- Can someone perform an action and deny it?
- Can someone perform illegal operations without proof?
- Does the system audit user actions with proper details?
- Are timestamps and user identifiers included in logs?
- Can the system provide verifiable evidence of actions?
- Are logs protected from tampering?

## Information Disclosure - Data Leakage

**Definition**: Revealing more information than necessary or to unauthorized parties.

### Common Attack Scenarios
1. **Verbose Error Messages**: Displaying stack traces with database structure details
2. **API Over-Disclosure**: User-info endpoints revealing all system users
3. **Weak Encryption**: Using non-standard or weak encryption algorithms
4. **Channel Interception**: Man-in-the-middle attacks on unencrypted channels
5. **File Permission Issues**: Sensitive files with weak or missing ACLs
6. **Search/Logger Exposure**: Information accessible through indexers or logs
7. **AI Prompt Exposure**: Reading system prompts, inputs, or outputs of AI applications
8. **Hidden Data Exposure**: Accessing undo/change tracking data

### Key Questions
- Can someone access data they're not supposed to access?
- Does the API response contain too much information?
- Does the system disclose verbose error messages on failure?
- Is sensitive data encrypted at rest and in transit?
- Can attackers infer information from error messages or responses?
- Are proper access controls in place for sensitive information?

## Denial of Service - Service Disruption

**Definition**: Making the service unusable or unavailable for legitimate users.

### Common Attack Scenarios
1. **Malformed Request Crashes**: Unicode or malformed requests crashing applications
2. **Resource Exhaustion**: Overloading servers with excessive requests or data
3. **Logic Loop Exploitation**: Turning application logic into repeating loops
4. **Authentication System Attack**: Making authentication unavailable
5. **Amplification Attacks**: Using components for 10:1 or 100:1 attack amplification
6. **Logging System Disruption**: Causing logging subsystem failures
7. **Persistent Disruption**: Attacks that persist after attacker stops

### Attack Persistence Levels
- **Temporary**: Problem stops when attacker stops
- **Persistent**: Problem continues after attacker leaves

### Attack Authentication Levels
- **Anonymous**: No authentication required
- **Authenticated**: Requires valid credentials

### Key Questions
- Can someone make the system/API unavailable to legitimate users?
- Can someone perform CPU-intensive actions repeatedly?
- Is there rate limiting on API calls?
- Can users perform actions without limitations?
- Are there protections against amplification attacks?

## Elevation of Privilege - Unauthorized Access

**Definition**: An attack where a user gains privileges not intended for their role.

### Common Attack Scenarios
1. **JWT Manipulation**: Modifying JWT token payload to escalate role permissions
2. **Validation Path Exploitation**: Forcing data through different validation paths
3. **Trust Boundary Violations**: Providing pointers across trust boundaries
4. **Input Reflection**: Cross-site scripting and input reflection attacks
5. **Command Injection**: Injecting commands that run at higher privilege levels
6. **User-Generated Content**: Including unvalidated user content in pages
7. **Permission Assumptions**: Exploiting unclear security assumptions

### Key Questions
- Are there different business roles in the application?
- Can a lower-privileged user gain access to higher privilege actions?
- Does the backend check authorization before performing actions?
- Are there clear security boundaries and validation rules?
- How are privilege escalation vectors prevented?

## AI-Specific Considerations

### Modern AI Threats
1. **Model Substitution**: Using unauthorized AI models
2. **Training Data Poisoning**: Corrupting AI model training data
3. **Prompt Injection**: Altering system prompts or instructions
4. **AI Output Disclosure**: Unauthorized access to AI inputs/outputs

### AI Security Questions
- Can attackers influence AI model selection?
- Is training data protected from tampering?
- Are system prompts secured from modification?
- Is AI model output properly controlled and audited?

## Threat Modeling Process

### Assessment Approach
1. **Think Beyond Checklists**: Don't limit to provided questions
2. **Focus on "What Could Go Wrong?"**: Use STRIDE as a thinking framework
3. **Document Everything**: Capture threats, mitigations, and responsible parties
4. **Prioritize by Impact**: Consider business and security impact
5. **Validate Assumptions**: Challenge security assumptions and boundaries

### Documentation Elements
- **Threat Description**: Clear explanation of the attack
- **STRIDE Category**: Which category it belongs to
- **Impact Assessment**: Business and security consequences
- **Mitigation Strategy**: Specific countermeasures
- **Responsible Party**: Who implements the fix
- **Tracking**: Jira ticket or other tracking mechanism
