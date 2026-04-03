import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { SavePayload } from '../models/quantity.models';

const PENDING_KEY = 'pendingOperations';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private get apiBase(): string {
  return (window as any).__env?.apiUrl || 'https://quantitymeasurementappbackend.onrender.com';
}
isLoggedIn = signal<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {
    this.isLoggedIn.set(!!localStorage.getItem('token'));

    // Cross-tab: listen for token changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'token' && e.newValue) {
        this.isLoggedIn.set(true);
        this.flushPendingOperations();
      }
    });
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUsername(): string {
    return localStorage.getItem('username') || '';
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    this.isLoggedIn.set(false);
    this.router.navigate(['/']);
  }

  handleGoogleCallbackToken(): void {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const username = params.get('username');
    if (!token) return;

    localStorage.setItem('token', token);
    if (username) localStorage.setItem('username', decodeURIComponent(username));
    window.history.replaceState({}, '', window.location.pathname);
    this.isLoggedIn.set(true);
    this.flushPendingOperations().then(() => {});
  }

  async login(email: string, password: string): Promise<void> {
    const res = await fetch(`${this.apiBase}/api/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    this.isLoggedIn.set(true);
    await this.flushPendingOperations();
  }

  async signup(username: string, email: string, password: string): Promise<void> {
    const res = await fetch(`${this.apiBase}/api/Auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    this.isLoggedIn.set(true);
    await this.flushPendingOperations();
  }

  handleGoogleLogin(): void {
    window.location.href = `${this.apiBase}/api/Auth/google-login`;
  }

  // Pending queue
  getPending(): SavePayload[] {
    try {
      return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
    } catch {
      return [];
    }
  }

  addToPending(p: SavePayload): void {
    const list = this.getPending();
    list.push(p);
    localStorage.setItem(PENDING_KEY, JSON.stringify(list));
  }

  clearPending(): void {
    localStorage.removeItem(PENDING_KEY);
  }

  async flushPendingOperations(): Promise<void> {
    const pending = this.getPending();
    if (!pending.length) return;
    const token = this.getToken();
    if (!token) return;
    try {
      const res = await fetch(`${this.apiBase}/api/QuantityMeasurement/save-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(pending)
      });
      if (res.ok) {
        this.clearPending();
      } else {
        console.error('Flush batch failed');
      }
    } catch (e) {
      console.error('Flush error:', e);
    }
  }

  async saveToServer(payload: SavePayload): Promise<void> {
    const token = this.getToken();
    if (!token) return;
    try {
      const res = await fetch(`${this.apiBase}/api/QuantityMeasurement/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          this.isLoggedIn.set(false);
          this.addToPending(payload);
        } else {
          const err = await res.json().catch(() => ({}));
          console.error('Save failed:', (err as { message?: string }).message);
        }
      }
    } catch (e) {
      console.error('Save error:', e);
      this.addToPending(payload);
    }
  }
}
