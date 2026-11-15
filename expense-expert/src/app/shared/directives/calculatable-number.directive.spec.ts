import { Component, ElementRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CalculatableNumberDirective } from './calculatable-number.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, CalculatableNumberDirective],
  template: `
    <input
      #inputEl
      type="number"
      [formControl]="control"
      appCalculatableNumber
      (calculated)="onCalculated($event)"
    />
  `,
})
class TestHostComponent {
  @ViewChild('inputEl') inputRef!: ElementRef<HTMLInputElement>;
  control = new FormControl<number | null>(null);
  lastCalculated: number | null = null;

  onCalculated(val: number): void {
    this.lastCalculated = val;
  }
}

describe('CalculatableNumberDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let inputElement: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
    inputElement = hostComponent.inputRef.nativeElement;
  });

  it('should switch type="number" to type="text" and set inputmode="decimal"', () => {
    expect(inputElement.type).toBe('text');
    expect(inputElement.getAttribute('inputmode')).toBe('decimal');
  });

  it('should evaluate expression with = on blur', () => {
    inputElement.value = '=10+20';
    inputElement.dispatchEvent(new Event('input'));
    inputElement.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(inputElement.value).toBe('30');
    expect(hostComponent.control.value).toBe(30);
    expect(hostComponent.lastCalculated).toBe(30);
  });

  it('should evaluate expression without = on keydown.enter', () => {
    inputElement.value = '15 + 25';
    inputElement.dispatchEvent(new Event('input'));
    inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(inputElement.value).toBe('40');
    expect(hostComponent.control.value).toBe(40);
  });

  it('should handle complex expressions with multiplication and brackets', () => {
    inputElement.value = '=(5 + 5) * 3';
    inputElement.dispatchEvent(new Event('input'));
    inputElement.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(inputElement.value).toBe('30');
    expect(hostComponent.control.value).toBe(30);
  });

  it('should handle standard plain numbers seamlessly', () => {
    inputElement.value = '123.45';
    inputElement.dispatchEvent(new Event('input'));
    inputElement.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(inputElement.value).toBe('123.45');
    expect(hostComponent.control.value).toBe(123.45);
  });
});
