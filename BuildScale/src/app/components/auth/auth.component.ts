import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth.component.html'
})
export class AuthComponent implements OnInit {
  showLogin = signal(true);

  loginEmail = signal('');
  loginPassword = signal('');
  rememberMe = signal(false);
  showLoginPw = signal(false);

  signupUsername = signal('');
  signupEmail = signal('');
  signupPassword = signal('');
  agreeTerms = signal(false);
  showSignupPw = signal(false);
  passwordStrengthClass = signal('');

  get isDark(): boolean { return this.theme.isDark(); }

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private router: Router,
    public theme: ThemeService
  ) {}

  ngOnInit(): void {
    if (this.auth.getToken()) this.router.navigate(['/']);
  }

  switchToLogin(): void  { this.showLogin.set(true); }
  switchToSignup(): void { this.showLogin.set(false); }
  toggleLoginPw(): void  { this.showLoginPw.update(v => !v); }
  toggleSignupPw(): void { this.showSignupPw.update(v => !v); }
  onThemeToggle(): void  { this.theme.toggleTheme(); }

  // Event handlers — no TypeScript casts allowed in Angular templates
  onLoginEmailChange(event: Event): void         { this.loginEmail.set((event.target as HTMLInputElement).value); }
  onLoginPasswordChange(event: Event): void      { this.loginPassword.set((event.target as HTMLInputElement).value); }
  onRememberMeChange(event: Event): void         { this.rememberMe.set((event.target as HTMLInputElement).checked); }
  onSignupUsernameChange(event: Event): void     { this.signupUsername.set((event.target as HTMLInputElement).value); }
  onSignupEmailChange(event: Event): void        { this.signupEmail.set((event.target as HTMLInputElement).value); }
  onAgreeTermsChange(event: Event): void         { this.agreeTerms.set((event.target as HTMLInputElement).checked); }

  onSignupPasswordChange(event: Event): void {
    const pw = (event.target as HTMLInputElement).value;
    this.signupPassword.set(pw);
    if (!pw) { this.passwordStrengthClass.set(''); return; }
    let s = 0;
    if (pw.length >= 8)        s++;
    if (pw.length >= 12)       s++;
    if (/[a-z]/.test(pw))      s++;
    if (/[A-Z]/.test(pw))      s++;
    if (/[0-9]/.test(pw))      s++;
    if (/[^a-zA-Z0-9]/.test(pw)) s++;
    this.passwordStrengthClass.set(s <= 2 ? 'strength-weak' : s <= 4 ? 'strength-medium' : 'strength-strong');
  }

  async handleLogin(): Promise<void> {
    const email = this.loginEmail().trim();
    const password = this.loginPassword();
    if (!email || !password) { this.toast.show('Please fill all fields', 'error'); return; }
    try {
      await this.auth.login(email, password);
      this.toast.show('Login successful!', 'success');
      setTimeout(() => this.router.navigate(['']), 1000);
    } catch (err) {
      this.toast.show(err instanceof Error ? err.message : 'Invalid email or password', 'error');
    }
  }

  async handleSignup(): Promise<void> {
    const username = this.signupUsername().trim();
    const email    = this.signupEmail().trim();
    const password = this.signupPassword();
    if (!username || !email || !password) { this.toast.show('Please fill all fields', 'error'); return; }
    if (!this.agreeTerms())               { this.toast.show('Please agree to terms', 'error');   return; }
    if (password.length < 8)              { this.toast.show('Password must be at least 8 characters', 'error'); return; }
    try {
      await this.auth.signup(username, email, password);
      this.toast.show('Account created!', 'success');
      setTimeout(() => this.router.navigate(['']), 1000);
    } catch (err) {
      this.toast.show(err instanceof Error ? err.message : 'Registration failed', 'error');
    }
  }

  handleGoogleLogin(): void { this.auth.handleGoogleLogin(); }

  onKeypress(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    if (this.showLogin()) this.handleLogin();
    else this.handleSignup();
  }
}
