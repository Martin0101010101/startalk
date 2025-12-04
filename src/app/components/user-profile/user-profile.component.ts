import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/user.model';
import { Post } from '../../models/post.model';
import { Observable, switchMap, map, combineLatest, of, startWith, shareReplay } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PostCardComponent } from '../post-card/post-card.component';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    PostCardComponent,
    FormsModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private postService = inject(PostService);
  public authService = inject(AuthService);

  viewState$: Observable<{ loading: boolean; profile?: UserProfile }> | undefined;
  posts$: Observable<Post[]> | undefined;
  isFollowing$: Observable<boolean> | undefined;
  isOwner$: Observable<boolean> | undefined;

  editingBio = false;
  newBio = '';

  ngOnInit() {
    const userId$ = this.route.paramMap.pipe(map(params => params.get('id')!));

    this.viewState$ = userId$.pipe(
      switchMap(id => this.userService.getUserProfile(id).pipe(
        map(profile => ({ loading: false, profile })),
        startWith({ loading: true, profile: undefined })
      )),
      shareReplay(1)
    );

    this.posts$ = userId$.pipe(
      switchMap(id => this.postService.getPostsByAuthor(id))
    );

    this.isOwner$ = combineLatest([this.authService.user$, userId$]).pipe(
      map(([currentUser, profileId]) => currentUser?.uid === profileId)
    );

    this.isFollowing$ = combineLatest([this.authService.user$, this.viewState$]).pipe(
      map(([currentUser, state]) => {
        if (!currentUser || !state.profile) return false;
        return state.profile.followers?.includes(currentUser.uid) || false;
      })
    );
  }

  async toggleFollow(profileId: string) {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return;

    // Optimistic update or just wait for observable?
    // Let's wait for simplicity, but we need to know current state.
    // We can subscribe once or just use the service.

    // Check current state from the observable value (a bit hacky without signal, but ok)
    // Better: check if we are in the followers list of the profile we just fetched.
    // Actually, let's just use the service to check? No, service doesn't hold state.

    // We'll just implement it based on the button state in the UI which reflects isFollowing$
    // But we need to know if we are following to call the right method.
    // Let's pass the current state from the template.
  }

  async follow(profileId: string) {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return;
    await this.userService.followUser(currentUser.uid, profileId);
  }

  async unfollow(profileId: string) {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return;
    await this.userService.unfollowUser(currentUser.uid, profileId);
  }

  startEditBio(currentBio: string) {
    this.newBio = currentBio;
    this.editingBio = true;
  }

  async saveBio(uid: string) {
    await this.userService.updateBio(uid, this.newBio);
    this.editingBio = false;
  }

  cancelEdit() {
    this.editingBio = false;
  }
}
