# Muse 🎵

A web-based **Virtual Listening Room** where users can create private or public spaces to search for, queue, and listen to music together in perfect synchronization.

## Features

- 🎧 **Synchronized Playback** - All participants hear the same beat at the same time (<500ms sync)
- 🔍 **YouTube Search** - Find and add songs from YouTube
- 📋 **Collaborative Queue** - Shared playlist management
- 🔐 **Host Controls** - Toggle guest permissions for playback control
- ✨ **Glassmorphic UI** - Premium dark-mode design with blur effects and animations
- ⚡ **Real-time Updates** - Instant sync via Socket.io

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React, TypeScript |
| Styling | Tailwind CSS (Glassmorphism) |
| Animation | Framer Motion |
| State | Zustand |
| Real-time | Socket.io |
| Backend | Node.js, Express |

## Project Structure

```
/muse
├── /apps
│   ├── /web          # Next.js frontend
│   │   ├── /src
│   │   │   ├── /app        # Pages and layout
│   │   │   ├── /components # UI components
│   │   │   ├── /hooks      # Custom hooks
│   │   │   └── /store      # Zustand store
│   └── /server       # Socket.io backend
│       └── /src
│           ├── /handlers   # Socket event handlers
│           └── /utils      # Utilities
├── /packages
│   └── /types        # Shared TypeScript interfaces
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
# Frontend
cd apps/web
npm install

# Backend
cd apps/server
npm install
```

3. Set up environment variables:

**Frontend** (`apps/web/.env.local`):
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

**Backend** (`apps/server/.env`):
```
PORT=3001
CLIENT_URL=http://localhost:3000
```

### Development

```bash
# Start the backend (from apps/server)
npm run dev

# Start the frontend (from apps/web)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Create a Room** - Enter your name and click "Create a Jam"
2. **Share the Room Code** - Copy the room ID to invite others
3. **Search & Queue** - Use the search bar to find songs
4. **Control Playback** - Play, pause, skip (if allowed by host)
5. **Host Controls** - Lock/unlock guest controls as the room creator

## License

MIT
