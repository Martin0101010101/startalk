import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RatingService } from '../../services/rating.service';
import { AuthService } from '../../services/auth.service';
import { Observable, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './rating.component.html',
  styleUrl: './rating.component.scss'
})
export class RatingComponent implements OnInit {
  @Input() postId!: string;

  private ratingService = inject(RatingService);
  private authService = inject(AuthService);

  userRating$: Observable<number> = of(0);
  averageRating$: Observable<number> = of(0);
  stars = [1, 2, 3, 4, 5];
  hoveredStar: number | null = null;

  ngOnInit() {
    this.averageRating$ = this.ratingService.getAverageRating(this.postId);

    this.userRating$ = this.authService.user$.pipe(
      switchMap(user => {
        if (user) {
          return this.ratingService.getUserRating(this.postId, user.uid);
        }
        return of(0);
      })
    );
  }

  async onRate(star: number) {
    const user = this.authService.currentUser;
    if (!user) {
      alert('Please login to rate!');
      return;
    }
    await this.ratingService.setRating(this.postId, user.uid, star);
  }
}
