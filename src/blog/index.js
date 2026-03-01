// Vite glob import — all .md files in posts/ as raw strings
const rawFiles = import.meta.glob('./posts/*.md', { eager: true, query: '?raw', import: 'default' })

/**
 * Minimal YAML frontmatter parser — no external deps, fully browser-safe.
 * Handles the subset of YAML used in our .md files:
 *   key: "quoted value"  or  key: unquoted value
 */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }

  const block = match[1]
  const content = match[2].trim()
  const data = {}

  for (const line of block.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let value = line.slice(colonIdx + 1).trim()
    // Strip surrounding single or double quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    data[key] = value
  }

  return { data, content }
}

/**
 * Parse all blog posts from frontmatter + markdown content.
 * Sorted newest-first by date.
 */
export const posts = Object.entries(rawFiles)
  .map(([path, raw]) => {
    const { data, content } = parseFrontmatter(raw)
    // Derive slug from filename: ./posts/foo-bar.md → foo-bar
    const slug = path.replace('./posts/', '').replace('.md', '')
    return {
      slug,
      title: data.title ?? 'Untitled',
      description: data.description ?? '',
      date: data.date ?? '2026-01-01',
      readTime: data.readTime ?? '5 min read',
      category: data.category ?? 'General',
      author: data.author ?? 'Flolio Team',
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
