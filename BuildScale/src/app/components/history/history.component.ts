import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthService } from '../../services/auth.service';
import { QuantityService } from '../../services/quantity.service';
import { ToastService } from '../../services/toast.service';
import { HistoryItem } from '../../models/quantity.models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './history.component.html'
})
export class HistoryComponent implements OnInit {
  allHistory = signal<HistoryItem[]>([]);
  filteredHistory = signal<HistoryItem[]>([]);
  currentFilter = signal('all');
  loading = signal(true);

  constructor(
    private auth: AuthService,
    private quantityService: QuantityService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  async loadHistory(): Promise<void> {
    const token = this.auth.getToken();
    if (!token) { this.router.navigate(['/auth']); return; }
    this.loading.set(true);
    try {
      const history = await this.quantityService.loadHistory(token) as HistoryItem[];
      this.allHistory.set(history);
      this.applyFilter(this.currentFilter());
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === '401') {
        localStorage.removeItem('token');
        this.router.navigate(['/auth']);
      }
    } finally {
      this.loading.set(false);
    }
  }

  onFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.applyFilter(select.value);
  }

  applyFilter(filter: string): void {
    this.currentFilter.set(filter);
    if (filter === 'all') {
      this.filteredHistory.set(this.allHistory());
    } else {
      this.filteredHistory.set(
        this.allHistory().filter(i => (i.operation || '').toLowerCase() === filter.toLowerCase())
      );
    }
  }

  formatDetails(item: HistoryItem): string {
    const op = (item.operation || '').toLowerCase();
    if (op === 'convert') {
      return `${this.fmt(item.operand1Value)} ${item.operand1Unit ?? ''} → (${item.resultUnit ?? ''})`;
    }
    if (['compare', 'add', 'subtract', 'divide'].includes(op)) {
      const sym: Record<string, string> = { add: '+', subtract: '−', divide: '÷', compare: 'vs' };
      return `${this.fmt(item.operand1Value)} ${item.operand1Unit ?? ''} ${sym[op] || op} ${this.fmt(item.operand2Value)} ${item.operand2Unit ?? ''}`;
    }
    return 'N/A';
  }

  formatResult(item: HistoryItem): string {
    const op = (item.operation || '').toLowerCase();
    if (op === 'compare') return item.boolResult === true ? '✓ Equal' : '✗ Not equal';
    if (op === 'divide') return item.scalarResult != null ? item.scalarResult.toFixed(6) : 'N/A';
    if (item.resultValue != null) return `${this.fmt(item.resultValue)} ${item.resultUnit ?? ''}`;
    return 'N/A';
  }

  fmt(n: number | null | undefined): string {
    return this.quantityService.fmt(n);
  }

  async deleteHistoryItem(id: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const token = this.auth.getToken();
    if (!token) return;
    try {
      await this.quantityService.deleteHistoryItem(id, token);
      this.toast.show('Item deleted successfully', 'success');
      this.loadHistory();
    } catch {
      this.toast.show('Failed to delete item', 'error');
    }
  }

  async clearHistory(): Promise<void> {
    if (!confirm('Clear ALL history? This cannot be undone.')) return;
    const token = this.auth.getToken();
    if (!token) return;
    try {
      await this.quantityService.clearHistory(token);
      this.toast.show('History cleared', 'success');
      this.allHistory.set([]);
      this.filteredHistory.set([]);
    } catch {
      this.toast.show('Failed to clear history', 'error');
    }
  }

  getBadgeClass(op: string): string {
    return `operation-badge badge-${op.toLowerCase()}`;
  }

  formatDate(ts: string): string {
    return new Date(ts).toLocaleString();
  }
}