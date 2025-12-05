# 🚀 Performance Optimization Checklist for Royal Pure Spices

## ✅ Implemented Optimizations

### 1. Code Splitting & Lazy Loading
- [x] All pages except Index are lazy-loaded with `React.lazy()`
- [x] Suspense fallback with loading spinner
- [x] Homepage loads instantly, other pages load on-demand

### 2. Vite Build Optimization
- [x] Manual chunk splitting (react-vendor, router, supabase, query, ui-utils, date-utils, radix-core)
- [x] ES2020 target for modern browsers
- [x] CSS minification enabled
- [x] Optimized asset naming for better caching

### 3. React Performance
- [x] `React.memo()` on Navbar component
- [x] `useCallback()` for event handlers
- [x] `useMemo()` for expensive calculations (cart total, sizes array)
- [x] Stable callback references in hooks

### 4. Image Optimization
- [x] Hero image: `loading="eager"`, `fetchPriority="high"`
- [x] Below-fold images: `loading="lazy"`, `decoding="async"`
- [x] Added width/height attributes to prevent CLS

### 5. Caching Strategy (vercel.json)
- [x] Static assets: 1 year immutable cache
- [x] HTML: no-cache, must-revalidate
- [x] Security headers (X-Frame-Options, X-XSS-Protection, etc.)

### 6. SEO Optimization
- [x] Comprehensive meta tags
- [x] Open Graph & Twitter cards
- [x] JSON-LD structured data
- [x] robots.txt with sitemap reference
- [x] Web App Manifest for PWA

### 7. TanStack Query Optimization
- [x] 5-minute stale time to reduce API calls
- [x] 10-minute garbage collection time
- [x] Disabled refetchOnWindowFocus for better UX
- [x] Single retry on failure

---

## 📋 Production Checklist (Before Each Deploy)

### 1. Image Optimization
```bash
# Convert images to WebP (recommended)
# Use tools like: squoosh.app, sharp, or imagemin
# Target: hero image < 200KB, product images < 100KB
```

### 2. Build & Analyze Bundle
```bash
npm run build
# Check dist folder size
# Target: Initial JS < 200KB gzipped
```

### 3. Lighthouse Audit
- Run Lighthouse in Chrome DevTools (Incognito mode)
- Target scores: Performance 90+, SEO 100, Accessibility 90+, Best Practices 100

### 4. Core Web Vitals Check
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms  
- **CLS (Cumulative Layout Shift)**: < 0.1

### 5. Test Critical Paths
- [ ] Homepage loads fast (< 3s on 3G)
- [ ] Cart operations work smoothly
- [ ] Checkout flow completes without errors
- [ ] Admin login and dashboard work
- [ ] Auth flow (login/signup) works

### 6. Update Production URLs
Before deploying, update these placeholders:
- `index.html`: canonical URL, og:url
- `robots.txt`: Sitemap URL
- `site.webmanifest`: Verify icons exist
- `index.html`: Replace phone number in structured data

### 7. Environment Variables
Ensure these are set in Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_USE_DB_VARIANTS` (optional)

### 8. Verify Caching Headers
After deploy, check response headers:
```bash
curl -I https://your-domain.com/assets/js/main-[hash].js
# Should show: Cache-Control: public, max-age=31536000, immutable
```

### 9. Monitor Performance
- Set up Vercel Analytics (free tier available)
- Monitor Core Web Vitals in Google Search Console
- Check for console errors in production

### 10. Security Checklist
- [ ] HTTPS enforced
- [ ] No sensitive data in client-side code
- [ ] Supabase RLS policies are active
- [ ] Admin routes protected

---

## 🗑️ Unused Dependencies to Consider Removing

Review if these are actually used in your codebase:

```json
// Potentially unused (verify before removing):
"@radix-ui/react-accordion"     // Check if used
"@radix-ui/react-aspect-ratio"  // Check if used
"@radix-ui/react-avatar"        // Check if used
"@radix-ui/react-collapsible"   // Check if used
"@radix-ui/react-context-menu"  // Check if used
"@radix-ui/react-hover-card"    // Check if used
"@radix-ui/react-menubar"       // Check if used
"@radix-ui/react-navigation-menu" // Check if used
"@radix-ui/react-pagination"    // Check if used (no file found)
"@radix-ui/react-progress"      // Check if used
"@radix-ui/react-slider"        // Check if used
"@radix-ui/react-toggle"        // Check if used
"@radix-ui/react-toggle-group"  // Check if used
"cmdk"                          // Command menu - check if used
"embla-carousel-react"          // Carousel - check if used
"input-otp"                     // OTP input - check if used
"react-day-picker"              // Date picker - check if used
"react-resizable-panels"        // Resizable panels - check if used
"recharts"                      // Charts - only if Admin uses charts
"vaul"                          // Drawer - check if used
"next-themes"                   // Theme switching - not needed for light-only
```

To check usage:
```bash
# Search for imports of a package
grep -r "from.*accordion" src/
```

---

## 🎯 Future Optimizations

1. **Image CDN**: Use Vercel Image Optimization or Cloudinary
2. **Service Worker**: Add for offline support (vite-plugin-pwa)
3. **Prefetching**: Add `<link rel="prefetch">` for likely next pages
4. **Font Optimization**: Self-host fonts with font-display: swap
5. **Bundle Analysis**: Use `rollup-plugin-visualizer` to find bloat
6. **Edge Functions**: Move heavy Supabase queries to edge functions

---

## 📊 Expected Results

After these optimizations, you should see:
- **Initial bundle**: ~150-200KB gzipped (down from potentially 500KB+)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s on 4G
- **Lighthouse Performance**: 85-95+
- **Lighthouse SEO**: 100

---

*Last updated: December 2024*
