import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc, Timestamp } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { UserProfile } from '../models/user.model';
import { User } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore: Firestore = inject(Firestore);

  constructor() {}

  // Get user profile by ID
  getUserProfile(uid: string): Observable<UserProfile | undefined> {
    const docRef = doc(this.firestore, 'users', uid);
    return docData(docRef) as Observable<UserProfile | undefined>;
  }

  // Create or update user profile after login
  async syncUserProfile(user: User): Promise<void> {
    const docRef = doc(this.firestore, 'users', user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Create new profile
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        bio: 'Hello, I am new here!',
        joinDate: Timestamp.now(),
        followers: [],
        following: []
      };
      await setDoc(docRef, newProfile);
    } else {
      // Update existing profile (e.g. if photo changed)
      // Only update fields that might change from Auth provider
      await updateDoc(docRef, {
        displayName: user.displayName || docSnap.data()['displayName'],
        photoURL: user.photoURL || docSnap.data()['photoURL'],
        email: user.email
      });
    }
  }

  // Update bio
  async updateBio(uid: string, bio: string): Promise<void> {
    const docRef = doc(this.firestore, 'users', uid);
    return updateDoc(docRef, { bio });
  }

  // Follow a user
  async followUser(currentUserId: string, targetUserId: string): Promise<void> {
    const currentUserRef = doc(this.firestore, 'users', currentUserId);
    const targetUserRef = doc(this.firestore, 'users', targetUserId);

    // Add target to current user's following
    await updateDoc(currentUserRef, {
      following: arrayUnion(targetUserId)
    });

    // Add current user to target's followers
    await updateDoc(targetUserRef, {
      followers: arrayUnion(currentUserId)
    });
  }

  // Unfollow a user
  async unfollowUser(currentUserId: string, targetUserId: string): Promise<void> {
    const currentUserRef = doc(this.firestore, 'users', currentUserId);
    const targetUserRef = doc(this.firestore, 'users', targetUserId);

    // Remove target from current user's following
    await updateDoc(currentUserRef, {
      following: arrayRemove(targetUserId)
    });

    // Remove current user from target's followers
    await updateDoc(targetUserRef, {
      followers: arrayRemove(currentUserId)
    });
  }
}
