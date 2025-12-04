import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-comment-section',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatDividerModule, MatProgressBarModule],
  templateUrl: './comment-section.component.html',
  styleUrl: './comment-section.component.scss'
})
export class CommentSectionComponent implements OnInit {
  @Input() postId!: string;

  private commentService = inject(CommentService);
  private authService = inject(AuthService);

  comments$!: Observable<Comment[]>;
  ratingStats$!: Observable<RatingStats>;
  
  // Sorting
  sortBy$ = new BehaviorSubject<'newest' | 'hottest'>('newest');

  newCommentText = '';
  selectedRating = 0;
  hoverRating = 0;

  // Reply state
  replyingToCommentId: string | null = null;
  replyText = '';
  expandedComments = new Set<string>(); // Set of comment IDs where replies are expanded

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

    this.ratingStats$ = rawComments$.pipe(
      map(comments => this.calculateRatingStats(comments))
    );
  }

  setSort(sort: 'newest' | 'hottest') {
    this.sortBy$.next(sort);
  }

  calculateRatingStats(comments: Comment[]): RatingStats {
    const total = comments.length;
    if (total === 0) {
      return { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] };
    }

    const distribution = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1 stars
    let sum = 0;

    comments.forEach(c => {
      sum += c.rating;
      distribution[5 - c.rating]++;
    });

    // Calculate average on 10-point scale (1 star = 2 points)
    // Original average (1-5) * 2
    const average5 = sum / total;
    const average10 = Math.round(average5 * 2 * 10) / 10;

    return {
      average: average10,
      total,
      distribution: distribution.map(count => (count / total) * 100)
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
    if (this.replyingToCommentId === commentId) {
      this.replyingToCommentId = null;
    } else {
      this.replyingToCommentId = commentId;
      this.replyText = '';
    }
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

    await this.commentService.addReply(commentId, reply, this.postId);
    this.replyingToCommentId = null;
    this.replyText = '';
    // Auto expand to show the new reply
    this.expandedComments.add(commentId);
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
      alert('你没有权限删除这条评论！');
      return;
    }

    if (confirm('确定要删除这条评论吗？')) {
      try {
        await this.commentService.deleteComment(comment.id!);
      } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请重试');
      }
    }
  }
}

interface RatingStats {
  average: number;
  total: number;
  distribution: number[]; // percentages for 5,4,3,2,1 stars
}
