import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthService } from '../../services/auth.service';
import { QuantityService } from '../../services/quantity.service';
import { ToastService } from '../../services/toast.service';
import { UserProfile } from '../../models/quantity.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  profile = signal<UserProfile | null>(null);

  constructor(
    private auth: AuthService,
    private quantityService: QuantityService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  async loadProfile(): Promise<void> {
    const token = this.auth.getToken();
    if (!token) { this.router.navigate(['/auth']); return; }
    try {
      const data = await this.quantityService.loadProfile(token) as UserProfile;
      this.profile.set(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === '401') {
        localStorage.removeItem('token');
        this.router.navigate(['/auth']);
      } else {
        this.toast.show('Failed to load profile', 'error');
      }
    }
  }

  get avatarLetter(): string {
    const p = this.profile();
    const username = p?.username || this.auth.getUsername() || 'U';
    return username.charAt(0).toUpperCase();
  }

  get username(): string {
    return this.profile()?.username || this.auth.getUsername() || 'User';
  }

  get email(): string {
    return this.profile()?.email || '';
  }

  get memberSince(): string {
    const p = this.profile();
    return p?.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A';
  }

  changePassword(): void {
    this.toast.show('Password change feature coming soon', 'error');
  }

  exportData(): void {
    this.toast.show('Data export feature coming soon', 'error');
  }

  deleteAccount(): void {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.toast.show('Account deletion feature coming soon', 'error');
    }
  }
}
