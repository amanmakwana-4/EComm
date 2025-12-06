# Royal Pure Spices 🌿

An e-commerce website for premium, 100% pure asafoetida (hing) and authentic Indian spices. Built with modern web technologies for a fast, seamless shopping experience.

## 🛍️ What This Project Does

Royal Pure Spices is a complete online store where customers can:
- Browse and purchase premium quality hing in various sizes (10g, 25g, 50g, 100g)
- Create an account and track their orders
- Pay via Cash on Delivery and online payment is coming soon
- Get order confirmation emails automatically

Admins can:
- View and manage all orders from a dedicated dashboard
- Update order status (pending → packed → shipped → delivered)
- Search and filter orders by customer name, email, or status
- See sales analytics at a glance

## 🚀 Tech Stack

- **Frontend**: React 18 with Vite for lightning-fast development
- **Styling**: Tailwind CSS with a custom warm, spice-inspired color palette
- **UI Components**: Radix UI primitives (only the ones we actually use!)
- **State Management**: TanStack Query for server state, React hooks for local state
- **Backend**: Supabase (PostgreSQL database + Auth + Edge Functions)
- **Hosting**: Optimized for Vercel deployment

## ⚡ Performance Optimizations

We've put a lot of effort into making this site fast:

- **Code Splitting**: All pages except the homepage are lazy-loaded
- **Smart Chunking**: Vendor libraries are split into separate cached chunks
- **Minimal Dependencies**: Removed 18 unused packages and 32 unused UI components
- **Optimized Images**: Lazy loading for below-fold images, priority loading for hero
- **Aggressive Caching**: Static assets cached for 1 year with immutable headers
- **React Best Practices**: `React.memo`, `useCallback`, and `useMemo` where it matters

## 📦 Getting Started

Make sure you have Node.js installed (v18 or higher recommended).

```bash
# Clone the repo
git clone https://github.com/amanmakwana-4/EComm.git
cd EComm

# Install dependencies
npm install

# Set up environment variables
# Create a .env file with your Supabase credentials:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and you're good to go!

## 🔧 Available Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Starts the development server |
| `npm run build` | Creates an optimized production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Check for code issues |

## 📁 Project Structure

```
src/
├── assets/          # Images and static files
├── components/      # Reusable UI components
│   ├── ui/          # Radix-based primitives (button, card, dialog, etc.)
│   ├── Navbar.jsx   # Site navigation
│   └── Footer.jsx   # Site footer
├── hooks/           # Custom React hooks
│   ├── useAuth.js   # Authentication logic
│   └── useCart.js   # Shopping cart state
├── integrations/    # External service configs
│   └── supabase/    # Supabase client setup
├── pages/           # Route components
│   ├── Index.jsx    # Homepage
│   ├── Product.jsx  # Product detail page
│   ├── Cart.jsx     # Shopping cart
│   ├── Checkout.jsx # Checkout flow
│   ├── Admin.jsx    # Admin dashboard
│   └── ...          # Other pages
└── App.jsx          # Main app with routing
```

## 🔐 Environment Variables

You'll need these in your `.env` file:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

For the admin email functionality, you'll also need to configure the Supabase Edge Function with a Resend API key.

## 🌐 Deployment

This project is optimized for Vercel:

1. Push your code to GitHub
2. Import the repo in Vercel
3. Add your environment variables
4. Deploy!

The included `vercel.json` handles SPA routing and sets up proper caching headers automatically.

## 📊 Bundle Size

After our optimizations, the production build is lean:

- **Initial JS**: ~160KB gzipped (down from 500KB+)
- **CSS**: ~11KB gzipped
- **Lazy-loaded pages**: 1-5KB each

## 🤝 Contributing

Feel free to open issues or submit PRs. This is a real business project, so we appreciate thoughtful contributions!

## 📄 License

This project is private and proprietary to Royal Pure Spices.

---

Made with ❤️ for authentic Indian spices
