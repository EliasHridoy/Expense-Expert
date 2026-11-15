# Plan: Calculatable Number Input (Excel-Style Arithmetic)

## Status: Completed

## Objective
Enable mathematical expression calculations (e.g., `=10+20`, `10+20+5`, `15*2`) in numeric input fields across Expense Expert, particularly in:
- Expense Form (`amount` input)
- Supermarket / Shopping Form (`price` and other numeric item fields)
- Other relevant numeric inputs (Drafts, Savings, Loans, Profile Income)

---

## Behavior & User Experience
1. **Excel-like Syntax & Flexibility**:
   - Supports leading `=` syntax (e.g. `=10+20`) as well as direct expressions (e.g. `10+20+5`).
   - Supports basic arithmetic operators: addition (`+`), subtraction (`-`), multiplication (`*`), and division (`/`), plus optional parentheses `()`.
2. **Evaluation Triggers**:
   - On `Enter` key press or on `blur` (loss of focus), the formula is evaluated safely.
   - If valid, the input display and underlying `FormControl` / `ngModel` are updated with the computed numeric result (e.g., `30`).
   - If invalid or empty, gracefully handles errors without throwing or freezing.
3. **Input Handling**:
   - Switched inputs to `type="text" inputmode="decimal"` with `[appCalculatableNumber]` directive, allowing seamless entry on desktop and mobile keyboards.

---

## Implemented Files
1. [math-evaluator.util.ts](file:///mnt/5cf2a800-97fa-463a-878d-37bb8b42ecdb/Pet%20Project/Expense%20Expert/expense-expert/src/app/shared/utils/math-evaluator.util.ts) - Safe recursive descent arithmetic evaluator without `eval()`.
2. [math-evaluator.util.spec.ts](file:///mnt/5cf2a800-97fa-463a-878d-37bb8b42ecdb/Pet%20Project/Expense%20Expert/expense-expert/src/app/shared/utils/math-evaluator.util.spec.ts) - Unit tests for arithmetic parsing and edge cases.
3. [calculatable-number.directive.ts](file:///mnt/5cf2a800-97fa-463a-878d-37bb8b42ecdb/Pet%20Project/Expense%20Expert/expense-expert/src/app/shared/directives/calculatable-number.directive.ts) - Angular standalone directive for calculatable inputs.
4. [calculatable-number.directive.spec.ts](file:///mnt/5cf2a800-97fa-463a-878d-37bb8b42ecdb/Pet%20Project/Expense%20Expert/expense-expert/src/app/shared/directives/calculatable-number.directive.spec.ts) - Component integration unit tests.
5. Integrated screens:
   - [expense-form.component.ts](file:///mnt/5cf2a800-97fa-463a-878d-37bb8b42ecdb/Pet%20Project/Expense%20Expert/expense-expert/src/app/features/expenses/expense-form/expense-form.component.ts)
   - [shopping-form.component.ts](file:///mnt/5cf2a800-97fa-463a-878d-37bb8b42ecdb/Pet%20Project/Expense%20Expert/expense-expert/src/app/features/expenses/shopping/shopping-form/shopping-form.component.ts)
   - [draft-form.component.ts](file:///mnt/5cf2a800-97fa-463a-878d-37bb8b42ecdb/Pet%20Project/Expense%20Expert/expense-expert/src/app/features/expense-drafts/draft-form/draft-form.component.ts)
   - [draft-apply.component.ts](file:///mnt/5cf2a800-97fa-463a-878d-37bb8b42ecdb/Pet%20Project/Expense%20Expert/expense-expert/src/app/features/expense-drafts/draft-apply/draft-apply.component.ts)
   - [saving-goal-form.component.ts](file:///mnt/5cf2a800-97fa-463a-878d-37bb8b42ecdb/Pet%20Project/Expense%20Expert/expense-expert/src/app/features/savings/saving-goal-form/saving-goal-form.component.ts)
   - [savings-page.component.ts](file:///mnt/5cf2a800-97fa-463a-878d-37bb8b42ecdb/Pet%20Project/Expense%20Expert/expense-expert/src/app/features/savings/savings-page/savings-page.component.ts)
   - [loans-page.component.ts](file:///mnt/5cf2a800-97fa-463a-878d-37bb8b42ecdb/Pet%20Project/Expense%20Expert/expense-expert/src/app/features/savings/loans-page/loans-page.component.ts)
   - [profile-page.component.ts](file:///mnt/5cf2a800-97fa-463a-878d-37bb8b42ecdb/Pet%20Project/Expense%20Expert/expense-expert/src/app/features/profile/profile-page/profile-page.component.ts)
