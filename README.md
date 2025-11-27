# Nano Banana Pro Playground

A powerful AI image generation and editing playground powered by Google Gemini 2.5 Flash Image and Vercel AI Gateway, with Supabase user authentication and persistent history.

## Features

- 🎨 **AI Image Generation** - Create stunning images from text prompts
- 🖼️ **Image Editing** - Edit existing images with AI (up to 8 images)
- 👤 **User Authentication** - Sign in with email/password, Google, or GitHub
- 💾 **Persistent History** - Save and manage your generation history
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🎯 **Multiple Aspect Ratios** - Support for various image dimensions
- ⚡ **Real-time Progress** - Live generation progress tracking

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS, Radix UI
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 2.5 Flash via Vercel AI Gateway
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account
- BLTCY API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hlong026/nano-banana-pro-playground.git
cd nano-banana-pro-playground
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your keys:
```env
BLTCY_API_KEY=your_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

4. Set up Supabase database:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the schema from `supabase/schema.sql`
   - Enable authentication providers (Google, GitHub) in Authentication > Providers

5. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Configuration

### Supabase Setup

1. **Create Tables**: Run `supabase/schema.sql` in your Supabase SQL Editor
2. **Enable OAuth**: 
   - Go to Authentication > Providers
   - Enable Google and/or GitHub
   - Add your OAuth credentials
   - Set redirect URL to: `https://your-domain.com/auth/callback`

### API Keys

- **BLTCY API Key**: Get from [api.bltcy.ai](https://api.bltcy.ai)
- **Supabase Keys**: Get from your Supabase project settings > API

## Features in Detail

### User Authentication
- Email/password registration and login
- OAuth with Google and GitHub
- Password reset functionality
- Secure session management

### Image Generation
- Text-to-image generation
- Image-to-image editing (up to 8 input images)
- Multiple aspect ratios (1:1, 16:9, 9:16, etc.)
- Adjustable image sizes (Auto, 1K, 2K, 4K)
- Model selection (Nano Banana, Nano Banana 2)

### History Management
- Automatic saving of generations (logged-in users)
- Local storage fallback (non-logged-in users)
- Pagination support
- Delete individual generations
- Clear all history

## Project Structure

```
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   ├── auth/                # Auth callback
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── auth/               # Authentication components
│   ├── image-combiner/     # Main app components
│   └── ui/                 # UI components
├── hooks/                   # Custom React hooks
├── lib/                     # Utility libraries
│   └── supabase/           # Supabase client & helpers
├── supabase/               # Database schema
└── public/                 # Static assets
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgments

- Built with [v0.dev](https://v0.dev)
- Powered by [Vercel AI Gateway](https://vercel.com/ai-gateway)
- UI components from [shadcn/ui](https://ui.shadcn.com)
