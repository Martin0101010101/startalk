import { Timestamp } from '@angular/fire/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  joinDate: Timestamp;
  followers: string[]; // Array of user IDs
  following: string[]; // Array of user IDs
}
