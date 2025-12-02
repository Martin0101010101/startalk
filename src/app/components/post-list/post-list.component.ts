import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService } from '../../services/post.service';
import { PostCardComponent } from '../post-card/post-card.component';
import { Observable, catchError, of } from 'rxjs';
import { Post } from '../../models/post.model';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, PostCardComponent],
  templateUrl: './post-list.component.html',
  styleUrl: './post-list.component.scss'
})
export class PostListComponent {
  private postService = inject(PostService);
  posts$: Observable<Post[]> = this.postService.getPosts().pipe(
    catchError(err => {
      console.error('Error loading posts:', err);
      return of([]);
    })
  );
}
