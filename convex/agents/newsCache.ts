import { v } from 'convex/values'
import { internalMutation, internalQuery } from '../_generated/server'

const malawi24ArticleValidator = v.object({
  title: v.string(),
  author: v.string(),
  content: v.string(),
  headlineImage: v.string(),
  articleUrl: v.string(),
})

export const upsertMalawi24Articles = internalMutation({
  args: {
    source: v.string(),
    archiveYear: v.number(),
    archiveMonth: v.number(),
    archiveDay: v.number(),
    scrapedAt: v.number(),
    updateSourceState: v.boolean(),
    scheduledWindow: v.optional(v.string()),
    articles: v.array(malawi24ArticleValidator),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    for (const article of args.articles) {
      const existing = await ctx.db
        .query('newsArticles')
        .withIndex('by_articleUrl', (q) => q.eq('articleUrl', article.articleUrl))
        .first()

      const patch = {
        source: args.source,
        articleUrl: article.articleUrl,
        title: article.title,
        author: article.author,
        headlineImage: article.headlineImage,
        content: article.content,
        archiveYear: args.archiveYear,
        archiveMonth: args.archiveMonth,
        archiveDay: args.archiveDay,
        scrapedAt: args.scrapedAt,
        lastUpdatedAt: now,
      }

      if (existing) {
        await ctx.db.patch(existing._id, patch)
      } else {
        await ctx.db.insert('newsArticles', patch)
      }
    }

    if (!args.updateSourceState) {
      return
    }

    const existingState = await ctx.db
      .query('newsSourceState')
      .withIndex('by_source', (q) => q.eq('source', args.source))
      .first()

    const statePatch = {
      source: args.source,
      lastSuccessfulScrapeAt: args.scrapedAt,
      lastArchiveYear: args.archiveYear,
      lastArchiveMonth: args.archiveMonth,
      lastArchiveDay: args.archiveDay,
      lastScheduledWindow: args.scheduledWindow,
    }

    if (existingState) {
      await ctx.db.patch(existingState._id, statePatch)
      return
    }

    await ctx.db.insert('newsSourceState', statePatch)
  },
})

export const getLatestMalawi24CachedNews = internalQuery({
  args: {
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query('newsSourceState')
      .withIndex('by_source', (q) => q.eq('source', args.source))
      .first()

    if (!state) {
      return null
    }

    const articles = await ctx.db
      .query('newsArticles')
      .withIndex('by_archiveDate', (q) =>
        q
          .eq('source', args.source)
          .eq('archiveYear', state.lastArchiveYear)
          .eq('archiveMonth', state.lastArchiveMonth)
          .eq('archiveDay', state.lastArchiveDay),
      )
      .collect()

    return {
      source: args.source,
      count: articles.length,
      articles: articles.map((article) => ({
        title: article.title,
        author: article.author,
        content: article.content,
        headline_image: article.headlineImage,
        article_url: article.articleUrl,
        url: article.articleUrl,
      })),
    }
  },
})
