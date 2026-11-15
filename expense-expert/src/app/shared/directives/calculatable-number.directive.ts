import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Optional,
  Output,
  Self,
  numberAttribute,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { evaluateMathExpression, isMathExpression } from '../utils/math-evaluator.util';

@Directive({
  selector: 'input[appCalculatableNumber], input[calculatableNumber]',
  standalone: true,
})
export class CalculatableNumberDirective implements OnInit {
  @Input({ transform: numberAttribute }) decimals?: number;
  @Input({ transform: numberAttribute }) min?: number;
  @Input({ transform: numberAttribute }) max?: number;
  @Output() calculated = new EventEmitter<number>();

  private isEvaluating = false;

  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Optional() @Self() private ngControl?: NgControl
  ) {}

  ngOnInit(): void {
    const input = this.el.nativeElement;
    // Switch type="number" to type="text" to allow mathematical operators (+, -, *, /, =)
    if (input.type === 'number') {
      input.type = 'text';
      if (!input.getAttribute('inputmode')) {
        input.setAttribute('inputmode', 'decimal');
      }
    }
  }

  @HostListener('input', ['$event.target.value'])
  onInput(value: string): void {
    if (this.isEvaluating) return;

    // If it's a plain number without operators, sync numeric value to control if needed
    if (!isMathExpression(value)) {
      const trimmed = value.trim();
      if (trimmed === '') {
        this.updateControlValue(null, false);
      } else {
        const num = Number(trimmed);
        if (!isNaN(num)) {
          this.updateControlValue(num, false);
        }
      }
    }
  }

  @HostListener('keydown.enter', ['$event'])
  onEnter(): void {
    this.evaluateCurrentValue();
  }

  @HostListener('blur')
  onBlur(): void {
    this.evaluateCurrentValue();
  }

  /**
   * Evaluates the current input value if it contains a math expression or number.
   */
  public evaluateCurrentValue(): number | null {
    const raw = this.el.nativeElement.value;
    if (raw == null || raw.trim() === '') {
      return null;
    }

    const trimmed = raw.trim();

    // If it's not a math expression and already a valid number
    if (!isMathExpression(trimmed)) {
      const num = Number(trimmed);
      if (!isNaN(num)) {
        const finalVal = this.applyConstraints(num);
        this.displayValue(finalVal);
        this.updateControlValue(finalVal, true);
        return finalVal;
      }
      return null;
    }

    const result = evaluateMathExpression(trimmed);
    if (result !== null && !isNaN(result)) {
      const finalVal = this.applyConstraints(result);
      this.displayValue(finalVal);
      this.updateControlValue(finalVal, true);
      this.calculated.emit(finalVal);
      return finalVal;
    }

    return null;
  }

  private applyConstraints(value: number): number {
    let result = value;
    if (this.decimals !== undefined && this.decimals >= 0) {
      result = Number(result.toFixed(this.decimals));
    }
    if (this.min !== undefined && result < this.min) {
      result = this.min;
    }
    if (this.max !== undefined && result > this.max) {
      result = this.max;
    }
    return result;
  }

  private displayValue(value: number): void {
    const formatted =
      this.decimals !== undefined && this.decimals >= 0
        ? value.toFixed(this.decimals)
        : String(value);

    this.isEvaluating = true;
    this.el.nativeElement.value = formatted;
    // Dispatch input & change events so external listeners stay in sync
    this.el.nativeElement.dispatchEvent(new Event('input', { bubbles: true }));
    this.el.nativeElement.dispatchEvent(new Event('change', { bubbles: true }));
    this.isEvaluating = false;
  }

  private updateControlValue(value: number | null, emitEvent: boolean): void {
    if (this.ngControl && this.ngControl.control) {
      this.ngControl.control.setValue(value, {
        emitEvent,
        emitModelToViewChange: false,
      });
      this.ngControl.control.markAsDirty();
    }
  }
}
