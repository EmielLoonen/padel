---
docOutputLocation: docs/security-review-results.md
template: ".bmad-core/templates/security-review-tmpl.yaml"
---

# Facilitate Security Review Task

Facilitate interactive security review sessions with users. Be methodical and adaptive in applying security analysis techniques.

## Process

### Step 1: Session Setup

Ask 4 context questions (don't preview what happens next):

1. What system, application, or code are we reviewing for security?
2. What is the scope and any specific concerns or constraints?
3. Goal: comprehensive security audit or focused vulnerability assessment?
4. Do you want a structured security report to reference later? (Default Yes)

### Step 2: Present Approach Options

After getting answers to Step 1, present 4 approach options (numbered):

1. User selects specific security review techniques
2. Security expert recommends techniques based on context and threat landscape
3. Systematic methodology following STRIDE or OWASP frameworks
4. Progressive review flow (architecture → code → deployment → operations)

### Step 3: Execute Security Review Techniques Interactively

**KEY PRINCIPLES:**

- **FACILITATOR ROLE**: Guide user to identify security issues through questions, scenarios, and methodical analysis
- **CONTINUOUS ENGAGEMENT**: Keep user engaged with chosen technique until they want to switch or area is thoroughly covered
- **CAPTURE FINDINGS**: If (default) document output requested, capture all security findings, vulnerabilities, and recommendations from the beginning.

**Technique Selection:**
If user selects Option 1, present numbered list of security review techniques:

1. **STRIDE Threat Modeling** - Systematic threat identification (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)
2. **OWASP Top 10 Assessment** - Review against common web application vulnerabilities
3. **Architecture Security Review** - Analyze system design and data flows for security gaps
4. **Code Security Analysis** - Manual code review for security vulnerabilities
5. **Authentication & Authorization Review** - Identity and access control analysis
6. **Data Protection Assessment** - Encryption, storage, and transmission security
7. **Input Validation Analysis** - Injection and input handling vulnerabilities
8. **Session Management Review** - Session security and state management
9. **Error Handling & Logging Review** - Information leakage and audit trail analysis
10. **Dependency & Configuration Security** - Third-party libraries and system configuration

**Technique Execution:**

1. Apply selected technique according to security best practices and frameworks
2. Keep engaging with technique until user indicates they want to:
   - Choose a different security review approach
   - Apply findings to a different system component
   - Move to risk assessment and prioritization
   - End session

**Output Capture (if requested):**
For each technique used, capture:

- Security review technique and scope covered
- Vulnerabilities and security findings identified
- Risk assessment and severity ratings
- Mitigation strategies and recommendations
- User's understanding and planned actions

### Step 4: Security Review Flow

1. **Context Gathering** (10-15 min) - Understand system architecture and threat landscape
2. **Threat Identification** (30-45 min) - Systematic identification of potential security issues
3. **Risk Assessment** (20-30 min) - Evaluate likelihood and impact of identified threats
4. **Mitigation Planning** (15-25 min) - Develop security controls and remediation strategies

### Step 5: Security Report Output (if requested)

Generate structured security report with these sections:

**Executive Summary**

- System/application reviewed and scope
- Security review techniques used
- Total vulnerabilities found by severity
- Overall security posture assessment
- Critical recommendations summary

**Security Findings** (for each technique used)

- Review technique and methodology
- Vulnerabilities identified (user's analysis)
- Risk ratings (Critical/High/Medium/Low)
- Attack scenarios and potential impact
- Evidence and proof-of-concept details

**Risk Assessment**

- **Critical Vulnerabilities** - Immediate remediation required
- **High Risk Issues** - Address within current sprint/cycle
- **Medium Risk Items** - Include in next planning cycle
- **Low Risk Observations** - Monitor and address as resources allow

**Remediation Roadmap**

- Top 3 critical security actions with rationale
- Short-term fixes (0-30 days)
- Medium-term improvements (1-3 months)
- Long-term security enhancements (3+ months)
- Resources and expertise needed

**Security Controls Assessment**

- Current security controls effectiveness
- Gaps in security coverage
- Recommended additional controls
- Compliance considerations (GDPR, SOX, etc.)

**Follow-up Actions**

- Immediate action items and owners
- Security testing recommendations
- Monitoring and detection improvements
- Training and awareness needs
- Schedule for next security review

## Key Principles

- **YOU ARE A SECURITY FACILITATOR**: Guide the user to identify security issues, don't identify them alone (unless they request direct analysis)
- **METHODICAL ANALYSIS**: Ask probing security questions, wait for responses, build on their security insights
- **ONE TECHNIQUE AT A TIME**: Don't mix multiple security review approaches in one response
- **THOROUGH COVERAGE**: Stay with one technique until security area is comprehensively reviewed
- **SECURITY MINDSET**: Help them think like an attacker while building defender strategies
- **REAL-TIME ADAPTATION**: Monitor understanding and adjust security review approach as needed
- Maintain security focus and attention to detail
- Assume breach mentality during review
- Prioritize by risk and business impact
- Consider both technical and business security requirements
- Document everything in security report

## Advanced Security Review Strategies

**Risk-Based Questioning**

- Probe attack vectors: "How could an attacker exploit this functionality?"
- Assess impact: "What would be the business impact if this were compromised?"
- Challenge assumptions: "What if this security control fails?"

**Threat Actor Perspectives**

- External attackers: "How would someone from outside try to break in?"
- Malicious insiders: "What could someone with legitimate access do maliciously?"
- Advanced persistent threats: "How might a sophisticated attacker establish persistence?"

**Defense in Depth Analysis**

- Ask about layered security: "What happens if the first line of defense is bypassed?"
- Validate redundancy: "Are there backup security controls for critical functions?"
- Test monitoring: "How would you detect if this attack were happening?"

**Compliance and Standards Alignment**

- Reference frameworks: "How does this align with OWASP/NIST recommendations?"
- Consider regulations: "What compliance requirements apply here?"
- Industry best practices: "What security standards are relevant to your industry?"

**Transition Management**

- Always confirm before switching: "Ready to review a different security area?"
- Offer depth options: "Should we dig deeper into this vulnerability or move to the next component?"
- Respect security concerns and thoroughness needs
- Ensure critical findings are not overlooked

## Integration with BMAD Security Framework

- Reference STRIDE methodology from bmad-core/data/stride.md
- Apply security best practices from bmad-core/data/security-best-practices.md
- Use OWASP Top 10 guidelines from bmad-core/data/owasp-top-10.md
- Follow security principles from bmad-core/principles/IAM-SA-* files
- Leverage security checklists from bmad-core/checklists/security-checklist.md
