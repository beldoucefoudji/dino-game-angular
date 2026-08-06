import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NakamaService } from '../../services/nakama';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css']
})
export class Auth {
  mode: 'login' | 'signup' = 'login';
  email = '';
  password = '';
  keepSignedIn = false;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private nakama: NakamaService,
    private router: Router
  ) {}

  goHome() {
    this.router.navigate(['/']);
  }

  async onSubmit() {
    this.errorMessage = '';
    this.isSubmitting = true;

    try {
      const createAccount = this.mode === 'signup';
      const session = await this.nakama.authenticateEmail(this.email, this.password, createAccount);
      const displayName = this.email.split('@')[0] || 'Player';

      this.nakama.updateProfile({
        username: session.username ?? displayName,
        email: this.email
      });

      if (createAccount) {
        // After successful signup, switch to login mode and prompt user to sign in
        this.mode = 'login';
        this.password = '';
        this.errorMessage = 'Account created — please log in.';
      } else {
        this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      console.error('Auth failed:', error);
      this.errorMessage = this.mode === 'login'
        ? 'Incorrect email or password.'
        : 'Could not create account. Try a different email.';
    } finally {
      this.isSubmitting = false;
    }
  }
}