import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, deleteDoc, updateDoc, Timestamp, query, orderBy, limit, startAfter, where, DocumentData, Query, increment } from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { Post } from '../models/post.model';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private firestore: Firestore = inject(Firestore);
  private postsCollection = collection(this.firestore, 'posts');

  constructor() {}

  // Get posts with optional sorting and limit
  getPosts(sortBy: 'createdAt' | 'likes' = 'createdAt', limitCount: number = 10): Observable<Post[]> {
    const q = query(
      this.postsCollection,
      orderBy(sortBy, 'desc'),
      limit(limitCount)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Post[]>;
  }

  // Get trending posts (most views in last 7 days)
  getTrendingPosts(limitCount: number = 5): Observable<Post[]> {
    // Strategy: Fetch recent posts (last 50), then sort by views client-side.
    // This avoids complex Firestore index requirements and limitations.
    const q = query(
      this.postsCollection,
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return (collectionData(q, { idField: 'id' }) as Observable<Post[]>).pipe(
      map(posts => {
        // 1. Filter for posts from last 7 days (double check)
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentPosts = posts.filter(p => p.createdAt?.toMillis() >= sevenDaysAgo);

        // 2. Sort by views (descending)
        return recentPosts.sort((a, b) => (b.views || 0) - (a.views || 0))
          // 3. Take top N
          .slice(0, limitCount);
      })
    );
  }

  // Get a single post
  getPost(id: string): Observable<Post> {
    const docRef = doc(this.firestore, 'posts', id);
    return docData(docRef, { idField: 'id' }) as Observable<Post>;
  }

  // Add a new post
  addPost(post: Partial<Post>): Promise<any> {
    const newPost = {
      ...post,
      createdAt: Timestamp.now(),
      likes: 0,
      commentCount: 0,
      rating: post.rating || 0,
      ratingCount: post.ratingCount || 0,
      views: 0,
      authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName || 'User'}` // Random avatar
    };
    return addDoc(this.postsCollection, newPost);
  }

  // Update a post
  updatePost(id: string, data: Partial<Post>): Promise<void> {
    const docRef = doc(this.firestore, 'posts', id);
    return updateDoc(docRef, data);
  }

  // Delete a post
  deletePost(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'posts', id);
    return deleteDoc(docRef);
  }

  // Like a post
  async likePost(id: string, currentLikes: number): Promise<void> {
    const docRef = doc(this.firestore, 'posts', id);
    return updateDoc(docRef, { likes: currentLikes + 1 });
  }

  // Increment view count
  async incrementViews(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'posts', id);
    return updateDoc(docRef, { views: increment(1) });
  }
}

