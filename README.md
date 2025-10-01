# Tekkr Chat Application

A modern chat application with AI-powered project planning capabilities, built with React and Node.js.

## Features

- **Real-time Chat Interface**: Clean, modern chat UI with message history
- **AI-Powered Responses**: Integration with Google Gemini AI for intelligent conversations
- **Project Plan Visualization**: Beautiful, collapsible project plan renderer with:
  - Structured workstreams with lettered sections (A, B, C, D)
  - Expandable/collapsible sections for better organization
  - Deliverables with contextual icons and descriptions
  - Professional styling with consistent spacing and typography
- **Inline Project Plans**: Project plans can appear anywhere within messages, not just at the beginning or end
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Enhanced Typography**: Improved spacing and readability for long-form content

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Markdown** for content rendering
- **Radix UI** components for accessibility

### Backend
- **Node.js** with TypeScript
- **Fastify** web framework
- **Google Gemini AI** integration
- **In-memory storage** for chat persistence

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Google Gemini API key

### Installation

1. **Clone and navigate to the project:**

2. **Set up the backend:**
   ```bash
   cd server
   npm install
   cp .env.example .env
   ```
   
   Edit `.env` and add your Google Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Set up the frontend:**
   ```bash
   cd ../web
   npm install
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd server
   npm start
   ```
   Server runs on http://localhost:8000

2. **Start the frontend (in a new terminal):**
   ```bash
   cd web
   npm start
   ```
   Application opens at http://localhost:3000

## Project Structure

```
hiring-test-full-stack/
├── server/                 # Backend API
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── storage/       # Data persistence
│   │   └── types/         # TypeScript definitions
│   ├── .env.example       # Environment variables template
│   └── package.json
├── web/                   # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── data/          # API integration
│   └── package.json
└── README.md
```

## Key Components

### ProjectPlanRenderer
The core component for displaying structured project plans with:
- Collapsible workstream sections
- Icon-based deliverable categorization
- Professional typography and spacing
- Responsive design

### MessageContent
Handles rendering of chat messages with support for:
- Markdown content
- Inline project plan embedding
- Enhanced typography for readability
- Role-based styling (user vs assistant)

## API Endpoints

- `GET /api/chats` - Retrieve all chats
- `POST /api/chats` - Create a new chat
- `GET /api/chats/:id` - Get specific chat
- `POST /api/chats/:id/messages` - Send message to chat

## Environment Variables

### Server (.env)
```
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## Development Notes

- The application uses in-memory storage for simplicity
- Project plans are embedded in messages using `[PROJECT_PLAN]...[/PROJECT_PLAN]` markers
- The UI is optimized for both short conversations and long-form project documentation
- Enhanced spacing and typography ensure excellent readability

## Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env` file

---

Built with ❤️ for the Tekkr hiring process
