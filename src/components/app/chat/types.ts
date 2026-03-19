export interface ToolPart {
  type: string
  toolCallId: string
  toolName: string
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error'
    | 'approval-requested'
    | 'approval-responded'
    | 'output-denied'
  input: unknown
  output: unknown
  errorText?: string
}

export function isToolPart(part: { type: string }): part is ToolPart {
  return part.type.startsWith('tool-')
}
