import { Routes } from '@angular/router';
import { PostListComponent } from './components/post-list/post-list.component';
import { PostDetailComponent } from './components/post-detail/post-detail.component';
import { AddPostComponent } from './components/add-post/add-post.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';

export const routes: Routes = [
  { path: '', component: PostListComponent },
  { path: 'posts/:id', component: PostDetailComponent },
  { path: 'users/:id', component: UserProfileComponent },
  { path: 'add-post', component: AddPostComponent },
  { path: '**', redirectTo: '' }
];

