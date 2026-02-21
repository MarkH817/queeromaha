import { integer, pgTable, varchar, text, boolean } from 'drizzle-orm/pg-core';

export const posts = pgTable('posts', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: varchar({ length: 255 }).notNull(),
    content: text().notNull().default('')
});

// Local queer makers
export const makers = pgTable('makers', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    humanName: varchar('human_name', { length: 100 }).notNull(), // required
    bizName: varchar('biz_name', { length: 150 }), // optional
    email: varchar('email', { length: 255 }).notNull(), // required
    instagram: varchar({ length: 255 }),
    facebook: varchar({ length: 255 }),
    website: varchar({ length: 255 }),
    description: varchar({ length: 280 }), // optional
    approved: boolean().notNull().default(false)
});
