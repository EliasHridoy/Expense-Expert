import { Component, DebugElement, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ClickOutsideDirective } from './click-outside.directive';

@Component({
  template: `
    <div class="outside">Outside Element</div>
    <div class="inside" appClickOutside (appClickOutside)="onClickedOutside()">
      Inside Element
    </div>
  `,
  standalone: true,
  imports: [ClickOutsideDirective]
})
class TestComponent {
  clickedOutside = false;
  onClickedOutside() {
    this.clickedOutside = true;
  }
}

describe('ClickOutsideDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let insideElement: DebugElement;
  let outsideElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent, ClickOutsideDirective]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;

    insideElement = fixture.debugElement.query(By.css('.inside'));
    outsideElement = fixture.debugElement.query(By.css('.outside'));

    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body.removeChild(fixture.nativeElement);
  });

  it('should create an instance', () => {
    const elementRef = new ElementRef(insideElement.nativeElement);
    const directive = new ClickOutsideDirective(elementRef);
    expect(directive).toBeTruthy();
  });

  it('should not emit when clicking inside the element', () => {
    insideElement.nativeElement.click();
    expect(component.clickedOutside).toBeFalse();
  });

  it('should emit when clicking outside the element', () => {
    outsideElement.nativeElement.click();
    expect(component.clickedOutside).toBeTrue();
  });

  it('should emit when clicking the document body', () => {
    document.body.click();
    expect(component.clickedOutside).toBeTrue();
  });
});
