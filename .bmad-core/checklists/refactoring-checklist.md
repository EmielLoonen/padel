# Refactoring Checklist

- [ ] **Code Smells:**
  - [ ] **Bloaters:**
    - [ ] Long Method: A method that is too long.
    - [ ] Large Class: A class that has too many responsibilities.
    - [ ] Long Parameter List: A method with too many parameters.
    - [ ] Data Clumps: Groups of data that are passed around together.
  - [ ] **Obfuscators:**
    - [ ] Obscured Intent: Code that is hard to understand.
    - [ ] Magic Numbers: Unnamed numerical constants.
    - [ ] Duplicated Code: The same code structure in multiple places.
  - [ ] **Dispensables:**
    - [ ] Dead Code: Unused code.
    - [ ] Speculative Generality: Code that is not currently needed but was added for future use.
    - [ ] Comments: Comments that are no longer relevant or just restate the code.
  - [ ] **Couplers:**
    - [ ] Feature Envy: A method that is more interested in a class other than the one it is in.
    - [ ] Inappropriate Intimacy: A class that has too much knowledge of the implementation details of another class.
    - [ ] Message Chains: A long sequence of method calls.

- [ ] **SOLID Principles:**
  - [ ] **Single Responsibility Principle:** A class should have only one reason to change.
  - [ ] **Open/Closed Principle:** Software entities should be open for extension but closed for modification.
  - [ ] **Liskov Substitution Principle:** Subtypes must be substitutable for their base types.
  - [ ] **Interface Segregation Principle:** No client should be forced to depend on methods it does not use.
  - [ ] **Dependency Inversion Principle:** High-level modules should not depend on low-level modules. Both should depend on abstractions.
