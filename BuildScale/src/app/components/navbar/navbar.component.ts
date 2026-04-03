import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    private toast: ToastService,
    private router: Router
  ) {}

  get isDark(): boolean {
    return this.theme.isDark();
  }

  onThemeToggle(): void {
    this.theme.toggleTheme();
  }

  logout(): void {
    this.auth.logout();
    this.toast.show('Logged out', 'success');
  }
}
