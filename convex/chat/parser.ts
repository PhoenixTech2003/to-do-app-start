import {
  addDays,
  addWeeks,
  format,
  getDay,
  isAfter,
  isValid,
  parse,
  startOfDay,
} from 'date-fns'
import type { ChatPlatform, CommandParseOptions, ParsedAction } from './types'

const HELP_ALIASES = new Set(['/help', 'help', 'what can you do'])
const CONTEXT_ALIASES = new Set([
  '/ctx',
  'context',
  "what's my context",
  'whats my context',
])
const TODAY_ALIASES = new Set(['/today', 'today'])
const OVERDUE_ALIASES = new Set(['/overdue', 'overdue'])
const UPCOMING_ALIASES = new Set(['/upcoming', 'upcoming'])

const WEEKDAY_TO_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

const MONTH_INPUTS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
]

function tokenizeArgs(input: string) {
  const matches = input.match(/"([^"]*)"|'([^']*)'|[^\s]+/g) ?? []
  return matches.map((token) => {
    if (
      (token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'"))
    ) {
      return token.slice(1, -1)
    }
    return token
  })
}

function extractFlags(tokens: Array<string>) {
  const positional: Array<string> = []
  const flags = new Map<string, string | true>()

  for (const token of tokens) {
    if (!token.startsWith('--')) {
      positional.push(token)
      continue
    }

    const eqIndex = token.indexOf('=')
    if (eqIndex === -1) {
      flags.set(token.slice(2).toLowerCase(), true)
      continue
    }

    const key = token.slice(2, eqIndex).toLowerCase()
    const value = token.slice(eqIndex + 1)
    flags.set(key, value)
  }

  return { positional, flags }
}

function formatIsoDate(value: Date) {
  return format(startOfDay(value), 'yyyy-MM-dd')
}

export function parsePriority(input?: string | null) {
  if (!input) return null

  switch (input.trim().toLowerCase()) {
    case 'high':
    case 'h':
    case '!':
      return 'high' as const
    case 'medium':
    case 'med':
    case 'm':
    case '!!':
      return 'medium' as const
    case 'low':
    case 'l':
      return 'low' as const
    default:
      return null
  }
}

export function parseDateInput(input: string | null | undefined, now: Date) {
  if (!input) return null

  const value = input.trim().toLowerCase()
  if (!value) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const today = startOfDay(now)
  if (value === 'today') return formatIsoDate(today)
  if (value === 'tomorrow') return formatIsoDate(addDays(today, 1))
  if (value === 'yesterday') return formatIsoDate(addDays(today, -1))
  if (value === 'next week') return formatIsoDate(addWeeks(today, 1))
  if (value === 'next month') {
    const firstOfNextMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      1,
    )
    return formatIsoDate(firstOfNextMonth)
  }

  const relativeMatch = value.match(/^in\s+(\d+)\s+(day|days|week|weeks)$/)
  if (relativeMatch) {
    const amount = Number(relativeMatch[1])
    const unit = relativeMatch[2]
    const date = unit.startsWith('week')
      ? addDays(today, amount * 7)
      : addDays(today, amount)
    return formatIsoDate(date)
  }

  if (value in WEEKDAY_TO_INDEX) {
    const currentDay = getDay(today)
    const targetDay = WEEKDAY_TO_INDEX[value]
    const offset = (targetDay - currentDay + 7) % 7 || 7
    return formatIsoDate(addDays(today, offset))
  }

  const monthPattern = new RegExp(
    `^(${MONTH_INPUTS.join('|')})[a-z]*\\s+(\\d{1,2})$`,
  )
  const monthMatch = value.match(monthPattern)
  if (monthMatch) {
    const monthIndex = MONTH_INPUTS.indexOf(monthMatch[1])
    const day = Number(monthMatch[2])
    let parsed = new Date(today.getFullYear(), monthIndex, day)
    if (!isValid(parsed)) {
      return null
    }
    if (!isAfter(parsed, addDays(today, -1))) {
      parsed = new Date(today.getFullYear() + 1, monthIndex, day)
    }
    return formatIsoDate(parsed)
  }

  const parsed = parse(value, 'MMMM d', today)
  if (isValid(parsed)) {
    let withYear = new Date(
      today.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
    )
    if (!isAfter(withYear, addDays(today, -1))) {
      withYear = new Date(
        today.getFullYear() + 1,
        parsed.getMonth(),
        parsed.getDate(),
      )
    }
    return formatIsoDate(withYear)
  }

  return null
}

function parseCommandTokens(
  rawInput: string,
  platform: ChatPlatform,
  now: Date,
): ParsedAction | null {
  const tokens = tokenizeArgs(rawInput)
  if (!tokens.length) {
    return {
      action: 'unknown',
      message: 'Try /help to see what I can do.',
      confidence: 0,
    }
  }

  const lowered = tokens.map((token) => token.toLowerCase())
  const joinedPair = lowered.slice(0, 2).join(' ')
  const { positional, flags } = extractFlags(
    tokens.slice(
      joinedPair.startsWith('/todo ') ||
        joinedPair.startsWith('/list ') ||
        joinedPair.startsWith('/workspace ') ||
        joinedPair.startsWith('/context ')
        ? 2
        : 1,
    ),
  )

  const primary = lowered[0]
  const command =
    joinedPair === '/todo add' ||
    joinedPair === '/todo list' ||
    joinedPair === '/todo view' ||
    joinedPair === '/todo update' ||
    joinedPair === '/todo complete' ||
    joinedPair === '/todo reopen' ||
    joinedPair === '/todo delete' ||
    joinedPair === '/list add' ||
    joinedPair === '/list list' ||
    joinedPair === '/workspace add' ||
    joinedPair === '/workspace list' ||
    joinedPair === '/context workspace' ||
    joinedPair === '/context list'
      ? joinedPair
      : primary

  if (HELP_ALIASES.has(rawInput.trim().toLowerCase())) {
    return { action: 'help', confidence: 1 }
  }
  if (CONTEXT_ALIASES.has(rawInput.trim().toLowerCase())) {
    return { action: 'context.get', confidence: 1 }
  }
  if (TODAY_ALIASES.has(rawInput.trim().toLowerCase())) {
    return {
      action: 'todo.list',
      filters: { due: formatIsoDate(now), completed: false },
      confidence: 1,
    }
  }
  if (OVERDUE_ALIASES.has(rawInput.trim().toLowerCase())) {
    return { action: 'todo.list_overdue', confidence: 1 }
  }
  if (UPCOMING_ALIASES.has(rawInput.trim().toLowerCase())) {
    return { action: 'todo.list_upcoming', days: 7, confidence: 1 }
  }

  switch (command) {
    case '/link':
      if (platform !== 'telegram') {
        return {
          action: 'unknown',
          message: 'Telegram linking is only available in Telegram.',
          confidence: 1,
        }
      }
      return positional[0]
        ? {
            action: 'integration.link_telegram',
            token: positional[0],
            confidence: 1,
          }
        : {
            action: 'clarify',
            message: 'Use /link <token> to connect your Telegram account.',
            confidence: 0.5,
            clarification: 'Missing Telegram link token.',
          }
    case '/cw':
    case '/context workspace':
      return positional.length
        ? {
            action: 'context.set_workspace',
            workspaceName: positional.join(' '),
            confidence: 1,
          }
        : {
            action: 'clarify',
            message: 'Tell me which workspace to activate.',
            confidence: 0.5,
            clarification: 'Missing workspace name.',
          }
    case '/cl':
    case '/context list':
      return positional.length
        ? {
            action: 'context.set_list',
            listName: positional.join(' '),
            confidence: 1,
          }
        : {
            action: 'clarify',
            message: 'Tell me which list to activate.',
            confidence: 0.5,
            clarification: 'Missing list name.',
          }
    case '/wa':
    case '/workspace add':
      return positional.length
        ? { action: 'workspace.add', name: positional.join(' '), confidence: 1 }
        : {
            action: 'clarify',
            message: 'Tell me the workspace name to create.',
            confidence: 0.5,
            clarification: 'Missing workspace name.',
          }
    case '/wl':
    case '/workspace list':
      return { action: 'workspace.list', confidence: 1 }
    case '/la':
    case '/list add':
      return positional.length
        ? {
            action: 'list.add',
            name: positional.join(' '),
            workspaceName:
              typeof flags.get('workspace') === 'string'
                ? String(flags.get('workspace'))
                : undefined,
            confidence: 1,
          }
        : {
            action: 'clarify',
            message: 'Tell me the list name to create.',
            confidence: 0.5,
            clarification: 'Missing list name.',
          }
    case '/ll':
    case '/list list':
      return {
        action: 'list.list',
        workspaceName:
          typeof flags.get('workspace') === 'string'
            ? String(flags.get('workspace'))
            : undefined,
        confidence: 1,
      }
    case '/ta':
    case '/todo add': {
      const name = positional.join(' ').trim()
      if (!name) {
        return {
          action: 'clarify',
          message: 'Tell me the todo title to add.',
          confidence: 0.5,
          clarification: 'Missing todo name.',
        }
      }
      return {
        action: 'todo.add',
        name,
        due: parseDateInput(String(flags.get('due') ?? ''), now),
        priority: parsePriority(
          typeof flags.get('p') === 'string'
            ? String(flags.get('p'))
            : typeof flags.get('priority') === 'string'
              ? String(flags.get('priority'))
              : undefined,
        ),
        listName:
          typeof flags.get('list') === 'string'
            ? String(flags.get('list'))
            : undefined,
        workspaceName:
          typeof flags.get('workspace') === 'string'
            ? String(flags.get('workspace'))
            : undefined,
        confidence: 1,
      }
    }
    case '/tl':
    case '/todo list':
      return {
        action: 'todo.list',
        filters: {
          due: parseDateInput(
            typeof flags.get('due') === 'string'
              ? String(flags.get('due'))
              : null,
            now,
          ),
          priority: parsePriority(
            typeof flags.get('p') === 'string'
              ? String(flags.get('p'))
              : typeof flags.get('priority') === 'string'
                ? String(flags.get('priority'))
                : undefined,
          ),
          completed:
            typeof flags.get('completed') === 'string'
              ? String(flags.get('completed')).toLowerCase() === 'true'
              : false,
          listName:
            typeof flags.get('list') === 'string'
              ? String(flags.get('list'))
              : undefined,
          workspaceName:
            typeof flags.get('workspace') === 'string'
              ? String(flags.get('workspace'))
              : undefined,
        },
        confidence: 1,
      }
    case '/tv':
    case '/todo view':
      return positional.length
        ? {
            action: 'todo.view',
            reference: positional.join(' '),
            confidence: 1,
          }
        : {
            action: 'clarify',
            message: 'Tell me which todo to show.',
            confidence: 0.5,
            clarification: 'Missing todo reference.',
          }
    case '/done':
    case '/todo complete':
      return positional.length
        ? {
            action: 'todo.complete',
            reference: positional.join(' '),
            confidence: 1,
          }
        : {
            action: 'clarify',
            message: 'Tell me which todo to complete.',
            confidence: 0.5,
            clarification: 'Missing todo reference.',
          }
    case '/reopen':
    case '/todo reopen':
      return positional.length
        ? {
            action: 'todo.reopen',
            reference: positional.join(' '),
            confidence: 1,
          }
        : {
            action: 'clarify',
            message: 'Tell me which todo to reopen.',
            confidence: 0.5,
            clarification: 'Missing todo reference.',
          }
    case '/del':
    case '/todo delete':
      return positional.length
        ? {
            action: 'todo.delete',
            reference: positional.join(' '),
            confidence: 1,
          }
        : {
            action: 'clarify',
            message: 'Tell me which todo to delete.',
            confidence: 0.5,
            clarification: 'Missing todo reference.',
          }
    case '/update':
    case '/todo update': {
      const reference = positional[0]
      if (!reference) {
        return {
          action: 'clarify',
          message: 'Tell me which todo to update.',
          confidence: 0.5,
          clarification: 'Missing todo reference.',
        }
      }
      return {
        action: 'todo.update',
        reference,
        changes: {
          name:
            typeof flags.get('name') === 'string'
              ? String(flags.get('name'))
              : undefined,
          due:
            flags.has('due') && typeof flags.get('due') === 'string'
              ? parseDateInput(String(flags.get('due')), now)
              : undefined,
          priority:
            typeof flags.get('p') === 'string'
              ? parsePriority(String(flags.get('p')))
              : typeof flags.get('priority') === 'string'
                ? parsePriority(String(flags.get('priority')))
                : undefined,
          listName:
            typeof flags.get('list') === 'string'
              ? String(flags.get('list'))
              : undefined,
        },
        confidence: 1,
      }
    }
    default:
      return null
  }
}

function parseHeuristic(rawInput: string, now: Date): ParsedAction {
  const input = rawInput.trim()
  const lower = input.toLowerCase()
  const words = lower.split(/\s+/).filter(Boolean)

  if (HELP_ALIASES.has(lower)) {
    return { action: 'help', confidence: 1 }
  }
  if (CONTEXT_ALIASES.has(lower)) {
    return { action: 'context.get', confidence: 1 }
  }
  if (TODAY_ALIASES.has(lower)) {
    return {
      action: 'todo.list',
      filters: { due: formatIsoDate(now), completed: false },
      confidence: 1,
    }
  }
  if (OVERDUE_ALIASES.has(lower)) {
    return { action: 'todo.list_overdue', confidence: 1 }
  }
  if (UPCOMING_ALIASES.has(lower)) {
    return { action: 'todo.list_upcoming', days: 7, confidence: 1 }
  }

  const doneMatch = input.match(
    /^(?:done|finish|finished|complete|completed)\s+(.+)$/i,
  )
  if (doneMatch) {
    return {
      action: 'todo.complete',
      reference: doneMatch[1].trim(),
      confidence: 0.92,
    }
  }

  const reopenMatch = input.match(/^(?:reopen|undo)\s+(.+)$/i)
  if (reopenMatch) {
    return {
      action: 'todo.reopen',
      reference: reopenMatch[1].trim(),
      confidence: 0.9,
    }
  }

  const deleteMatch = input.match(/^(?:delete|remove)\s+(.+)$/i)
  if (deleteMatch) {
    return {
      action: 'todo.delete',
      reference: deleteMatch[1].trim(),
      confidence: 0.9,
    }
  }

  if (/due this week/i.test(input)) {
    return { action: 'todo.list_upcoming', days: 7, confidence: 0.82 }
  }
  if (/due today/i.test(input)) {
    return {
      action: 'todo.list',
      filters: { due: formatIsoDate(now), completed: false },
      confidence: 0.85,
    }
  }

  const remindMatch = input.match(
    /^(?:remind me to|add (?:a )?(?:todo|task)|create (?:a )?(?:todo|task))\s+(.+)$/i,
  )
  if (remindMatch) {
    const body = remindMatch[1].trim()
    const duePatterns = [
      /\s+(?:on|by)\s+(today|tomorrow|yesterday|next week|next month|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{4}-\d{2}-\d{2}|[a-z]+\s+\d{1,2}|in\s+\d+\s+(?:day|days|week|weeks))$/i,
      /\s+(today|tomorrow|next week|next month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i,
    ]

    let name = body
    let due: string | null = null
    for (const pattern of duePatterns) {
      const match = body.match(pattern)
      if (!match) continue
      due = parseDateInput(match[1], now)
      if (due) {
        name = body.slice(0, match.index).trim()
        break
      }
    }

    return {
      action: 'todo.add',
      name,
      due,
      priority: null,
      confidence: 0.78,
      clarification: name ? undefined : 'I could not tell what todo to add.',
    }
  }

  if (words.length <= 3 && !/[?]/.test(input)) {
    return {
      action: 'unknown',
      message: "I didn't understand that. Try /help to see what I can do.",
      confidence: 0,
    }
  }

  return { action: 'ai_fallback', confidence: 0.1 }
}

export function parseIncomingMessage(
  input: string,
  options: CommandParseOptions,
): ParsedAction {
  const trimmed = input.trim()
  if (!trimmed) {
    return {
      action: 'unknown',
      message: 'Send a command or ask for help with /help.',
      confidence: 0,
    }
  }

  if (trimmed.startsWith('/')) {
    return (
      parseCommandTokens(trimmed, options.platform, options.now) ?? {
        action: 'unknown',
        message:
          "I didn't understand that command. Try /help to see what I can do.",
        confidence: 0,
      }
    )
  }

  return parseHeuristic(trimmed, options.now)
}
