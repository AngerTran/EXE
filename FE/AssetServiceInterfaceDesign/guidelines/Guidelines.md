# Design Guidelines - Game AI Platform

## Aesthetic Stance: Kinetic Tech

Platform hỗ trợ game creators với AI - năng động, tech-forward, creative nhưng approachable cho beginners.

**Visual Direction:** Dark canvas với vibrant accents, motion-ready components, layered depth, glowing highlights. Inspired by game engines, creative tools, và modern AI platforms.

## Typography

### Display: Space Grotesk
- Headings, hero text, section titles
- Geometric, tech-forward, distinct personality
- Weights: 500 (Medium), 600 (SemiBold), 700 (Bold)

### Body: Inter
- Body copy, descriptions, UI text
- Clean, highly legible, neutral
- Weights: 400 (Regular), 500 (Medium), 600 (SemiBold)

### Mono: JetBrains Mono
- Code snippets, asset IDs, technical labels, credit counts
- Clear, developer-friendly
- Weight: 400 (Regular), 500 (Medium)

## Color System

### Core Palette
- **Background:** Deep dark blue-gray `#0a0e1a` - canvas chính
- **Foreground:** Bright white `#f8f9fa` - text chính
- **Surface:** Elevated dark `#131821` - cards, panels

### Accent Colors
- **Primary:** Vibrant cyan `#00d9ff` - CTAs, interactive elements, AI indicators
- **Secondary:** Electric purple `#a855f7` - secondary actions, highlights
- **Success:** Neon green `#10b981` - confirmations, positive states
- **Warning:** Bright amber `#f59e0b` - alerts, low credit warnings
- **Danger:** Hot pink `#ec4899` - errors, destructive actions

### Semantic Usage
- **AI Elements:** Cyan gradient `from-cyan-400 to-blue-500`
- **Premium/Paid:** Purple gradient `from-purple-500 to-pink-500`
- **Asset Categories:** Use full spectrum for visual coding
- **Interactive States:** Glow effects on hover, subtle animations

## Layout Principles

### Grid System
- Max-width containers: `max-w-7xl` (1280px) cho content chính
- Full-bleed cho heroes và media-heavy sections
- Asymmetric layouts where appropriate - tránh equal-column grids thông thường

### Spacing Scale
- **Tight:** 0.5rem, 1rem - component internals
- **Normal:** 1.5rem, 2rem - between elements
- **Generous:** 3rem, 4rem, 6rem - section padding
- **Extra:** 8rem, 10rem - hero sections

### Depth & Layering
- Cards float với subtle shadows
- Backdrop blur cho glass-morphism effects
- Border glow cho interactive elements
- Z-layers rõ ràng: background < content < modals < tooltips

## Component Patterns

### Cards & Panels
- Dark background `bg-slate-900/50` với border `border-slate-800`
- Backdrop blur `backdrop-blur-sm` cho depth
- Hover: lift effect + glow border
- Border radius: `rounded-xl` (12px)

### Buttons
- **Primary:** Cyan background, white text, glow on hover
- **Secondary:** Transparent với border, fill on hover
- **Ghost:** Text only, underline on hover
- Height: `h-10` (40px) standard, `h-12` (48px) cho CTAs
- All buttons: transition effects, subtle scale on hover

### Input Fields
- Dark background `bg-slate-900/50`
- Cyan border on focus với glow effect
- Placeholder: muted gray
- Icons inside input khi cần (search, password toggle)

### Navigation
- Fixed header với backdrop blur
- Hamburger menu trên mobile
- Active states với underline hoặc glow
- Credit counter prominent trong nav

### Asset Cards
- Image preview với aspect ratio fixed
- Overlay gradient on hover hiện actions
- Category badge trên góc
- Favorite heart icon
- Download count và rating

### AI Chat Interface
- Message bubbles: user (right, cyan accent) vs AI (left, purple accent)
- Typing indicator với animated dots
- Credit cost hiển thị trước khi send
- Suggested prompts dạng chips

## Motion & Interaction

### Transitions
- Default duration: `150ms` cho micro-interactions
- Longer: `300ms` cho modal/drawer animations
- Easing: `ease-in-out` standard, `spring` cho bouncy effects

### Hover States
- Scale: `hover:scale-105` cho cards
- Glow: outer glow với accent color
- Background shift: subtle brighten

### Loading States
- Skeleton screens với shimmer animation
- Spinner với cyan color cho AI processing
- Progress bars cho uploads/downloads

### Scroll Behavior
- Smooth scroll
- Parallax effects cho hero images (subtle)
- Fade-in on scroll cho sections
- Sticky headers

## Data Visualization

### Charts (for admin dashboard)
- Dark theme recharts
- Cyan/purple color scheme
- Grid lines: subtle, low opacity
- Tooltips: glass-morphism style

### Stats Display
- Large numbers: display font, cyan color
- Labels: mono font, muted
- Icons paired với metrics
- Trend indicators (arrows, percentages)

## Imagery & Assets

### Photo Treatment
- Dark overlay gradients
- Desaturate slightly để blend với dark theme
- Border glow khi hover
- Lazy loading với blur-up placeholder

### Icons
- Lucide React icon set
- Size: `w-5 h-5` (20px) standard, `w-6 h-6` (24px) cho emphasis
- Color: match accent colors theo context
- Stroke width: 2 (default)

### Asset Previews
- 2D: Pixel art, sprites - maintain crisp edges, no blur
- 3D: Models - dark background showcase
- Audio: Waveform visualization
- UI: Show on device mockups

## Accessibility

### Contrast
- Body text on background: minimum 4.5:1
- Large text: minimum 3:1
- Interactive elements: 3:1 với clear focus states

### Focus States
- Visible ring: `ring-2 ring-cyan-400` hoặc `ring-purple-400`
- Skip-links cho keyboard navigation
- ARIA labels cho icon buttons

### Responsive Breakpoints
- Mobile: < 640px - stack all, full-width CTAs
- Tablet: 640px - 1024px - 2-column grids
- Desktop: > 1024px - full layout

## Content Guidelines

### Tone of Voice
- Friendly, supportive, encouraging
- Tránh technical jargon khi có thể
- Explain AI suggestions clearly
- Vietnamese language với technical terms giữ nguyên tiếng Anh

### Placeholder Content
- Realistic game ideas: "Game platformer 2D phong cách retro"
- Real asset names: "Pixel Character Sprite Sheet", "Medieval Castle Tileset"
- Actual credit amounts: 10, 50, 100, 500
- Vietnamese names cho users demo

### Empty States
- Illustrative icons
- Encouraging copy
- Clear CTA để get started
- Helpful hints

## Technical Notes

### Performance
- Lazy load images
- Code splitting cho routes
- Minimize bundle size
- Optimize fonts (subset Vietnamese + Latin)

### Dark Mode Only
- No light mode toggle (dark is brand identity)
- Ensure all components work trong dark context
- Test contrast carefully

### Browser Support
- Modern browsers (last 2 versions)
- Progressive enhancement
- Graceful degradation cho older browsers
