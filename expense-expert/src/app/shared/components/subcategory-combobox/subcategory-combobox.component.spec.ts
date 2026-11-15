import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubcategoryComboboxComponent } from './subcategory-combobox.component';
import { CategoryService } from '../../../core/services/category.service';
import { signal } from '@angular/core';

describe('SubcategoryComboboxComponent', () => {
  let component: SubcategoryComboboxComponent;
  let fixture: ComponentFixture<SubcategoryComboboxComponent>;
  let categoryServiceMock: {
    allSubcategories: any;
    loadSubcategories: jasmine.Spy;
    registerSubcategory: jasmine.Spy;
  };

  beforeEach(async () => {
    categoryServiceMock = {
      allSubcategories: signal(['Food', 'Groceries', 'Transport', 'Utilities']),
      loadSubcategories: jasmine.createSpy('loadSubcategories'),
      registerSubcategory: jasmine.createSpy('registerSubcategory'),
    };

    await TestBed.configureTestingModule({
      imports: [SubcategoryComboboxComponent],
      providers: [
        { provide: CategoryService, useValue: categoryServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubcategoryComboboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load subcategories on init', () => {
    expect(component).toBeTruthy();
    expect(categoryServiceMock.loadSubcategories).toHaveBeenCalled();
  });

  it('should filter suggestions based on search term', () => {
    component.searchTerm.set('Gro');
    expect(component.filteredSubcategories()).toEqual(['Groceries']);
  });

  it('should emit value and register subcategory on selection', () => {
    spyOn(component.valueChange, 'emit');
    component.selectSubcategory('Groceries');

    expect(component.searchTerm()).toBe('Groceries');
    expect(categoryServiceMock.registerSubcategory).toHaveBeenCalledWith('Groceries');
    expect(component.valueChange.emit).toHaveBeenCalledWith('Groceries');
    expect(component.isOpen()).toBeFalse();
  });

  it('should allow typing custom subcategory', () => {
    spyOn(component.valueChange, 'emit');
    component.searchTerm.set('Fresh Produce');

    expect(component.canCreateCustom()).toBeTrue();

    component.createAndSelectCustom();
    expect(categoryServiceMock.registerSubcategory).toHaveBeenCalledWith('Fresh Produce');
    expect(component.valueChange.emit).toHaveBeenCalledWith('Fresh Produce');
  });

  it('should clear value when clear button is clicked', () => {
    spyOn(component.valueChange, 'emit');
    component.searchTerm.set('Food');

    const dummyEvent = new MouseEvent('click');
    component.clearValue(dummyEvent);

    expect(component.searchTerm()).toBe('');
    expect(component.valueChange.emit).toHaveBeenCalledWith(null);
  });
});
