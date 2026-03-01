import { useParams, Link, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { posts, getPost, formatDate } from '../blog/index.js'

// ── Category badge colours (mirrors Blog.jsx) ─────────────────────────────
const CATEGORY_COLORS = {
  'Investing Basics':    { bg: 'bg-[#7C5CFC]/10',  text: 'text-[#a78bfa]',  border: 'border-[#7C5CFC]/20' },
  'Portfolio Management':{ bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  'Income Investing':    { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  'General':             { bg: 'bg-white/5',         text: 'text-gray-400',    border: 'border-white/10' },
}

function categoryStyle(cat) {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['General']
}

// ── Custom markdown component renderers ───────────────────────────────────
const mdComponents = {
  // Headings
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold text-white mt-10 mb-4 leading-snug">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold text-white mt-10 mb-3 leading-snug pb-2 border-b border-white/[0.06]">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-white mt-6 mb-2">{children}</h3>
  ),
  // Paragraphs
  p: ({ children }) => (
    <p className="text-[15px] text-gray-300 leading-[1.8] mb-5">{children}</p>
  ),
  // Bold + italic
  strong: ({ children }) => (
    <strong className="text-white font-semibold">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-gray-200 italic">{children}</em>
  ),
  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#a78bfa] hover:text-[#7C5CFC] underline underline-offset-2 transition-colors"
    >
      {children}
    </a>
  ),
  // Unordered list
  ul: ({ children }) => (
    <ul className="space-y-2 mb-5 ml-1">{children}</ul>
  ),
  // Ordered list
  ol: ({ children }) => (
    <ol className="space-y-2 mb-5 ml-1 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children, ordered }) => ordered ? (
    <li className="text-[15px] text-gray-300 leading-relaxed">{children}</li>
  ) : (
    <li className="text-[15px] text-gray-300 leading-relaxed flex gap-2 items-start">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#7C5CFC]/60 flex-shrink-0" />
      <span>{children}</span>
    </li>
  ),
  // Code blocks
  code: ({ inline, children }) =>
    inline ? (
      <code className="px-1.5 py-0.5 rounded bg-white/[0.07] border border-white/10 text-[#a78bfa] text-[13px] font-mono">
        {children}
      </code>
    ) : (
      <code>{children}</code>
    ),
  pre: ({ children }) => (
    <pre className="my-5 p-4 rounded-xl bg-black/40 border border-white/[0.08] overflow-x-auto text-sm text-gray-300 font-mono leading-relaxed">
      {children}
    </pre>
  ),
  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="my-5 pl-4 border-l-2 border-[#7C5CFC]/50 text-gray-400 italic">
      {children}
    </blockquote>
  ),
  // Horizontal rule
  hr: () => (
    <hr className="my-8 border-white/[0.06]" />
  ),
  // Tables
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-white/[0.08]">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-white/[0.04] border-b border-white/[0.08]">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-white/[0.04]">{children}</tbody>
  ),
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-gray-300 leading-relaxed">{children}</td>
  ),
}

// ── Page ─────────────────────────────────────────────────────────────────
export default function BlogPost() {
  const { slug } = useParams()
  const post = getPost(slug)

  // 404 — redirect to blog index
  if (!post) return <Navigate to="/blog" replace />

  const cs = categoryStyle(post.category)

  return (
    <div
      className="min-h-screen bg-[#050505] relative overflow-x-hidden"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
    >
      <Helmet>
        <title>{post.title} — Flolio</title>
        <meta name="description" content={post.description} />
        <link rel="canonical" href={`https://flolio.app/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://flolio.app/blog/${post.slug}`} />
        <meta property="og:site_name" content="Flolio" />
        <meta property="article:published_time" content={post.date} />
        <meta property="article:author" content="Flolio Team" />
      </Helmet>
      {/* Background atmosphere */}
      <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#7C5CFC]/[0.05] blur-[130px] pointer-events-none" />

      {/* ── Nav bar ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/blog" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            The Digest
          </Link>
          <Link to="/" className="text-sm font-semibold text-white/60 hover:text-white transition-colors" style={{ fontFamily: '"Cal Sans", "Inter", sans-serif' }}>
            Flolio
          </Link>
          <Link
            to="/register"
            className="text-xs font-medium text-white bg-[#7C5CFC] hover:bg-[#6B4CE0] px-4 py-1.5 rounded-full transition-all duration-200"
          >
            Get Early Access
          </Link>
        </div>
      </nav>

      {/* ── Article header ──────────────────────────────────────────── */}
      <header className="max-w-3xl mx-auto px-6 pt-14 pb-10">
        {/* Category + meta */}
        <div className="flex flex-wrap items-center gap-3 mb-5 landing-fade-up">
          <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cs.bg} ${cs.text} ${cs.border}`}>
            {post.category}
          </span>
          <span className="text-xs text-gray-500">{formatDate(post.date)}</span>
          <span className="text-gray-700 text-xs">·</span>
          <span className="text-xs text-gray-500">{post.readTime}</span>
        </div>

        {/* Title */}
        <h1
          className="text-3xl md:text-4xl font-bold text-white leading-tight mb-5 landing-fade-up"
          style={{ animationDelay: '0.06s' }}
        >
          {post.title}
        </h1>

        {/* Description / lead */}
        <p
          className="text-[16px] text-gray-400 leading-relaxed landing-fade-up"
          style={{ animationDelay: '0.12s' }}
        >
          {post.description}
        </p>

        {/* Divider */}
        <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </header>

      {/* ── Article body ─────────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-6 pb-24 card-reveal" style={{ animationDelay: '0.14s' }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={mdComponents}
        >
          {post.content}
        </ReactMarkdown>
      </main>

      {/* ── CTA banner ───────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="glass-card rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#7C5CFC]/[0.06] blur-[60px] pointer-events-none" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-lg leading-snug mb-1">
              Track your dividends with Flolio
            </p>
            <p className="text-sm text-gray-400">
              Connect all your brokers. See your income in one place. Free to start.
            </p>
          </div>
          <Link
            to="/register"
            className="flex-shrink-0 text-sm font-semibold text-white bg-[#7C5CFC] hover:bg-[#6B4CE0] px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-[#7C5CFC]/25 hover:shadow-[#7C5CFC]/40 whitespace-nowrap"
          >
            Get started free →
          </Link>
        </div>
      </section>

      {/* ── Related posts ─────────────────────────────────────────────── */}
      <RelatedPosts currentSlug={slug} />

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="text-sm font-semibold text-white/60 hover:text-white transition-colors" style={{ fontFamily: '"Cal Sans", "Inter", sans-serif' }}>
            Flolio
          </Link>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Flolio. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-gray-500">
            <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link to="/login" className="hover:text-white transition-colors">Sign in</Link>
            <Link to="/register" className="hover:text-white transition-colors">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── Related posts strip ────────────────────────────────────────────────────
function RelatedPosts({ currentSlug }) {
  const related = posts.filter((p) => p.slug !== currentSlug).slice(0, 2)
  if (related.length === 0) return null

  return (
    <section className="max-w-3xl mx-auto px-6 pb-12">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-5">More articles</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {related.map((post) => {
          const cs = categoryStyle(post.category)
          return (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="glass-card group block rounded-xl p-5 hover:border-[#7C5CFC]/20 transition-all duration-200 focus:outline-none"
            >
              <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border mb-3 ${cs.bg} ${cs.text} ${cs.border}`}>
                {post.category}
              </span>
              <p className="text-sm font-semibold text-white leading-snug group-hover:text-[#a78bfa] transition-colors line-clamp-2 mb-2">
                {post.title}
              </p>
              <p className="text-[11px] text-gray-500">{formatDate(post.date)} · {post.readTime}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
