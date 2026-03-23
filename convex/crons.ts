import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.cron(
  'refresh-malawi24-news-5am-cat',
  '0 3 * * *',
  internal.agents.actions.refreshLatestMalawi24NewsCache,
  {
    scheduledWindow: '05:00 CAT',
  },
)

crons.cron(
  'refresh-malawi24-news-12pm-cat',
  '0 10 * * *',
  internal.agents.actions.refreshLatestMalawi24NewsCache,
  {
    scheduledWindow: '12:00 CAT',
  },
)

crons.cron(
  'refresh-malawi24-news-6pm-cat',
  '0 16 * * *',
  internal.agents.actions.refreshLatestMalawi24NewsCache,
  {
    scheduledWindow: '18:00 CAT',
  },
)

export default crons
