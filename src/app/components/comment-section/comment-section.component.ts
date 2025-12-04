import { Component, Input, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommentService } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';
import { Observable, map, BehaviorSubject, combineLatest } from 'rxjs';
import { Comment, Reply } from '../../models/comment.model';
import { Post } from '../../models/post.model';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-comment-section',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatDividerModule, MatProgressBarModule],
  templateUrl: './comment-section.component.html',
  styleUrl: './comment-section.component.scss'
})
export class CommentSectionComponent implements OnInit, OnChanges {
  @Input() postId!: string;
  @Input() post?: Post;

  private commentService = inject(CommentService);
  private authService = inject(AuthService);

  comments$!: Observable<Comment[]>;
  ratingStats$!: Observable<RatingStats>;

  // Sorting
  sortBy$ = new BehaviorSubject<'newest' | 'hottest'>('newest');
  post$ = new BehaviorSubject<Post | undefined>(undefined);

  newCommentText = '';
  selectedRating = 0;
  hoverRating = 0;

  // Reply state
  replyingToCommentId: string | null = null;
  replyingToUserName: string | null = null;
  replyText = '';
  expandedComments = new Set<string>(); // Set of comment IDs where replies are expanded

  ngOnChanges(changes: SimpleChanges) {
    if (changes['post']) {
      this.post$.next(changes['post'].currentValue);
    }
  }

  ngOnInit() {
    const rawComments$ = this.commentService.getComments(this.postId);

    this.comments$ = combineLatest([rawComments$, this.sortBy$]).pipe(
      map(([comments, sortBy]) => {
        // Sort replies for each comment (most likes first)
        comments.forEach(c => {
          if (c.replies) {
            c.replies.sort((r1, r2) => (r2.likes || 0) - (r1.likes || 0));
          }
        });

        return comments.sort((a, b) => {
          if (sortBy === 'hottest') {
            return (b.likes || 0) - (a.likes || 0);
          } else {
            // Newest first
            return b.createdAt.seconds - a.createdAt.seconds;
          }
        });
      })
    );

    this.ratingStats$ = combineLatest([rawComments$, this.post$]).pipe(
      map(([comments, post]) => this.calculateRatingStats(comments, post))
    );
  }

  setSort(sort: 'newest' | 'hottest') {
    this.sortBy$.next(sort);
  }

  calculateRatingStats(comments: Comment[], post?: Post): RatingStats {
    let total = comments.length;
    const distribution = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1 stars
    let sum = 0;

    comments.forEach(c => {
      sum += c.rating;
      if (c.rating >= 1 && c.rating <= 5) {
        distribution[5 - c.rating]++;
      }
    });

    // Reconcile with Post data if available (to include author's rating)
    if (post) {
      const postTotal = post.ratingCount || 0;
      const postRating = post.rating || 0;

      // If post has more ratings than comments, assume the difference is the author's rating(s)
      if (postTotal > total) {
        const missingCount = postTotal - total;
        const currentSum = sum;
        const targetSum = postRating * postTotal;
        const missingSum = targetSum - currentSum;

        // If we're missing exactly 1 rating (likely the author's), we can infer it
        if (missingCount === 1) {
          const inferredRating = Math.round(missingSum);
          if (inferredRating >= 1 && inferredRating <= 5) {
            distribution[5 - inferredRating]++;
            sum += inferredRating;
            total++;
          }
        } else if (missingCount > 0) {
          // If multiple missing, we can't infer distribution perfectly.
          // We'll just use the post's total and average for the summary numbers,
          // but the distribution bars might be slightly off (normalized to what we have).
          // Or we could distribute the missing count proportionally?
          // Let's just trust the post's total count for the "Total Reviews" display.
          total = postTotal;
        }
      }
    }

    // Calculate average on 10-point scale
    let average10 = 0;
    if (post && post.ratingCount > 0) {
      // Trust the post's stored average as the source of truth
      average10 = Math.round(post.rating * 2 * 10) / 10;
    } else if (total > 0) {
      const average5 = sum / total;
      average10 = Math.round(average5 * 2 * 10) / 10;
    }

    // Normalize distribution percentages
    // If we used postTotal but didn't add to distribution array, the sum of distribution won't match total.
    // We should calculate percentages based on the sum of distribution counts to be visually correct for the bars we show.
    const distributionTotal = distribution.reduce((a, b) => a + b, 0);

    return {
      average: average10,
      total: post ? (post.ratingCount || 0) : total,
      distribution: distribution.map(count => distributionTotal > 0 ? (count / distributionTotal) * 100 : 0)
    };
  }

  async addComment() {
    const user = this.authService.currentUser;
    if (!user) {
      alert('Please login to comment!');
      return;
    }
    if (!this.newCommentText.trim()) return;
    if (this.selectedRating === 0) {
      alert('Please select a rating!');
      return;
    }

    const comment: Comment = {
      postId: this.postId,
      authorId: user.uid,
      authorName: user.displayName || user.email || 'Anonymous',
      text: this.newCommentText,
      rating: this.selectedRating,
      createdAt: Timestamp.now(),
      likes: 0,
      replies: []
    };

    await this.commentService.addComment(comment);
    this.newCommentText = '';
    this.selectedRating = 0;
  }

  async likeComment(comment: Comment) {
    if (comment.id) {
      await this.commentService.likeComment(comment.id);
    }
  }

  toggleReply(commentId: string) {
    if (this.replyingToCommentId === commentId && !this.replyingToUserName) {
      this.replyingToCommentId = null;
    } else {
      this.replyingToCommentId = commentId;
      this.replyingToUserName = null; // Reset specific user reply
      this.replyText = '';
    }
  }

  initiateReplyToUser(commentId: string, userName: string) {
    this.replyingToCommentId = commentId;
    this.replyingToUserName = userName;
    this.replyText = '';
  }

  async submitReply(commentId: string) {
    const user = this.authService.currentUser;
    if (!user) {
      alert('Please login to reply!');
      return;
    }
    if (!this.replyText.trim()) return;

    const reply: Reply = {
      authorId: user.uid,
      authorName: user.displayName || user.email || 'Anonymous',
      authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName || 'User'}`,
      text: this.replyText,
      createdAt: Timestamp.now(),
      likes: 0
    };

    if (this.replyingToUserName) {
      reply.replyToName = this.replyingToUserName;
    }

    try {
      await this.commentService.addReply(commentId, reply, this.postId);
      this.replyingToCommentId = null;
      this.replyingToUserName = null;
      this.replyText = '';
      // Auto expand to show the new reply
      this.expandedComments.add(commentId);
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to post reply. Please try again.');
    }
  }

  async likeReply(commentId: string, reply: Reply) {
    await this.commentService.likeReply(commentId, reply);
  }

  toggleExpandReplies(commentId: string) {
    if (this.expandedComments.has(commentId)) {
      this.expandedComments.delete(commentId);
    } else {
      this.expandedComments.add(commentId);
    }
  }

  isExpanded(commentId: string): boolean {
    return this.expandedComments.has(commentId);
  }

  getVisibleReplies(comment: Comment): Reply[] {
    if (!comment.replies || comment.replies.length === 0) return [];
    if (this.isExpanded(comment.id!)) {
      return comment.replies;
    }
    // Return only the first one (which is sorted by likes)
    return [comment.replies[0]];
  }

  setRating(rating: number) {
    this.selectedRating = rating;
  }

  setHover(rating: number) {
    this.hoverRating = rating;
  }

  getStarIcon(index: number): string {
    const rating = this.hoverRating || this.selectedRating;
    return index <= rating ? 'star' : 'star_border';
  }

  getDisplayStars(rating: number): number[] {
    return [1, 2, 3, 4, 5].map(i => i <= rating ? 1 : 0);
  }

  canDeleteComment(comment: Comment): boolean {
    const user = this.authService.currentUser;
    return user !== null && user.uid === comment.authorId;
  }

  async deleteComment(comment: Comment) {
    if (!this.canDeleteComment(comment)) {
      alert('You do not have permission to delete this comment!');
      return;
    }

    if (confirm('Are you sure you want to delete this comment?')) {
      try {
        await this.commentService.deleteComment(comment.id!);
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Delete failed. Please try again.');
      }
    }
  }
}

interface RatingStats {
  average: number;
  total: number;
  distribution: number[]; // percentages for 5,4,3,2,1 stars
}
