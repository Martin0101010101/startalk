import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { Observable, switchMap, tap } from 'rxjs';
import { Post } from '../../models/post.model';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { RatingComponent } from '../rating/rating.component';
import { CommentSectionComponent } from '../comment-section/comment-section.component';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, RatingComponent, CommentSectionComponent],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss'
})
export class PostDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postService = inject(PostService);
  authService = inject(AuthService);

  post$!: Observable<Post>;

  ngOnInit() {
    this.post$ = this.route.paramMap.pipe(
      tap(params => {
        const id = params.get('id');
        if (id) {
          this.postService.incrementViews(id);
        }
      }),
      switchMap(params => {
        const id = params.get('id');
        return this.postService.getPost(id!);
      })
    );
  }

  canDelete(post: Post): boolean {
    const user = this.authService.currentUser;
    return user !== null && user.uid === post.authorId;
  }

  async deletePost(post: Post) {
    if (!this.canDelete(post)) {
      alert('You do not have permission to delete this post!');
      return;
    }

    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await this.postService.deletePost(post.id!);
        alert('Post deleted successfully');
        this.router.navigate(['/']);
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Delete failed. Please try again.');
      }
    }
  }
}
