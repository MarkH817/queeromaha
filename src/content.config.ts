import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'zod'

export const tagEnum = z.enum(['neutral-bathrooms', 'seating', 'work-spot'])

export const itemSchema = z.object({
  name: z.string(),
  public: z.boolean().optional(),
  description: z.string().optional(),
  tags: z.array(tagEnum).optional(),
  links: z
    .array(z.object({ label: z.string(), url: z.string().url() }))
    .optional(),
  notes: z.string().optional(),
})

// Directory pages: structured yaml, no markdown body
export const directoryPageSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  public: z.boolean().default(true),
  items: z.array(itemSchema).optional(),
})

// Simple pages: frontmatter + markdown body (about, contact)
export const simplePageSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  public: z.boolean().default(true),
})

export const collections = {
  directory: defineCollection({
    loader: glob({ pattern: '*.yaml', base: './src/content/pages' }),
    schema: directoryPageSchema,
  }),
  simple: defineCollection({
    loader: glob({ pattern: '*.md', base: './src/content/pages' }),
    schema: simplePageSchema,
  }),
}
