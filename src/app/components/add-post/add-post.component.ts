import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { Post } from '../../models/post.model';

@Component({
  selector: 'app-add-post',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatDialogModule,
    MatIconModule,
    MatSliderModule
  ],
  templateUrl: './add-post.component.html',
  styleUrls: ['./add-post.component.scss']
})
export class AddPostComponent {
  private fb = inject(FormBuilder);
  private postService = inject(PostService);
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<AddPostComponent>);

  postForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    content: ['', [Validators.required, Validators.minLength(10)]],
    rating: [0, [Validators.min(1), Validators.max(5)]]
  });

  isSubmitting = false;

  async onSubmit() {
    if (this.postForm.invalid) return;

    this.isSubmitting = true;
    const user = this.authService.currentUser;
    const formValue = this.postForm.value;

    const newPost: Partial<Post> = {
      title: formValue.title!,
      content: formValue.content!,
      authorId: user?.uid || 'anonymous',
      authorName: user?.displayName || 'Anonymous User',
      rating: formValue.rating || 0,
      ratingCount: formValue.rating ? 1 : 0
    };

    try {
      await this.postService.addPost(newPost);
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error adding post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  formatLabel(value: number): string {
    return `${value}`;
  }
}
