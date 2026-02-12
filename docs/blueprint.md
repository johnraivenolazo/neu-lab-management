# **App Name**: LabLog

## Core Features:

- Google Institutional Authentication: Authenticate users via Google Sign-In, restricting access to @neu.edu.ph domains.
- QR Code Scanning: Scan QR codes to automatically log professor's entry and exit. Each QR code is uniquely linked to a user's profile ID.
- Manual Login: Allow professors to manually log in via their institutional email if QR code scanning fails.
- Usage Logging: Record professor's name, room number, timestamps (in/out), and duration upon successful login/scan in Firestore.
- Admin Dashboard: Provide an admin dashboard for data visualization, filtering, and user management, accessible only via institutional email.
- Data Visualization: Display key metrics on the admin dashboard, such as total usage today, most active lab, and number of currently active sessions. Each metric is shown as a statistic card.
- AI Summarization: Use AI tool to provide a brief text summary of peak hours and most frequent users based on laboratory usage data. AI decides whether to output this summarization based on available data.
- User Management: Enable admins to block/revoke laboratory access for individual professor profiles instantly via a toggle. This blocks them from logging in via QR code or email.

## Style Guidelines:

- Primary color: Slate blue (#708090), conveying a sense of trustworthiness, formality, and academic focus.
- Background color: Light gray (#F0F8FF), creating a clean and neutral backdrop to improve readability.
- Accent color: Soft orange (#E07A5F) to highlight key interactive elements, such as buttons and active data points.
- Body and headline font: 'Inter', a sans-serif font for a modern, machined, objective, neutral look. Suitable for headlines or body text
- Use minimalist line icons to represent laboratory equipment, users, and data metrics. Ensure icons are consistent in style and size.
- Implement a clean and structured layout with clear visual hierarchy. Utilize cards for data visualization and tables for detailed logs.
- Incorporate subtle transition animations and loading indicators to improve user experience. Avoid distracting or unnecessary animations.