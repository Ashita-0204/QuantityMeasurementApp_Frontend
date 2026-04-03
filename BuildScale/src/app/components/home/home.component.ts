import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthService } from '../../services/auth.service';
import { QuantityService } from '../../services/quantity.service';
import { ToastService } from '../../services/toast.service';
import {
  OperationType,
  UnitCategory,
  OperationRequest,
  ApiResult,
  UNIT_MAP
} from '../../models/quantity.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  modalActive = signal(false);
  currentOperation = signal<OperationType | null>(null);
  modalTitle = signal('');

  selectedCategory = signal<UnitCategory | ''>('');
  availableUnits = signal<string[]>([]);
  value1 = signal('');
  unit1 = signal('');
  value2 = signal('');
  unit2 = signal('');
  convertValue = signal('');
  fromUnit = signal('');
  toUnit = signal('');

  showResult = signal(false);
  currentResult = signal<ApiResult | null>(null);
  isLoggedIn = signal(false);

  readonly categories: UnitCategory[] = ['Length', 'Weight', 'Volume', 'Temperature'];

  readonly operations = [
    { id: 'add' as OperationType,      label: 'Add',      desc: 'Sum two quantities of the same unit',    svgPath: 'M24 12V36M12 24H36' },
    { id: 'subtract' as OperationType, label: 'Subtract', desc: 'Find the difference between quantities', svgPath: 'M12 24H36' },
    { id: 'divide' as OperationType,   label: 'Divide',   desc: 'Divide a quantity by another quantity',  svgPath: 'M12 24H36M24 12V16M24 32V36' },
    { id: 'compare' as OperationType,  label: 'Compare',  desc: 'Compare two quantities',                 svgPath: 'M16 20L24 12L32 20M16 28L24 36L32 28' },
    { id: 'convert' as OperationType,  label: 'Convert',  desc: 'Convert between different units',        svgPath: 'M36 16L28 24L36 32M12 32L20 24L12 16' }
  ];

  constructor(
    private auth: AuthService,
    private quantityService: QuantityService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoggedIn.set(this.auth.isLoggedIn());
    this.auth.handleGoogleCallbackToken();
  }

  selectOperation(op: OperationType): void {
    this.currentOperation.set(op);
    const titles: Record<OperationType, string> = {
      add: 'Add Quantities', subtract: 'Subtract Quantities',
      divide: 'Divide Quantity', compare: 'Compare Quantities', convert: 'Convert Units'
    };
    this.modalTitle.set(titles[op]);
    this.selectedCategory.set('');
    this.availableUnits.set([]);
    this.value1.set(''); this.unit1.set('');
    this.value2.set(''); this.unit2.set('');
    this.convertValue.set(''); this.fromUnit.set(''); this.toUnit.set('');
    this.modalActive.set(true);
  }

  closeModal(): void { this.modalActive.set(false); }

  // Event handlers — no TypeScript casts allowed in Angular templates
  onCategoryChange(event: Event): void {
    const cat = (event.target as HTMLSelectElement).value;
    this.selectedCategory.set(cat as UnitCategory);
    this.availableUnits.set(UNIT_MAP[cat as UnitCategory] || []);
    this.unit1.set(''); this.unit2.set('');
    this.fromUnit.set(''); this.toUnit.set('');
  }

  onConvertValueChange(event: Event): void { this.convertValue.set((event.target as HTMLInputElement).value); }
  onFromUnitChange(event: Event): void     { this.fromUnit.set((event.target as HTMLSelectElement).value); }
  onToUnitChange(event: Event): void       { this.toUnit.set((event.target as HTMLSelectElement).value); }
  onValue1Change(event: Event): void       { this.value1.set((event.target as HTMLInputElement).value); }
  onUnit1Change(event: Event): void        { this.unit1.set((event.target as HTMLSelectElement).value); }
  onValue2Change(event: Event): void       { this.value2.set((event.target as HTMLInputElement).value); }
  onUnit2Change(event: Event): void        { this.unit2.set((event.target as HTMLSelectElement).value); }

  get isConvert(): boolean { return this.currentOperation() === 'convert'; }

  getActionLabel(): string {
    const op = this.currentOperation();
    if (!op) return 'Calculate';
    return { add: 'Add', subtract: 'Subtract', divide: 'Divide', compare: 'Compare', convert: 'Convert' }[op];
  }

  async performOperation(): Promise<void> {
    const op = this.currentOperation();
    if (!op) return;
    const cat = this.selectedCategory();
    if (!cat) { this.toast.show('Please select a category', 'error'); return; }

    let body: OperationRequest = {};
    if (op === 'convert') {
      const val = parseFloat(this.convertValue());
      const from = this.fromUnit();
      const to = this.toUnit();
      if (!from || !to || isNaN(val)) { this.toast.show('Please fill all fields', 'error'); return; }
      body = { value: val, fromUnit: from, toUnit: to, category: cat };
    } else {
      const v1 = parseFloat(this.value1());
      const u1 = this.unit1();
      const v2 = parseFloat(this.value2());
      const u2 = this.unit2();
      if (!u1 || !u2 || isNaN(v1) || isNaN(v2)) { this.toast.show('Please fill all fields', 'error'); return; }
      body = {
        quantity1: { value: v1, unit: u1, category: cat },
        quantity2: { value: v2, unit: u2, category: cat }
      };
    }

    try {
      const result = await this.quantityService.performOperation(op, body);
      this.currentResult.set(result);
      this.isLoggedIn.set(this.auth.isLoggedIn());
      this.closeModal();
      this.showResult.set(true);
      const payload = this.quantityService.buildSavePayload(op, body, result);
      if (this.auth.isLoggedIn()) {
        await this.auth.saveToServer(payload);
      } else {
        this.auth.addToPending(payload);
      }
    } catch (err) {
      this.toast.show(err instanceof Error ? err.message : 'Failed to perform operation', 'error');
    }
  }

  closeResult(): void { this.showResult.set(false); this.currentResult.set(null); }

  promptSignIn(): void {
    this.toast.show('Redirecting to sign in — your result is queued!', 'success');
    setTimeout(() => this.router.navigate(['/auth']), 1200);
  }

  fmt(n: number | null | undefined): string { return this.quantityService.fmt(n); }
  getConvertedValue(): string { const r = this.currentResult(); return r ? `${this.fmt(r.result?.value)} ${r.result?.unit ?? ''}` : '—'; }
  getOriginalValue(): string  { const r = this.currentResult(); return r ? `${this.fmt(r.operand1?.value)} ${r.operand1?.unit ?? ''}` : '—'; }
  isEqual(): boolean | null   { return this.currentResult()?.boolResult ?? null; }
  getArithmeticResult(): string { const r = this.currentResult(); return r ? `${this.fmt(r.result?.value)} ${r.result?.unit ?? ''}` : '—'; }
  getDivisionResult(): string   { return this.currentResult()?.scalarResult?.toFixed(6) ?? '—'; }

  onModalBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) this.closeModal();
  }
}
