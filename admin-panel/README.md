# AFNNY Admin Panel

A comprehensive admin panel for managing the AFNNY dating application. Built with React, TypeScript, Material-UI, and Firebase.

## Features

- **Dashboard**
  - Real-time statistics and metrics
  - User growth charts
  - Match analytics
  - Report distribution visualization

- **User Management**
  - View and manage user profiles
  - Block/unblock users
  - Edit user information
  - View user activity and matches

- **Reports Management**
  - Handle user reports
  - Filter by report type and status
  - Take actions on reports
  - Track report resolution

- **Matches Management**
  - View match statistics
  - Monitor match quality
  - Handle match-related issues

- **Stories Management**
  - Monitor user stories
  - Remove inappropriate content
  - View story metrics

- **Notifications**
  - Send system notifications
  - Manage notification templates
  - View notification history

- **Analytics**
  - User engagement metrics
  - Feature usage statistics
  - Performance analytics
  - User retention data

## Tech Stack

- React 18
- TypeScript
- Material-UI v5
- Firebase v12
- Chart.js
- React Router v6

## Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Firebase project with necessary configurations

## Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd admin-panel
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
yarn install
\`\`\`

3. Create a .env file in the root directory and add your Firebase configuration:
\`\`\`env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
\`\`\`

4. Start the development server:
\`\`\`bash
npm start
# or
yarn start
\`\`\`

## Build

To create a production build:

\`\`\`bash
npm run build
# or
yarn build
\`\`\`

## Deployment

The admin panel can be deployed to any static hosting service (Firebase Hosting, Vercel, Netlify, etc.).

Example deployment to Firebase Hosting:

1. Install Firebase CLI:
\`\`\`bash
npm install -g firebase-tools
\`\`\`

2. Login to Firebase:
\`\`\`bash
firebase login
\`\`\`

3. Initialize Firebase:
\`\`\`bash
firebase init
\`\`\`

4. Deploy:
\`\`\`bash
firebase deploy
\`\`\`

## Security

- The admin panel is protected with Firebase Authentication
- Only users with admin privileges can access the panel
- All actions are logged and audited
- Rate limiting is implemented for sensitive operations

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact the development team or open an issue in the repository. 