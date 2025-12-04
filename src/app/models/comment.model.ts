import { Timestamp } from '@angular/fire/firestore';

export interface Reply {
  id?: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Timestamp;
}

export interface Comment {
  id?: string;
  postId: string;
  authorId: string;
  authorName?: string;
  text: string;
  rating: number; // 1-5 star rating
  createdAt: Timestamp;
  likes?: number;
  replies?: Reply[];
}
