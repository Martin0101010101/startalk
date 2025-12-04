import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, deleteDoc, doc, query, where, orderBy, collectionData, updateDoc, arrayUnion, increment } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Comment, Reply } from '../models/comment.model';

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
      where('postId', '==', postId)
      // Sorting will be done client-side to support dynamic switching without multiple indexes
    );
    return collectionData(q, { idField: 'id' }) as Observable<Comment[]>;
  }

  addComment(comment: Comment): Promise<any> {
    return addDoc(this.commentsCollection, {
      ...comment,
      likes: 0,
      replies: []
    });
  }

  deleteComment(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'comments', id);
    return deleteDoc(docRef);
  }

  likeComment(commentId: string): Promise<void> {
    const docRef = doc(this.firestore, 'comments', commentId);
    return updateDoc(docRef, { likes: increment(1) });
  }

  addReply(commentId: string, reply: Reply): Promise<void> {
    const docRef = doc(this.firestore, 'comments', commentId);
    return updateDoc(docRef, {
      replies: arrayUnion(reply)
    });
  }
}
