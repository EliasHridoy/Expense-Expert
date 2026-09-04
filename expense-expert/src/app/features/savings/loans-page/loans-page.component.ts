import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { LoanService } from '../../../core/services/loan.service';
import { PersonService } from '../../../core/services/person.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { ToastService } from '../../../core/services/toast.service';
import { TourService } from '../../../core/services/tour.service';
import { LoanTaken, LoanStatus } from '../../../core/models/loan.model';
import { Person } from '../../../core/models/person.model';
import { Expense } from '../../../core/models/expense.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

type Tab = 'taken' | 'given';

interface LoanPersonRow<T> {
  person: Person;
  totalAmount: number;
  totalRepaid: number;
  outstanding: number;
  loans: T[];
  expanded?: boolean;
}

@Component({
  selector: 'app-loans-page',
  standalone: true,
  imports: [FormsModule, DecimalPipe, DatePipe, PageHeaderComponent, ConfirmDialogComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <app-page-header title="Loans" />

    <!-- Tab Switcher -->
    <div id="loan-tabs" class="flex gap-1 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-full sm:w-fit">
      <button (click)="activeTab.set('taken')"
        [class]="activeTab() === 'taken'
          ? 'flex-1 sm:flex-none text-center px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm transition-all'
          : 'flex-1 sm:flex-none text-center px-4 sm:px-5 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all'">
        💸 Loan Taken
      </button>
      <button (click)="activeTab.set('given')"
        [class]="activeTab() === 'given'
          ? 'flex-1 sm:flex-none text-center px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm transition-all'
          : 'flex-1 sm:flex-none text-center px-4 sm:px-5 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all'">
        🤝 Loan Given
      </button>
    </div>

    @if (isLoading()) {
      <app-loading-spinner size="lg" [fullPage]="true" />
    } @else {

      <!-- ===================== LOAN TAKEN TAB ===================== -->
      @if (activeTab() === 'taken') {
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div class="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-100 dark:border-red-800/30 p-4">
            <p class="text-xs font-medium text-red-500 dark:text-red-400 uppercase tracking-wide mb-1">Total Borrowed</p>
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ takenTotal() | number:'1.0-0' }}</p>
          </div>
          <div class="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30 p-4">
            <p class="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">Outstanding</p>
            <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ takenOutstanding() | number:'1.0-0' }}</p>
          </div>
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800/30 p-4">
            <p class="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">Repaid</p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ takenRepaid() | number:'1.0-0' }}</p>
          </div>
        </div>

        <!-- Add Button -->
        <div id="add-loan-btn" class="flex justify-end mb-4">
          <button (click)="showAddTaken.set(!showAddTaken()); takenStep.set(1)"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
            {{ showAddTaken() ? 'Cancel' : '+ Record Loan Taken' }}
          </button>
        </div>

        <!-- Add Loan Taken Form -->
        @if (showAddTaken()) {
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-5 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                @if (takenStep() > 1) {
                  <button (click)="takenStep.set(takenStep() - 1)" class="p-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                }
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Record Money Borrowed</h3>
              </div>
              <div class="flex gap-1.5">
                <div class="h-1.5 w-6 rounded-full transition-colors" [class.bg-red-500]="takenStep() >= 1" [class.bg-gray-200]="takenStep() < 1" [class.dark:bg-gray-700]="takenStep() < 1"></div>
                <div class="h-1.5 w-6 rounded-full transition-colors" [class.bg-red-500]="takenStep() >= 2" [class.bg-gray-200]="takenStep() < 2" [class.dark:bg-gray-700]="takenStep() < 2"></div>
              </div>
            </div>

            @if (takenStep() === 1) {
              <div class="space-y-4 mb-4">
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Amount</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input type="number" [(ngModel)]="newTaken.amount" min="1" placeholder="0.00" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 pl-8 pr-3 py-2 text-lg font-bold focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date</label>
                  <input type="date" [(ngModel)]="newTaken.date" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all" />
                </div>
              </div>
              <button (click)="takenStep.set(2)" [disabled]="!newTaken.amount || !newTaken.date" class="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50">Next Step</button>
            }

            @if (takenStep() === 2) {
              <div class="space-y-4 mb-4">
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From Person</label>
                  <select [(ngModel)]="newTaken.personId" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all">
                    <option value="">— Select person —</option>
                    @for (p of persons(); track p.id) { <option [value]="p.id">{{ p.name }}</option> }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Or Add New Person</label>
                  <div class="flex gap-2">
                    <input type="text" [(ngModel)]="newPersonName" placeholder="New person name" class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all" />
                    <button (click)="addNewPerson()" [disabled]="!newPersonName.trim()" class="rounded-lg bg-gray-200 dark:bg-gray-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors">Add</button>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Note (optional)</label>
                  <input type="text" [(ngModel)]="newTaken.note" placeholder="e.g. emergency, business" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all" />
                </div>
              </div>
              <button (click)="saveLoanTaken()" [disabled]="!newTaken.personId" class="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50">Save Loan</button>
            }
          </div>
        }

        <!-- Loans Taken List -->
        @if (takenRows().length === 0) {
          <app-empty-state icon="💸" message="No loans taken yet" />
        } @else {
          <div class="space-y-3">
            @for (row of takenRows(); track row.person.id) {
              <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-200">
                
                <div class="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" (click)="row.expanded = !row.expanded">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-lg font-bold text-red-600 dark:text-red-400">
                      {{ row.person.name.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900 dark:text-gray-100">{{ row.person.name }}</p>
                      <p class="text-xs text-gray-400">{{ row.loans.length }} loan{{ row.loans.length !== 1 ? 's' : '' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <div class="text-right">
                      <p class="text-xs text-gray-400 mb-0.5">Outstanding</p>
                      <p [class]="row.outstanding > 0 ? 'text-red-600 dark:text-red-400 font-bold text-lg' : 'text-green-600 dark:text-green-400 font-bold text-lg'">
                        {{ row.outstanding | number:'1.0-0' }}
                      </p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 transition-transform duration-200" [class.rotate-180]="row.expanded" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>

                @if (row.expanded) {
                  <div class="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                    
                    @if (row.outstanding > 0) {
                      <div class="mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex flex-wrap items-end justify-end gap-2.5">
                          <div class="flex-1 min-w-[130px]">
                            <label class="block text-[10px] font-medium text-gray-500 uppercase mb-1">Date</label>
                            <input type="date" [(ngModel)]="personRepayDates[row.person.id]" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:ring-1 focus:ring-red-500" />
                          </div>
                          <div class="flex-1 min-w-[110px]">
                            <label class="block text-[10px] font-medium text-gray-500 uppercase mb-1">Pay Amount</label>
                            <input type="number" [(ngModel)]="personRepayAmounts[row.person.id]" [max]="row.outstanding" min="1" placeholder="0" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-right focus:ring-1 focus:ring-red-500 font-bold" />
                          </div>
                          <div class="w-full sm:w-auto">
                            <button (click)="recordPersonRepayment(row)" [disabled]="!personRepayAmounts[row.person.id] || !personRepayDates[row.person.id]" class="w-full sm:w-auto rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">Pay</button>
                          </div>
                        </div>
                      </div>
                    }

                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Transaction History</h4>
                    <div class="space-y-2">
                      @for (loan of row.loans; track loan.id || $index) {
                        <div class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                          <div>
                            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                              <span class="mr-2">{{ getValidDate(loan.date) | date:'shortDate' }}</span>
                              <span class="text-gray-500 font-normal">{{ loan.note || 'No note' }}</span>
                            </p>
                          </div>
                          <div class="text-right">
                            <p class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ loan.amount | number:'1.0-0' }}</p>
                            @if (loan.repaid) {
                              <p class="text-xs text-green-600 dark:text-green-400 mt-0.5">Repaid: {{ loan.repaid | number:'1.0-0' }}</p>
                            }
                            @if (loan.status === 'cleared') {
                              <span class="inline-block mt-1 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">CLEARED</span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      }

      <!-- ===================== LOAN GIVEN TAB ===================== -->
      @if (activeTab() === 'given') {
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 p-4">
            <p class="text-xs font-medium text-blue-500 dark:text-blue-400 uppercase tracking-wide mb-1">Total Lent</p>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ givenTotal() | number:'1.0-0' }}</p>
          </div>
          <div class="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30 p-4">
            <p class="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">Outstanding</p>
            <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ givenOutstanding() | number:'1.0-0' }}</p>
          </div>
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800/30 p-4">
            <p class="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">Received Back</p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ givenRepaid() | number:'1.0-0' }}</p>
          </div>
        </div>

        <!-- Add Button -->
        <div id="add-loan-btn" class="flex justify-end mb-4">
          <button (click)="showAddGiven.set(!showAddGiven()); givenStep.set(1)"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            {{ showAddGiven() ? 'Cancel' : '+ Record Loan Given' }}
          </button>
        </div>

        <!-- Add Loan Given Form -->
        @if (showAddGiven()) {
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-5 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                @if (givenStep() > 1) {
                  <button (click)="givenStep.set(givenStep() - 1)" class="p-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                }
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Record Money Lent</h3>
              </div>
              <div class="flex gap-1.5">
                <div class="h-1.5 w-6 rounded-full transition-colors" [class.bg-blue-500]="givenStep() >= 1" [class.bg-gray-200]="givenStep() < 1" [class.dark:bg-gray-700]="givenStep() < 1"></div>
                <div class="h-1.5 w-6 rounded-full transition-colors" [class.bg-blue-500]="givenStep() >= 2" [class.bg-gray-200]="givenStep() < 2" [class.dark:bg-gray-700]="givenStep() < 2"></div>
              </div>
            </div>

            @if (givenStep() === 1) {
              <div class="space-y-4 mb-4">
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Amount</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input type="number" [(ngModel)]="newGiven.amount" min="1" placeholder="0.00" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 pl-8 pr-3 py-2 text-lg font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date</label>
                  <input type="date" [(ngModel)]="newGiven.date" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                </div>
              </div>
              <button (click)="givenStep.set(2)" [disabled]="!newGiven.amount || !newGiven.date" class="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50">Next Step</button>
            }

            @if (givenStep() === 2) {
              <div class="space-y-4 mb-4">
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">To Person</label>
                  <select [(ngModel)]="newGiven.personId" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all">
                    <option value="">— Select person —</option>
                    @for (p of persons(); track p.id) { <option [value]="p.id">{{ p.name }}</option> }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Or Add New Person</label>
                  <div class="flex gap-2">
                    <input type="text" [(ngModel)]="newPersonName" placeholder="New person name" class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                    <button (click)="addNewPerson()" [disabled]="!newPersonName.trim()" class="rounded-lg bg-gray-200 dark:bg-gray-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors">Add</button>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Note (optional)</label>
                  <input type="text" [(ngModel)]="newGiven.note" placeholder="e.g. emergency, business" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                </div>
              </div>
              <button (click)="saveLoanGiven()" [disabled]="!newGiven.personId" class="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50">Save Loan</button>
            }
          </div>
        }

        @if (givenRows().length === 0) {
          <app-empty-state message="No loans given yet. Add a loan expense with a person assigned." />
        } @else {
          <div class="space-y-3">
            @for (row of givenRows(); track row.person.id) {
              <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-200">
                <div class="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" (click)="row.expanded = !row.expanded">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-lg font-bold text-blue-600 dark:text-blue-400">
                      {{ row.person.name.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900 dark:text-gray-100">{{ row.person.name }}</p>
                      <p class="text-xs text-gray-400">{{ row.loans.length }} loan{{ row.loans.length !== 1 ? 's' : '' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <div class="text-right">
                      <p class="text-xs text-gray-400 mb-0.5">Outstanding</p>
                      <p [class]="row.outstanding > 0 ? 'text-red-600 dark:text-red-400 font-bold text-lg' : 'text-green-600 dark:text-green-400 font-bold text-lg'">
                        {{ row.outstanding | number:'1.0-0' }}
                      </p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 transition-transform duration-200" [class.rotate-180]="row.expanded" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>

                @if (row.expanded) {
                  <div class="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                    
                    @if (row.outstanding > 0) {
                      <div class="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3 mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
                        <button (click)="selectedGivenRow = row; showClearConfirm.set(true)" class="text-xs font-medium text-red-500 hover:text-red-700 px-3 py-2 border border-red-200 dark:border-red-800 rounded-lg bg-white dark:bg-gray-800 shadow-sm transition-colors text-center">Clear All Outstanding</button>

                        <div class="flex flex-wrap items-end gap-2 justify-end">
                          <div class="flex-1 min-w-[110px]">
                            <label class="block text-[10px] font-medium text-gray-500 uppercase mb-1">Pay Amount</label>
                            <input type="number" [(ngModel)]="personGivenRepayAmounts[row.person.id]" [max]="row.outstanding" min="1" placeholder="0" class="w-full sm:w-28 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-right focus:ring-1 focus:ring-blue-500 font-bold" />
                          </div>
                          <div class="w-full sm:w-auto">
                            <button (click)="recordPersonGivenRepayment(row)" [disabled]="!personGivenRepayAmounts[row.person.id]" class="w-full sm:w-auto rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">Receive Pay</button>
                          </div>
                        </div>
                      </div>
                    }

                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Transaction History</h4>
                    <div class="space-y-2">
                      @for (loan of row.loans; track loan.id || $index) {
                        <div class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                          <div>
                            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                              <span class="mr-2">{{ getValidDate(loan.date) | date:'shortDate' }}</span>
                              <span class="text-gray-500 font-normal">{{ loan.title || 'No note' }}</span>
                            </p>
                          </div>
                          <div class="text-right">
                            <p class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ loan.amount | number:'1.0-0' }}</p>
                            @if (loan.loanRepaid) {
                              <p class="text-xs text-green-600 dark:text-green-400 mt-0.5">Received: {{ loan.loanRepaid | number:'1.0-0' }}</p>
                            }
                            @if (loan.loanCleared) {
                              <span class="inline-block mt-1 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">CLEARED</span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    }

    <app-confirm-dialog
      [isOpen]="showClearConfirm()"
      title="Clear All Loans"
      [message]="'Mark all outstanding loans for ' + (selectedGivenRow?.person?.name || '') + ' as fully repaid?'"
      confirmLabel="Clear All"
      (confirmed)="clearGivenLoans()"
      (cancelled)="showClearConfirm.set(false)"
    />
  `,
})
export class LoansPageComponent implements OnInit {
  private loanService = inject(LoanService);
  private personService = inject(PersonService);
  private expenseService = inject(ExpenseService);
  private toastService = inject(ToastService);
  private tourService = inject(TourService);
  router = inject(Router);

  activeTab = signal<Tab>('taken');
  isLoading = signal(true);

  persons = signal<Person[]>([]);
  takenRows = signal<LoanPersonRow<LoanTaken>[]>([]);
  givenRows = signal<LoanPersonRow<Expense>[]>([]);

  showAddTaken = signal(false);
  showAddGiven = signal(false);
  showClearConfirm = signal(false);
  takenStep = signal(1);
  givenStep = signal(1);

  newPersonName = '';
  newTaken = { personId: '', amount: 0, date: '', note: '' };
  newGiven = { personId: '', amount: 0, date: '', note: '' };
  
  personRepayAmounts: Record<string, number> = {};
  personRepayDates: Record<string, string> = {};
  personGivenRepayAmounts: Record<string, number> = {};
  
  selectedGivenRow: LoanPersonRow<Expense> | null = null;

  takenTotal = computed(() => this.takenRows().reduce((s, r) => s + r.totalAmount, 0));
  takenRepaid = computed(() => this.takenRows().reduce((s, r) => s + r.totalRepaid, 0));
  takenOutstanding = computed(() => this.takenRows().reduce((s, r) => s + r.outstanding, 0));

  givenTotal = computed(() => this.givenRows().reduce((s, r) => s + r.totalAmount, 0));
  givenRepaid = computed(() => this.givenRows().reduce((s, r) => s + r.totalRepaid, 0));
  givenOutstanding = computed(() => this.givenRows().reduce((s, r) => s + r.outstanding, 0));

  private personMap = new Map<string, Person>();

  ngOnInit(): void {
    combineLatest([
      this.personService.getPersons(),
      this.expenseService.getAllLoans(),
      this.loanService.getAllLoansTaken(),
    ]).subscribe(([persons, givenLoans, takenLoans]) => {
      this.persons.set(persons);
      this.personMap.clear();
      persons.forEach((p) => this.personMap.set(p.id, p));
      
      this.buildGivenRows(givenLoans, persons);
      this.buildTakenRows(takenLoans, persons);
      
      this.isLoading.set(false);
      
      this.tourService.loadTourState().then(() => {
        this.tourService.tryStartPageTour('loans');
      });
    });
  }

  private buildGivenRows(loans: Expense[], persons: Person[]): void {
    const personMap = new Map<string, Person>(persons.map((p) => [p.id, p]));
    const rowMap = new Map<string, LoanPersonRow<Expense>>();
    for (const loan of loans) {
      if (!loan.loanPersonId) continue;
      const person = personMap.get(loan.loanPersonId);
      if (!person) continue;
      const row = rowMap.get(loan.loanPersonId) || { person, totalAmount: 0, totalRepaid: 0, outstanding: 0, loans: [], expanded: false };
      row.totalAmount += loan.amount;
      row.totalRepaid += loan.loanRepaid ?? 0;
      row.outstanding += loan.amount - (loan.loanRepaid ?? 0);
      row.loans.push(loan);
      rowMap.set(loan.loanPersonId, row);
    }
    
    // Sort loans inside each row oldest to newest
    const rows = Array.from(rowMap.values());
    rows.forEach(r => r.loans.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    this.givenRows.set(rows);
  }

  private buildTakenRows(loans: LoanTaken[], persons: Person[]): void {
    const personMap = new Map<string, Person>(persons.map((p) => [p.id, p]));
    const rowMap = new Map<string, LoanPersonRow<LoanTaken>>();
    const today = new Date().toISOString().split('T')[0];
    
    for (const loan of loans) {
      const person = personMap.get(loan.personId);
      if (!person) continue;
      const row = rowMap.get(loan.personId) || { person, totalAmount: 0, totalRepaid: 0, outstanding: 0, loans: [], expanded: false };
      row.totalAmount += loan.amount;
      row.totalRepaid += loan.repaid ?? 0;
      row.outstanding += loan.amount - (loan.repaid ?? 0);
      row.loans.push(loan);
      rowMap.set(loan.personId, row);
      
      if (!this.personRepayDates[loan.personId]) {
        this.personRepayDates[loan.personId] = today;
      }
    }

    // Sort loans inside each row oldest to newest
    const rows = Array.from(rowMap.values());
    rows.forEach(r => r.loans.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    this.takenRows.set(rows);
  }

  getPersonName(id: string): string {
    return this.personMap.get(id)?.name ?? id;
  }

  getValidDate(dateVal: any): Date | null {
    if (!dateVal) return null;
    if (dateVal instanceof Date) return dateVal;
    if (typeof dateVal.toDate === 'function') return dateVal.toDate();
    if (dateVal.seconds) return new Date(dateVal.seconds * 1000);
    return new Date(dateVal);
  }

  async addNewPerson(): Promise<void> {
    if (!this.newPersonName.trim()) return;
    try {
      const id = await this.personService.addPersonIfNotExists(this.newPersonName.trim());
      this.newTaken.personId = id;
      this.newPersonName = '';
      this.toastService.success('Person added');
    } catch {
      this.toastService.error('Failed to add person');
    }
  }

  async saveLoanTaken(): Promise<void> {
    if (!this.newTaken.personId || !this.newTaken.amount || !this.newTaken.date) return;
    try {
      await this.loanService.addLoanTaken({
        personId: this.newTaken.personId,
        amount: this.newTaken.amount,
        note: this.newTaken.note,
        date: new Date(this.newTaken.date),
      });
      this.newTaken = { personId: '', amount: 0, date: '', note: '' };
      this.showAddTaken.set(false);
      this.toastService.success('Loan recorded');
    } catch {
      this.toastService.error('Failed to save loan');
    }
  }

  async saveLoanGiven(): Promise<void> {
    if (!this.newGiven.personId || !this.newGiven.amount || !this.newGiven.date) return;
    try {
      await this.expenseService.addExpense({
        title: 'Loan Given to ' + this.getPersonName(this.newGiven.personId),
        description: this.newGiven.note,
        amount: this.newGiven.amount,
        category: 'other' as any,
        date: new Date(this.newGiven.date),
        isLoan: true,
        loanPersonId: this.newGiven.personId,
      } as any);
      this.newGiven = { personId: '', amount: 0, date: '', note: '' };
      this.showAddGiven.set(false);
      this.toastService.success('Loan recorded');
    } catch {
      this.toastService.error('Failed to save loan');
    }
  }

  async recordPersonRepayment(row: LoanPersonRow<LoanTaken>): Promise<void> {
    let amount = this.personRepayAmounts[row.person.id];
    const date = this.personRepayDates[row.person.id] || new Date().toISOString().split('T')[0];
    if (!amount || amount <= 0) return;
    
    if (amount > row.outstanding) {
      this.toastService.error(`Max repayment is ${row.outstanding}`);
      return;
    }

    try {
      // Get only uncleared loans, already sorted oldest to newest
      const activeLoans = row.loans.filter(l => l.status !== 'cleared');
      
      for (const loan of activeLoans) {
        if (amount <= 0) break;
        
        const remainingOnLoan = loan.amount - (loan.repaid || 0);
        const paymentForThisLoan = Math.min(amount, remainingOnLoan);
        
        await this.loanService.recordRepayment(loan, paymentForThisLoan, new Date(date));
        amount -= paymentForThisLoan;
      }
      
      this.personRepayAmounts[row.person.id] = 0;
      this.toastService.success('Repayment recorded');
    } catch {
      this.toastService.error('Failed to record repayment');
    }
  }

  async recordPersonGivenRepayment(row: LoanPersonRow<Expense>): Promise<void> {
    let amount = this.personGivenRepayAmounts[row.person.id];
    if (!amount || amount <= 0) return;
    
    if (amount > row.outstanding) {
      this.toastService.error(`Max is ${row.outstanding}`);
      return;
    }

    try {
      const activeLoans = row.loans.filter(l => !l.loanCleared);
      
      for (const loan of activeLoans) {
        if (amount <= 0) break;
        
        const remainingOnLoan = loan.amount - (loan.loanRepaid || 0);
        const paymentForThisLoan = Math.min(amount, remainingOnLoan);
        
        await this.expenseService.recordLoanRepayment(loan, paymentForThisLoan);
        amount -= paymentForThisLoan;
      }
      
      this.personGivenRepayAmounts[row.person.id] = 0;
      this.toastService.success('Payment recorded');
    } catch {
      this.toastService.error('Failed to record payment');
    }
  }

  async clearGivenLoans(): Promise<void> {
    if (!this.selectedGivenRow) return;
    try {
      for (const loan of this.selectedGivenRow.loans.filter((l) => !l.loanCleared)) {
        await this.expenseService.clearLoan(loan.id);
      }
      this.toastService.success('Loans cleared');
    } catch {
      this.toastService.error('Failed to clear loans');
    }
    this.showClearConfirm.set(false);
    this.selectedGivenRow = null;
  }
}
