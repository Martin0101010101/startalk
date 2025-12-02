import { Timestamp } from '@angular/fire/firestore';

export interface Post {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  authorName?: string;
  createdAt: Timestamp;
  commentCount: number;
}
