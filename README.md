# StarTalk 🌟

StarTalk is a Calvin University themed forum application built for CS336. It features a "Hupu-style" (sports forum) UI with dark mode, rating systems, and real-time discussions.

## 🚀 Features

-   **Hupu-Style UI:** Custom dark theme with specific layout for comments and ratings.
-   **Rating System:** Visual rating bars and summary statistics for topics.
-   **Real-time Discussions:** Post and comment functionality powered by Firestore.
-   **User Management:** Firebase Authentication integration.
-   **Permissions:**
    -   Authors can delete their own posts.
    -   Commenters can delete their own comments.
-   **CI/CD:** Automated deployment to Firebase Hosting via GitHub Actions.

## 🛠️ Tech Stack

-   **Frontend:** Angular 17 (Standalone Components)
-   **Styling:** SCSS, Angular Material
-   **Backend:** Firebase (Firestore, Auth, Hosting)
-   **CI/CD:** GitHub Actions

## 💻 Getting Started

### Prerequisites

-   Node.js (LTS version recommended)
-   Angular CLI (`npm install -g @angular/cli`)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/Martin0101010101/startalk.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd startalk
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```

### Running Locally

Run the development server:

```bash
ng serve
```

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any source files.

## 🚀 Deployment

This project is configured with **GitHub Actions** for continuous deployment.

-   **Automatic Deployment:** Any push to the `main` branch triggers a build and deploys the application to Firebase Hosting.
-   **Live Site:** [https://startalk-99a78.web.app](https://startalk-99a78.web.app)

## 📁 Project Structure

-   `src/app/components`: UI Components (Comment section, Rating bars, etc.)
-   `firestore.indexes.json`: Firestore index definitions for complex queries.
-   `.github/workflows`: CI/CD configuration files.
