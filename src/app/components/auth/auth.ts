import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NakamaService } from '../../services/nakama';
import { LanguageService } from '../../services/language';
import { SoundService } from '../../services/sound';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, RouterLink],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class Auth {
  mode: 'login' | 'signup' = 'login';
  email = '';
  password = '';
  keepSignedIn = false;
  isSubmitting = false;
  errorMessage = '';

  private translations = {
    en: {
      welcome: 'WELCOME BACK!', login: 'Login', signup: 'Sign up',
      email: 'Email', password: 'Password', keep: 'Remember me', forgot: 'Forgot Password?',
      submitLogin: 'LOGIN', submitSignup: 'CREATE ACCOUNT',
      or: 'OR CONTINUE WITH', noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?'
    },
    fr: {
      welcome: 'BON RETOUR !', login: 'Connexion', signup: "S'inscrire",
      email: 'E-mail', password: 'Mot de passe', keep: 'Se souvenir de moi', forgot: 'Mot de passe oublié ?',
      submitLogin: 'SE CONNECTER', submitSignup: 'CRÉER UN COMPTE',
      or: 'OU CONTINUER AVEC', noAccount: "Vous n'avez pas de compte ?",
      hasAccount: 'Vous avez déjà un compte ?'
    }
  };

  constructor(
    private nakama: NakamaService,
    private router: Router,
    public language: LanguageService,
    public sound: SoundService
  ) {}

  t(key: string): string {
    return (this.translations as any)[this.language.lang()][key];
  }

  switchMode(mode: 'login' | 'signup') {
    this.sound.play(420);
    this.mode = mode;
    this.errorMessage = '';
  }

  async onSubmit() {
    this.errorMessage = '';
    this.isSubmitting = true;
    try {
      const createAccount = this.mode === 'signup';
      await this.nakama.authenticateEmail(this.email, this.password, createAccount);
      this.sound.play(600, 0.12);
      if (createAccount) {
        this.mode = 'login';
        this.password = '';
        this.errorMessage = 'Account created — please log in.';
      } else {
        this.router.navigate(['/mode-select']);
      }
    } catch (error) {
      console.error('Auth failed:', error);
      this.sound.play(180, 0.15);
      this.errorMessage = this.mode === 'login'
        ? 'Incorrect email or password.'
        : 'Could not create account. Try a different email.';
    } finally {
      this.isSubmitting = false;
    }
  }
}