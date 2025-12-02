import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, query, where, collectionData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

export interface Rating {
  postId: string;
  userId: string;
  stars: number;
}

@Injectable({
  providedIn: 'root'
})
export class RatingService {
  private firestore: Firestore = inject(Firestore);
  private ratingsCollection = collection(this.firestore, 'ratings');

  constructor() {}

  getUserRating(postId: string, userId: string): Observable<number> {
    const q = query(
      this.ratingsCollection,
      where('postId', '==', postId),
      where('userId', '==', userId)
    );
    return collectionData(q).pipe(
      map(ratings => ratings.length ? (ratings[0] as Rating).stars : 0)
    );
  }

  async setRating(postId: string, userId: string, stars: number): Promise<void> {
    const ratingId = `${postId}_${userId}`;
    const ratingRef = doc(this.firestore, 'ratings', ratingId);
    const rating: Rating = { postId, userId, stars };
    return setDoc(ratingRef, rating);
  }

  // Optional: Get average rating
  getAverageRating(postId: string): Observable<number> {
     const q = query(this.ratingsCollection, where('postId', '==', postId));
     return collectionData(q).pipe(
       map(ratings => {
         if (!ratings.length) return 0;
         const sum = ratings.reduce((acc, curr) => acc + (curr as Rating).stars, 0);
         return sum / ratings.length;
       })
     );
  }
}
