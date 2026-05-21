import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoanSummaryComponent } from './loan-summary.component';
import { ExpenseService } from '../../../core/services/expense.service';
import { PersonService } from '../../../core/services/person.service';
import { ToastService } from '../../../core/services/toast.service';
import { of, delay } from 'rxjs';

describe('LoanSummaryComponent Performance', () => {
  let component: LoanSummaryComponent;
  let fixture: ComponentFixture<LoanSummaryComponent>;
  let expenseServiceSpy: jasmine.SpyObj<ExpenseService>;
  let personServiceSpy: jasmine.SpyObj<PersonService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    expenseServiceSpy = jasmine.createSpyObj('ExpenseService', ['getAllLoans']);
    personServiceSpy = jasmine.createSpyObj('PersonService', ['getPersons']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [LoanSummaryComponent],
      providers: [
        { provide: ExpenseService, useValue: expenseServiceSpy },
        { provide: PersonService, useValue: personServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ]
    }).compileComponents();
  });

  it('measures baseline execution time for loadData', fakeAsync(() => {
    // Mock the observables to take 500ms each
    personServiceSpy.getPersons.and.returnValue(of([{ id: '1', name: 'Alice' } as any]).pipe(delay(500)));
    expenseServiceSpy.getAllLoans.and.returnValue(of([{ id: 'l1', amount: 100, loanPersonId: '1', loanRepaid: 0, loanCleared: false } as any]).pipe(delay(500)));

    fixture = TestBed.createComponent(LoanSummaryComponent);
    component = fixture.componentInstance;

    const startTime = Date.now();

    // Trigger ngOnInit which calls loadData
    fixture.detectChanges();

    // With combineLatest, both requests run in parallel and take 500ms total
    tick(500);
    expect(component.isLoading()).toBeFalse();

    expect(component.summaryRows().length).toBe(1);
  }));
});
