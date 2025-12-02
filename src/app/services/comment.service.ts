import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, deleteDoc, doc, query, where, orderBy, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Comment } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private firestore: Firestore = inject(Firestore);
  private commentsCollection = collection(this.firestore, 'comments');

  constructor() {}

  getComments(postId: string): Observable<Comment[]> {
    const q = query(
      this.commentsCollection,
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Comment[]>;
  }

  addComment(comment: Comment): Promise<any> {
    return addDoc(this.commentsCollection, comment);
  }

  deleteComment(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'comments', id);
    return deleteDoc(docRef);
  }
}
