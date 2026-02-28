import matter from 'gray-matter'

// Vite glob import — all .md files in posts/ as raw strings
const rawFiles = import.meta.glob('./posts/*.md', { eager: true, query: '?raw', import: 'default' })

/**
 * Parse all blog posts from frontmatter + markdown content.
 * Sorted newest-first by date.
 */
export const posts = Object.entries(rawFiles)
  .map(([path, raw]) => {
    const { data, content } = matter(raw)
    // Derive slug from filename: ./posts/foo-bar.md → foo-bar
    const slug = path.replace('./posts/', '').replace('.md', '')
    return {
      slug,
      title: data.title ?? 'Untitled',
      description: data.description ?? '',
      date: data.date ?? '2026-01-01',
      readTime: data.readTime ?? '5 min read',
      category: data.category ?? 'General',
      content,
    }
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date))

/** Find a single post by slug. Returns null if not found. */
export function getPost(slug) {
  return posts.find((p) => p.slug === slug) ?? null
}

/** Format a date string (YYYY-MM-DD) to human-readable (e.g. Feb 24, 2026) */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
