import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, deleteDoc, doc, query, where, orderBy, collectionData, updateDoc, arrayUnion, increment, runTransaction, getDoc } from '@angular/fire/firestore';
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
    );
    return collectionData(q, { idField: 'id' }) as Observable<Comment[]>;
  }

  async addComment(comment: Comment): Promise<any> {
    const postRef = doc(this.firestore, 'posts', comment.postId);
    
    return runTransaction(this.firestore, async (transaction) => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists()) {
        throw new Error("Post does not exist!");
      }

      const postData = postDoc.data();
      const currentRating = postData['rating'] || 0;
      const currentRatingCount = postData['ratingCount'] || 0;
      const currentCommentCount = postData['commentCount'] || 0;

      // Calculate new average rating
      const newRatingCount = currentRatingCount + 1;
      const newRating = ((currentRating * currentRatingCount) + comment.rating) / newRatingCount;

      // Add comment
      const newCommentRef = doc(this.commentsCollection);
      transaction.set(newCommentRef, {
        ...comment,
        likes: 0,
        replies: []
      });

      // Update post stats
      transaction.update(postRef, {
        rating: newRating,
        ratingCount: newRatingCount,
        commentCount: currentCommentCount + 1
      });
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

  async addReply(commentId: string, reply: Reply, postId: string): Promise<void> {
    const commentRef = doc(this.firestore, 'comments', commentId);
    const postRef = doc(this.firestore, 'posts', postId);

    return runTransaction(this.firestore, async (transaction) => {
      // Update comment with new reply
      transaction.update(commentRef, {
        replies: arrayUnion(reply)
      });

      // Update post comment count
      transaction.update(postRef, {
        commentCount: increment(1)
      });
    });
  }

  // Note: Updating a specific object in an array in Firestore is tricky without reading the whole array.
  // For simplicity in this demo, we might not implement 'likeReply' perfectly atomically for the array item 
  // without fetching the whole comment.
  async likeReply(commentId: string, reply: Reply): Promise<void> {
    const commentRef = doc(this.firestore, 'comments', commentId);
    const commentSnap = await getDoc(commentRef);
    
    if (commentSnap.exists()) {
      const data = commentSnap.data() as Comment;
      const replies = data.replies || [];
      // Find the reply (assuming strict object equality might fail, we need a unique way to identify. 
      // Since we don't have IDs, we match by timestamp and author)
      const replyIndex = replies.findIndex(r => 
        r.createdAt.seconds === reply.createdAt.seconds && 
        r.authorId === reply.authorId &&
        r.text === reply.text
      );

      if (replyIndex > -1) {
        replies[replyIndex].likes = (replies[replyIndex].likes || 0) + 1;
        await updateDoc(commentRef, { replies });
      }
    }
  }
}
