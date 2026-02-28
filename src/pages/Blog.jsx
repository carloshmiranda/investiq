import { Link } from 'react-router-dom'
import { posts, formatDate } from '../blog/index.js'

// ── Category badge colour map ─────────────────────────────────────────────
const CATEGORY_COLORS = {
  'Investing Basics':    { bg: 'bg-[#7C5CFC]/10',  text: 'text-[#a78bfa]',  border: 'border-[#7C5CFC]/20' },
  'Portfolio Management':{ bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  'Income Investing':    { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  'General':             { bg: 'bg-white/5',         text: 'text-gray-400',    border: 'border-white/10' },
}

function categoryStyle(cat) {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['General']
}

// ── Blog card ─────────────────────────────────────────────────────────────
function PostCard({ post }) {
  const cs = categoryStyle(post.category)
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="glass-card group block rounded-2xl p-6 transition-all duration-300 hover:border-[#7C5CFC]/25 hover:shadow-[0_0_40px_rgba(124,92,252,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC]/40"
    >
      {/* Category badge */}
      <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border mb-4 ${cs.bg} ${cs.text} ${cs.border}`}>
        {post.category}
      </span>

      {/* Title */}
      <h2 className="text-[17px] font-semibold text-white leading-snug mb-2 group-hover:text-[#a78bfa] transition-colors duration-200">
        {post.title}
      </h2>

      {/* Description */}
      <p className="text-sm text-gray-400 leading-relaxed line-clamp-3 mb-5">
        {post.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{formatDate(post.date)}</span>
          <span className="text-gray-700">·</span>
          <span>{post.readTime}</span>
        </div>
        <span className="text-xs font-medium text-[#7C5CFC] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
          Read
          <svg className="w-3 h-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  )
}

// ── Featured (first/latest) card ──────────────────────────────────────────
function FeaturedCard({ post }) {
  const cs = categoryStyle(post.category)
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="glass-card group block rounded-2xl p-8 transition-all duration-300 hover:border-[#7C5CFC]/25 hover:shadow-[0_0_60px_rgba(124,92,252,0.10)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC]/40 relative overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#7C5CFC]/[0.05] blur-[80px] pointer-events-none" />

      {/* Latest badge */}
      <div className="flex items-center gap-3 mb-5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#7C5CFC]/20 text-[#a78bfa] border border-[#7C5CFC]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7C5CFC] inline-block" />
          Latest
        </span>
        <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cs.bg} ${cs.text} ${cs.border}`}>
          {post.category}
        </span>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-white leading-snug mb-3 group-hover:text-[#a78bfa] transition-colors duration-200">
        {post.title}
      </h2>

      {/* Description */}
      <p className="text-[15px] text-gray-400 leading-relaxed mb-6 max-w-2xl">
        {post.description}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{formatDate(post.date)}</span>
          <span className="text-gray-700">·</span>
          <span>{post.readTime}</span>
        </div>
        <span className="text-sm font-medium text-[#a78bfa] flex items-center gap-1.5">
          Read article
          <svg className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function Blog() {
  const [featured, ...rest] = posts

  return (
    <div
      className="min-h-screen bg-[#050505] relative overflow-x-hidden"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
    >
      {/* Background atmosphere */}
      <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-[#7C5CFC]/[0.06] blur-[140px] pointer-events-none" />

      {/* ── Nav bar ───────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Flolio
          </Link>
          <span className="text-sm font-semibold text-white">The Digest</span>
          <Link
            to="/register"
            className="text-xs font-medium text-white bg-[#7C5CFC] hover:bg-[#6B4CE0] px-4 py-1.5 rounded-full transition-all duration-200"
          >
            Get Early Access
          </Link>
        </div>
      </nav>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <p className="text-xs font-semibold text-[#7C5CFC] uppercase tracking-widest mb-3 landing-fade-up">
          The Digest
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight landing-fade-up" style={{ animationDelay: '0.06s' }}>
          Investing insights,<br />without the noise.
        </h1>
        <p className="text-gray-400 mt-4 text-[15px] max-w-xl landing-fade-up" style={{ animationDelay: '0.12s' }}>
          Practical guides on dividend investing, portfolio management, and building passive income — from the team at Flolio.
        </p>
      </header>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 pb-24 space-y-8">
        {/* Featured / latest post */}
        {featured && (
          <div className="card-reveal">
            <FeaturedCard post={featured} />
          </div>
        )}

        {/* Remaining posts grid */}
        {rest.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-5">
            {rest.map((post, i) => (
              <div key={post.slug} className="card-reveal" style={{ animationDelay: `${0.08 + i * 0.06}s` }}>
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state (shouldn't happen with seeded posts) */}
        {posts.length === 0 && (
          <div className="text-center py-24 text-gray-500">
            <p className="text-lg">No articles yet — check back soon.</p>
          </div>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="text-sm font-semibold text-white/60 hover:text-white transition-colors" style={{ fontFamily: '"Cal Sans", "Inter", sans-serif' }}>
            Flolio
          </Link>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Flolio. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-gray-500">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/login" className="hover:text-white transition-colors">Sign in</Link>
            <Link to="/register" className="hover:text-white transition-colors">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
