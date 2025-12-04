# StarTalk - Project Design Document

**CS336 Final Project**
**Professor Victor Norman**
**December 2025**

---

## Team Members
- [Your Name(s) Here]

---

## 1. Project Vision (Updated from Proposal)

**StarTalk** is a social discussion forum designed for Calvin University students. It provides a platform where users can share thoughts, rate discussions, and engage with the community through comments and replies. The application features a unique "Calvin Winter" theme with maroon and gold colors, complete with animated snowfall effects to capture the Calvin winter experience.

**Target Audience:** Calvin University students and faculty looking for a modern, engaging discussion platform.

**Key Features:**
- User authentication via Google
- Create, view, and rate discussion posts
- Comment and reply system with nested replies
- User profiles with follow/following functionality
- Trending posts widget (based on view counts)
- Real-time weather widget (Grand Rapids weather)
- "Following" feed to see posts from followed users

---

## 2. Page/View Designs & User Interactions

### 2.1 Home Page (Post List View)
<!-- SCREENSHOT REQUEST: Home page with post list and sidebar -->

**Layout:**
- Navigation bar at top with logo, weather widget, Home button, and Login/Logout
- Main content area with feed toggle ("All Posts" / "Following")
- Search bar and sort dropdown (by date or likes)
- Grid of post cards showing title, author, rating, top comment preview
- Right sidebar with "Trending Posts" widget (top 5 most viewed posts in 7 days)

**User Interactions:**
- Clicking "All Posts" shows all posts from all users
- Clicking "Following" filters to show only posts from users you follow
- Clicking a post card navigates to the Post Detail page
- Clicking the author avatar/name navigates to User Profile page
- Clicking the like button increments the post's like count
- Clicking "New Post" button opens the Add Post dialog
- Typing in search box filters posts by title/content
- Changing sort dropdown reorders posts

### 2.2 Post Detail Page
<!-- SCREENSHOT REQUEST: Post detail page with comments -->

**Layout:**
- Full post content with title, author info, and creation date
- Rating display (converted to 10-point scale)
- Delete button (visible only to post author)
- Rating breakdown chart showing distribution of ratings
- Comment section with sorting options (Newest / Hottest)
- Comment input area with star rating selector
- List of comments with nested replies

**User Interactions:**
- Clicking author avatar/name navigates to User Profile
- Clicking delete button (if owner) prompts confirmation then deletes post
- Clicking sort buttons reorders comments
- Submitting a comment adds it to the discussion (requires rating)
- Clicking reply button on a comment opens reply input
- Clicking like on a comment/reply increments its likes
- Clicking "Show more replies" expands collapsed replies

### 2.3 User Profile Page
<!-- SCREENSHOT REQUEST: User profile page -->

**Layout:**
- Cover image with gradient
- Profile avatar, display name, and join date
- Stats row showing Followers and Following counts
- Bio section with edit button (for profile owner)
- Follow/Unfollow button (for other users)
- Tab section with "Posts" tab showing user's posts

**User Interactions:**
- Clicking edit icon on bio opens inline text editor
- Clicking Save updates bio in database
- Clicking Follow adds current user to this profile's followers
- Clicking Unfollow removes current user from followers
- Clicking on a post card navigates to Post Detail

### 2.4 Add Post Dialog
<!-- SCREENSHOT REQUEST: Add post dialog -->

**Layout:**
- Modal dialog overlay
- Title input field
- Content textarea
- Submit and Cancel buttons

**User Interactions:**
- Typing in fields updates form state
- Clicking Submit creates new post and closes dialog
- Clicking Cancel or outside modal closes without saving

### 2.5 Navigation Bar (App Component)
**Layout:**
- Logo and app name on left
- Weather widget showing current temperature and city
- Home navigation button
- Login/Logout button with user name when logged in
- Animated snowfall effect in background

**User Interactions:**
- Clicking logo or Home navigates to home page
- Clicking Login initiates Google OAuth flow
- Clicking Logout signs out user

---

## 3. Component Architecture

### 3.1 Core Components

| Component | Purpose | Data Maintained | API/Methods |
|-----------|---------|-----------------|-------------|
| **AppComponent** | Root component, handles navigation bar and auth UI | `authService.user$` (current user) | `login()`, `logout()` |
| **PostListComponent** | Main feed view with filtering and sorting | `posts$`, `searchControl`, `sortControl`, `feedTypeControl` | `openAddPostDialog()`, `onScroll()` |
| **PostCardComponent** | Displays a single post preview card | `@Input() post` | `likePost(event)`, `ratingDisplay` getter |
| **PostDetailComponent** | Full post view with comments | `post$` (single post observable) | `canDelete()`, `deletePost()` |
| **CommentSectionComponent** | Manages comments and replies for a post | `comments$`, `ratingStats$`, `sortBy$`, reply state variables | `addComment()`, `likeComment()`, `toggleReply()`, `submitReply()`, `likeReply()`, `deleteComment()` |
| **RatingComponent** | Star rating input/display | `@Input() value`, `@Input() readonly` | `@Output() ratingChange` |
| **UserProfileComponent** | User profile page with posts | `viewState$`, `posts$`, `isFollowing$`, `isOwner$` | `follow()`, `unfollow()`, `saveBio()` |
| **AddPostComponent** | Dialog for creating new posts | Form controls for title/content | `onSubmit()`, `onCancel()` |
| **WeatherWidgetComponent** | Displays current weather | `weather$` (temperature, city) | Fetches from Open-Meteo API |

### 3.2 Services

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| **AuthService** | Firebase Authentication management | `loginWithGoogle()`, `logout()`, `user$` observable |
| **PostService** | CRUD operations for posts | `getPosts()`, `getPost()`, `addPost()`, `updatePost()`, `deletePost()`, `likePost()`, `incrementViews()`, `getTrendingPosts()`, `getPostsByAuthor()`, `getPostsByAuthors()` |
| **CommentService** | CRUD for comments and replies | `getComments()`, `addComment()`, `likeComment()`, `addReply()`, `likeReply()`, `deleteComment()` |
| **UserService** | User profile management | `getUserProfile()`, `syncUserProfile()`, `updateBio()`, `followUser()`, `unfollowUser()` |
| **RatingService** | Rating calculations | `submitRating()` |

---

## 4. NoSQL Database Structure (Firebase Firestore)

### 4.1 Collections Overview

```
firestore-root/
├── posts/
│   └── {postId}/
├── comments/
│   └── {commentId}/
└── users/
    └── {userId}/
```

### 4.2 Collection Schemas

#### `posts` Collection
```typescript
{
  id: string,              // Auto-generated document ID
  title: string,           // Post title
  content: string,         // Post body content
  authorId: string,        // UID of post creator
  authorName: string,      // Display name of author
  authorAvatar: string,    // URL to avatar image
  createdAt: Timestamp,    // Firebase Timestamp
  commentCount: number,    // Number of comments
  likes: number,           // Like count
  rating: number,          // Average rating (0-5 scale)
  ratingCount: number,     // Number of ratings
  views: number,           // View count for trending
  tags: string[],          // Optional tags
  topComment: {            // Cached top comment for preview
    id: string,
    text: string,
    authorName: string,
    likes: number
  }
}
```

#### `comments` Collection
```typescript
{
  id: string,              // Auto-generated document ID
  postId: string,          // Reference to parent post
  authorId: string,        // UID of commenter
  authorName: string,      // Display name
  text: string,            // Comment content
  rating: number,          // 1-5 star rating
  createdAt: Timestamp,    // Firebase Timestamp
  likes: number,           // Like count
  replies: [               // Nested replies array
    {
      authorId: string,
      authorName: string,
      authorAvatar: string,
      text: string,
      createdAt: Timestamp,
      likes: number,
      replyToName: string  // Optional: who they're replying to
    }
  ]
}
```

#### `users` Collection
```typescript
{
  uid: string,             // Firebase Auth UID (document ID)
  email: string,           // User email
  displayName: string,     // Display name
  photoURL: string,        // Profile picture URL
  bio: string,             // User bio (max 150 chars)
  joinDate: Timestamp,     // Account creation date
  followers: string[],     // Array of follower UIDs
  following: string[]      // Array of following UIDs
}
```

### 4.3 Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users: read by anyone, write by owner
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }

    // Posts: read by anyone, create by authenticated,
    // update views/likes by anyone, full update by author
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if
        resource.data.authorId == request.auth.uid ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['views']) ||
        (request.auth != null && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes']));
      allow delete: if resource.data.authorId == request.auth.uid;
    }

    // Comments: read by anyone, write by authenticated
    match /comments/{commentId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 5. Implementation Plan

### Phase 1: Core Infrastructure ✅ (Completed)
1. ~~Project setup with Angular 17+ and Firebase~~
2. ~~Firebase configuration and authentication~~
3. ~~Basic routing structure~~
4. ~~Material Design integration~~
5. ~~Custom "Calvin Winter" theme (maroon/gold/snow)~~

### Phase 2: Post System ✅ (Completed)
1. ~~Post model and service~~
2. ~~PostListComponent with card grid~~
3. ~~PostCardComponent with preview~~
4. ~~PostDetailComponent~~
5. ~~AddPostComponent dialog~~
6. ~~Like functionality~~
7. ~~View counting for trending~~

### Phase 3: Comment & Rating System ✅ (Completed)
1. ~~Comment model and service~~
2. ~~CommentSectionComponent~~
3. ~~Nested reply system~~
4. ~~Star rating input/display~~
5. ~~Rating statistics breakdown~~
6. ~~Comment sorting (newest/hottest)~~

### Phase 4: User System ✅ (Completed)
1. ~~User profile model and service~~
2. ~~UserProfileComponent~~
3. ~~Profile sync on login~~
4. ~~Follow/Unfollow functionality~~
5. ~~Bio editing~~
6. ~~"Following" feed filter~~

### Phase 5: Widgets & Polish ✅ (Completed)
1. ~~Weather widget (Open-Meteo API)~~
2. ~~Trending posts sidebar widget~~
3. ~~Animated snowfall effect~~
4. ~~Responsive design improvements~~

### Phase 6: Final Polish (In Progress)
1. Error handling improvements
2. Loading states and skeletons
3. Mobile responsiveness testing
4. Performance optimization
5. Final styling adjustments

---

## 6. Team Responsibilities

| Team Member | Responsibilities |
|-------------|------------------|
| [Member 1] | Authentication, User Profiles, Follow System |
| [Member 2] | Posts, Comments, Rating System |
| [Member 3 or shared] | UI/UX, Theme, Widgets, Testing |

*(Adjust based on actual team composition)*

---

## 7. Technologies Used

- **Framework:** Angular 17+ (Standalone Components)
- **UI Library:** Angular Material Design
- **Database:** Firebase Firestore (NoSQL)
- **Authentication:** Firebase Auth (Google OAuth)
- **External APIs:** Open-Meteo Weather API
- **Styling:** SCSS with custom theming
- **State Management:** RxJS Observables
- **Hosting:** Firebase Hosting (planned)

---

## 8. CSS Customization Highlights

1. **Calvin Winter Theme:** Custom color palette using CSS variables
   - Primary: Maroon (#8C2131)
   - Accent: Gold (#F3CD00)
   - Background: Dark slate gradient

2. **Animated Snowfall:** Pure CSS animation with multiple snowflake characters

3. **Glassmorphism Effects:** `backdrop-filter: blur()` on cards and containers

4. **Custom Material Overrides:** Themed form fields, buttons, tabs, and dialogs

5. **Responsive Grid Layout:** CSS Grid and Flexbox for adaptive layouts

6. **Interactive Elements:** Hover effects, transitions, and micro-animations

---

## Appendix: Screenshots

*(Add screenshots of each page/view here)*

1. Home Page - Post List View
2. Home Page - Trending Widget
3. Post Detail Page
4. Comment Section with Replies
5. User Profile Page
6. Add Post Dialog
7. Mobile Responsive View

---

*Document Version: 1.0*
*Last Updated: December 3, 2025*
