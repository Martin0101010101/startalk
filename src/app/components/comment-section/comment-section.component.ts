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
import { Observable, map } from 'rxjs';
import { Comment } from '../../models/comment.model';
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
  newCommentText = '';
  selectedRating = 0;
  hoverRating = 0;

  ngOnInit() {
    this.comments$ = this.commentService.getComments(this.postId);
    this.ratingStats$ = this.comments$.pipe(
      map(comments => this.calculateRatingStats(comments))
    );
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

    return {
      average: Math.round((sum / total) * 10) / 10,
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
      createdAt: Timestamp.now()
    };

    await this.commentService.addComment(comment);
    this.newCommentText = '';
    this.selectedRating = 0;
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
