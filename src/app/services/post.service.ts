import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, deleteDoc, updateDoc, Timestamp, query, orderBy, limit, startAfter, where, DocumentData, Query } from '@angular/fire/firestore';
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
}
