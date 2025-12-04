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

      const updates: any = {
        rating: newRating,
        ratingCount: newRatingCount,
        commentCount: currentCommentCount + 1
      };

      // If this is the first comment or it has a high rating (logic can vary), 
      // we might want to set it as top comment initially, but usually top comment is based on likes.
      // However, if there are no comments, this is the best one.
      if (currentCommentCount === 0) {
        updates['topComment'] = {
          id: newCommentRef.id,
          text: comment.text,
          authorName: comment.authorName,
          likes: 0
        };
      }

      // Update post stats
      transaction.update(postRef, updates);
    });
  }

  deleteComment(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'comments', id);
    return deleteDoc(docRef);
  }

  async likeComment(commentId: string): Promise<void> {
    const commentRef = doc(this.firestore, 'comments', commentId);

    return runTransaction(this.firestore, async (transaction) => {
      const commentDoc = await transaction.get(commentRef);
      if (!commentDoc.exists()) {
        throw new Error("Comment does not exist!");
      }

      const commentData = commentDoc.data() as Comment;
      const newLikes = (commentData.likes || 0) + 1;
      const postId = commentData.postId;

      // Update comment likes
      transaction.update(commentRef, { likes: newLikes });

      // Check if we need to update the post's topComment
      const postRef = doc(this.firestore, 'posts', postId);
      const postDoc = await transaction.get(postRef);
      
      if (postDoc.exists()) {
        const postData = postDoc.data();
        const currentTopComment = postData['topComment'];

        // Update if no top comment exists, or if this comment has more likes than the current top comment
        // Or if this IS the top comment (to update its like count)
        if (!currentTopComment || newLikes > currentTopComment.likes || currentTopComment.id === commentId) {
          transaction.update(postRef, {
            topComment: {
              id: commentId,
              text: commentData.text,
              authorName: commentData.authorName,
              likes: newLikes
            }
          });
        }
      }
    });
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
