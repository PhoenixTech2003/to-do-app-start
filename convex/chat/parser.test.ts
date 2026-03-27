import { describe, expect, it } from 'vitest'
import { parseDateInput, parseIncomingMessage, parsePriority } from './parser'

const NOW = new Date('2026-03-27T10:00:00Z')

describe('parsePriority', () => {
  it('normalizes supported aliases', () => {
    expect(parsePriority('h')).toBe('high')
    expect(parsePriority('!!')).toBe('medium')
    expect(parsePriority('l')).toBe('low')
  })
})

describe('parseDateInput', () => {
  it('handles relative and weekday dates', () => {
    expect(parseDateInput('tomorrow', NOW)).toBe('2026-03-28')
    expect(parseDateInput('next week', NOW)).toBe('2026-04-03')
    expect(parseDateInput('monday', NOW)).toBe('2026-03-30')
    expect(parseDateInput('in 2 weeks', NOW)).toBe('2026-04-10')
  })
})

describe('parseIncomingMessage', () => {
  it('parses slash todo creation commands', () => {
    expect(
      parseIncomingMessage('/ta "Finish math paper" --due=tomorrow --p=high', {
        now: NOW,
        platform: 'telegram',
      }),
    ).toEqual({
      action: 'todo.add',
      name: 'Finish math paper',
      due: '2026-03-28',
      priority: 'high',
      listName: undefined,
      workspaceName: undefined,
      confidence: 1,
    })
  })

  it('parses context commands with aliases', () => {
    expect(
      parseIncomingMessage('/context workspace School', {
        now: NOW,
        platform: 'whatsapp',
      }),
    ).toEqual({
      action: 'context.set_workspace',
      workspaceName: 'School',
      confidence: 1,
    })
  })

  it('falls back to deterministic natural-language intent when possible', () => {
    expect(
      parseIncomingMessage('remind me to call mum on friday', {
        now: NOW,
        platform: 'whatsapp',
      }),
    ).toEqual({
      action: 'todo.add',
      name: 'call mum',
      due: '2026-04-03',
      priority: null,
      confidence: 0.78,
      clarification: undefined,
    })
  })

  it('returns unknown for obvious nonsense', () => {
    expect(
      parseIncomingMessage('blah blah nonsense', {
        now: NOW,
        platform: 'telegram',
      }),
    ).toEqual({
      action: 'unknown',
      message: "I didn't understand that. Try /help to see what I can do.",
      confidence: 0,
    })
  })
})
