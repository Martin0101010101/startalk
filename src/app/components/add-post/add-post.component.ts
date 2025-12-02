import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { Post } from '../../models/post.model';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-add-post',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './add-post.component.html',
  styleUrl: './add-post.component.scss'
})
export class AddPostComponent {
  private postService = inject(PostService);
  private authService = inject(AuthService);
  private router = inject(Router);

  title = '';
  content = '';

  async onSubmit() {
    const user = this.authService.currentUser;
    if (!user) {
      alert('You must be logged in to create a post.');
      return;
    }

    if (!this.title.trim() || !this.content.trim()) return;

    const newPost: Post = {
      title: this.title,
      content: this.content,
      authorId: user.uid,
      authorName: user.displayName || user.email || 'Anonymous',
      createdAt: Timestamp.now(),
      commentCount: 0
    };

    try {
      await this.postService.addPost(newPost);
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error adding post:', error);
      alert('Failed to create post.');
    }
  }
}
