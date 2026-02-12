# Laboratory Log Management System (NEU)

Real-time web application for managing laboratory usage, tracking professor attendance, and securing lab access via QR codes. Built for New Era University.

![Admin Dashboard](screenshots/admin_dashboard.webp)
*(Add screenshot of Admin Dashboard here)*

## Features

###For Administrators
*   **Real-time Dashboard**: View active lab sessions, total usage, and room occupancy at a glance.
*   **User Management**: Approve/Block professors and manage their access.
*   **Usage Logs**: Comprehensive history of all lab entries and exits, exportable and searchable.
*   **QR Code Management**: Automatically generate and download unique QR codes for each laboratory room.
*   **Security**: Role-based access control (RBAC) powered by Firebase Security Rules.

### For Professors
*   **QR Check-In**: Simply scan the lab's QR code to check in.
*   **One-Tap Check-Out**: End your session with a single click.
*   **Session History**: View your past laboratory usage logs.
*   **Mobile Optimized**: Works perfectly on mobile devices for easy scanning.

## 🛠 Tech Stack

*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/)
*   **Backend**: Firebase (Auth, Firestore)
*   **Authentication**: Google Workspace (Limited to `@neu.edu.ph`)
*   **Deployment**: Vercel

## 📸 Screenshots

| Login Page | Professor Check-In |
|:---:|:---:|
| ![Login](screenshots/login_page.webp) | ![Check-In](screenshots/professor_checkin_page.webp) |
| *Secure Login with Domain Restriction* | *Mobile-first QR Scanner* |

| Usage Logs | User Management |
|:---:|:---:|
| ![Logs](screenshots/usage_logs_page.webp) | ![Users](screenshots/faculty_management_page.webp) |
| *Detailed session tracking* | *Manage faculty status* |

---

## ⚙️ Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/johnraivenolazo/laboratory-log-management.git
cd laboratory-log-management
```

### 2. Install Dependencies
```bash
pnpm install
# or
npm install
```

### 3. Firebase Configuration
This project uses Firebase for all backend services.
1.  Create a Firebase Project.
2.  Enable **Authentication** (Google Sign-In).
3.  Enable **Firestore Database**.
4.  Copy the `firestore.rules` file content to your Firebase Console > Firestore > Rules.
5.  Update `src/firebase/config.ts` with your Firebase App Config.

### 4. Run Locally
```bash
pnpm dev
# Open http://localhost:3000
```

## Administrative Access

By default, all new users are **Professors**. To promote a user to **Admin**:

1.  Go to **Firebase Console** -> **Firestore Database**.
2.  Create a collection named `roles_admin`.
3.  Add a document where the **Document ID** is the user's **UID**.
4.  Add a field: `active: true` (boolean).

## 📦 Deployment (Vercel)

1.  Push your code to GitHub.
2.  Import the project into Vercel.
3.  Deploy! (No environment variables needed if config is hardcoded, otherwise set them up).
4.  **IMPORTANT**: Add your Vercel domain (e.g., `neu-laboratory.vercel.app`) to **Firebase Console > Authentication > Settings > Authorized Domains**.

---

## 📝 License
Proprietary software for New Era University.
