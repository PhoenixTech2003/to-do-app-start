import { mistral } from '@ai-sdk/mistral'
import { ToolLoopAgent } from 'ai'
import { systemPrompt } from './prompts'
import type { ToolSet } from 'ai'

export const T = function ({
  tools,
  integrationType,
}: {
  tools: ToolSet
  integrationType: string
}) {
  return new ToolLoopAgent({
    model: mistral('mistral-medium-latest'),
    instructions: systemPrompt(integrationType),
    tools,
  })
}
