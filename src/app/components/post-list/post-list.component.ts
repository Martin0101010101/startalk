import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, switchMap, BehaviorSubject, combineLatest, map, startWith, of, Observable } from 'rxjs';

import { PostService } from '../../services/post.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Post } from '../../models/post.model';
import { PostCardComponent } from '../post-card/post-card.component';
import { AddPostComponent } from '../add-post/add-post.component';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    PostCardComponent
  ],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.scss']
})
export class PostListComponent implements OnInit {
  private postService = inject(PostService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  // Controls
  searchControl = new FormControl('');
  sortControl = new FormControl<'createdAt' | 'likes'>('createdAt');
  feedTypeControl = new FormControl<'all' | 'following'>('all');

  // Data Streams
  posts$ = combineLatest([
    this.feedTypeControl.valueChanges.pipe(startWith('all')),
    this.searchControl.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()),
    this.sortControl.valueChanges.pipe(startWith('createdAt')),
    this.authService.user$
  ]).pipe(
    switchMap(([feedType, searchTerm, sortBy, user]) => {
      let postsObservable: Observable<Post[]>;

      if (feedType === 'following' && user) {
        // Fetch user profile to get following list
        return this.userService.getUserProfile(user.uid).pipe(
          switchMap(profile => {
            if (!profile || !profile.following || profile.following.length === 0) {
              return of([]);
            }
            return this.postService.getPostsByAuthors(profile.following);
          }),
          map(posts => ({ posts, searchTerm, sortBy }))
        );
      } else {
        return this.postService.getPosts().pipe(
          map(posts => ({ posts, searchTerm, sortBy }))
        );
      }
    }),
    map(({ posts, searchTerm, sortBy }) => {
      // Client-side filtering and sorting
      let filtered = posts;

      if (searchTerm) {
        const term = searchTerm!.toLowerCase();
        filtered = posts.filter(p =>
          p.title.toLowerCase().includes(term) ||
          p.content.toLowerCase().includes(term)
        );
      }

      return filtered.sort((a, b) => {
        const valA = sortBy === 'likes' ? (a.likes || 0) : (a.createdAt?.seconds || 0);
        const valB = sortBy === 'likes' ? (b.likes || 0) : (b.createdAt?.seconds || 0);
        return valB - valA;
      });
    })
  );

  trendingPosts$ = this.postService.getTrendingPosts(5);

  ngOnInit(): void {}
  openAddPostDialog() {
    const dialogRef = this.dialog.open(AddPostComponent, {
      width: '600px',
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Post added logic if needed
      }
    });
  }

  onScroll() {
    // Placeholder for infinite scroll logic
    // In a real implementation, check scroll position and load more data
  }
}
