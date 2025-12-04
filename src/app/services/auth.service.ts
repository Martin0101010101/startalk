import { Injectable, inject } from '@angular/core';
import { Auth, authState, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, UserCredential } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private userService: UserService = inject(UserService);
  user$: Observable<User | null> = authState(this.auth);

  constructor() {}

  // Login with Google
  async loginWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(this.auth, provider);
    if (credential.user) {
      await this.userService.syncUserProfile(credential.user);
    }
    return credential;
  }

  // Login with Email/Password
  async loginWithEmail(email: string, password: string): Promise<UserCredential> {
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    // Note: For email login, we assume profile exists or is created on registration
    return credential;
  }

  // Register with Email/Password
  async registerWithEmail(email: string, password: string): Promise<UserCredential> {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    if (credential.user) {
      await this.userService.syncUserProfile(credential.user);
    }
    return credential;
  }

  // Logout
  async logout(): Promise<void> {
    return signOut(this.auth);
  }

  // Get current user (synchronous check, though observable is preferred)
  get currentUser(): User | null {
    return this.auth.currentUser;
  }
}
