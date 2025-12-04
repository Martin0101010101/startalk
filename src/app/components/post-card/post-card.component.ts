import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Post } from '../../models/post.model';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatTooltipModule],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss']
})
export class PostCardComponent {
  @Input() post!: Post;
  private postService = inject(PostService);

  async likePost(event: Event) {
    event.stopPropagation();
    if (this.post.id) {
      try {
        await this.postService.likePost(this.post.id, this.post.likes || 0);
      } catch (error) {
        console.error('Failed to like post:', error);
        // Optional: Show a snackbar or alert
      }
    }
  }

  get ratingDisplay(): number {
    // Convert 0-5 rating to 0-10 scale
    return this.post.rating ? Math.round(this.post.rating * 2 * 10) / 10 : 0;
  }
}
