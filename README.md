# Vibe One

A modern, real-time collaborative music and chat application built with React, TypeScript, and Vite. Share your favorite YouTube music with friends in virtual rooms and chat in real-time.

## Features

- **Real-time Chat**: Communicate with users in shared rooms
- **Music Streaming**: Play and share YouTube music with the community
- **Room Management**: Create and join chat rooms for organized conversations
- **AI-Powered Features**: Integration with Gemini API for enhanced functionality
- **Responsive Design**: Built with Tailwind CSS and Shadcn UI components
- **Type-Safe**: Full TypeScript support for robust development

## Tech Stack

- **Frontend Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Backend**: Firebase for authentication and real-time database
- **APIs**: 
  - YouTube API for music search and playback
  - Google Gemini API for AI features
- **State Management**: React Query

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Firebase account and credentials
- Google API keys (YouTube and Gemini APIs)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vibe-one
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory and add your API credentials:
   ```
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_DATABASE_URL=your_firebase_database_url
   VITE_YOUTUBE_API_KEY=your_youtube_api_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The optimized build output will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Available Scripts

- `npm run dev` - Start the development server with HMR
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check code quality

## License

This project is open source and available under the MIT License.
