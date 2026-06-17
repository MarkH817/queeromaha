import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'zod'

export const tagEnum = z.enum(['neutral-bathrooms', 'seating', 'work-spot'])

export const recurringEventSchema = z.object({
    summary: z.string(),
    rrule: z.string(),
    dtstart: z.string(),
    time: z.string(),
    end_time: z.string().optional(),
    duration: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    url: z.url().optional(),
})

export const locationSchema = z.object({
    street: z.coerce.string().optional(),
    city: z.coerce.string().optional(),
    state: z.coerce.string().optional(),
    zip: z.coerce.string().optional(),
    neighborhood: z.coerce.string().optional(),
    google_maps_url: z.url().optional(),
})

export const itemSchema = z.object({
    name: z.string(),
    public: z.boolean().optional(),
    description: z.string().optional(),
    tags: z.array(tagEnum).optional(),
    links: z.array(z.object({ label: z.string(), url: z.url() })).optional(),
    notes: z.string().optional(),
    location: locationSchema.optional(),
    recurring_events: z.array(recurringEventSchema).optional(),
})

// Directory pages: structured yaml, no markdown body
export const directoryPageSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    public: z.boolean().default(true),
    items: z.array(itemSchema).optional(),
})

export const collections = {
    directory: defineCollection({
        loader: glob({ pattern: '*.yaml', base: './src/content/pages' }),
        schema: directoryPageSchema,
    }),
}
