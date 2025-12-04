import { Timestamp } from '@angular/fire/firestore';

export interface Post {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string; // URL to avatar image
  createdAt: Timestamp;
  commentCount: number;
  likes: number;
  rating: number; // 0-5 stars
  ratingCount: number; // Number of people who rated
  views?: number; // Number of times the post has been viewed
  tags?: string[];
  topComment?: {
    id: string;
    text: string;
    authorName: string;
    likes: number;
  };
}
