import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, deleteDoc, Timestamp, query, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Post } from '../models/post.model';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private firestore: Firestore = inject(Firestore);
  private postsCollection = collection(this.firestore, 'posts');

  constructor() {}

  getPosts(): Observable<Post[]> {
    const q = query(this.postsCollection, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Post[]>;
  }

  getPost(id: string): Observable<Post> {
    const docRef = doc(this.firestore, 'posts', id);
    return docData(docRef, { idField: 'id' }) as Observable<Post>;
  }

  addPost(post: Post): Promise<any> {
    return addDoc(this.postsCollection, post);
  }

  deletePost(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'posts', id);
    return deleteDoc(docRef);
  }
}
