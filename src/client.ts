/**
 * NeXifyAI OpenAI Client
 * Handles all OpenAI API interactions for the autonomous agent
 */

import OpenAI from 'openai'
import { NEXIFYAI_CONFIG } from './config'
import type {
  ChatMessage,
  VectorSearchResult,
  VectorStoreSyncStatus,
  OpenAIToolCall,
} from './types'

// Initialize OpenAI client
let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!NEXIFYAI_CONFIG.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    openaiClient = new OpenAI({
      apiKey: NEXIFYAI_CONFIG.apiKey,
      organization: NEXIFYAI_CONFIG.organizationId || undefined,
    })
  }
  return openaiClient
}

/**
 * Create a new thread for conversation
 */
export async function createThread(): Promise<string> {
  const client = getOpenAIClient()
  const thread = await client.beta.threads.create()
  return thread.id
}

/**
 * Add a message to a thread
 */
export async function addMessage(
  threadId: string,
  content: string,
  role: 'user' | 'assistant' = 'user'
): Promise<ChatMessage> {
  const client = getOpenAIClient()

  const message = await client.beta.threads.messages.create(threadId, {
    role,
    content,
  })

  const textContent = message.content[0]
  const messageContent =
    textContent && textContent.type === 'text' ? textContent.text.value : ''

  return {
    id: message.id,
    role: message.role,
    content: messageContent,
    timestamp: new Date(message.created_at * 1000),
  }
}

/**
 * Run the assistant on a thread
 */
export async function runAssistant(
  threadId: string,
  instructions?: string
): Promise<string> {
  const client = getOpenAIClient()

  const run = await client.beta.threads.runs.create(threadId, {
    assistant_id: NEXIFYAI_CONFIG.assistantId,
    additional_instructions: instructions,
  })

  return run.id
}

/**
 * Poll for run completion
 */
export async function waitForRunCompletion(
  threadId: string,
  runId: string,
  onToolCall?: (_toolCalls: OpenAIToolCall[]) => Promise<Record<string, string>>
): Promise<OpenAI.Beta.Threads.Runs.Run> {
  const client = getOpenAIClient()
  const startTime = Date.now()

  while (Date.now() - startTime < NEXIFYAI_CONFIG.timeoutMs) {
    const run = await client.beta.threads.runs.retrieve(threadId, runId)

    switch (run.status) {
      case 'completed':
        return run

      case 'failed':
        throw new Error(
          `Run failed: ${run.last_error?.message || 'Unknown error'}`
        )

      case 'cancelled':
        throw new Error('Run was cancelled')

      case 'expired':
        throw new Error('Run expired')

      case 'requires_action':
        if (run.required_action?.type === 'submit_tool_outputs' && onToolCall) {
          const toolCalls = run.required_action.submit_tool_outputs
            .tool_calls as OpenAIToolCall[]
          const results = await onToolCall(toolCalls)

          const toolOutputs = toolCalls.map((tc) => ({
            tool_call_id: tc.id,
            output: results[tc.id] || 'Tool execution completed',
          }))

          await client.beta.threads.runs.submitToolOutputs(threadId, runId, {
            tool_outputs: toolOutputs,
          })
        }
        break

      case 'queued':
      case 'in_progress':
      default:
        // Continue polling
        break
    }

    await new Promise((resolve) =>
      setTimeout(resolve, NEXIFYAI_CONFIG.pollIntervalMs)
    )
  }

  throw new Error('Run timed out')
}

/**
 * Get messages from a thread
 */
export async function getThreadMessages(
  threadId: string,
  limit: number = 100
): Promise<ChatMessage[]> {
  const client = getOpenAIClient()

  const messages = await client.beta.threads.messages.list(threadId, {
    limit,
    order: 'asc',
  })

  return messages.data.map((m) => {
    const textContent = m.content[0]
    const content =
      textContent && textContent.type === 'text' ? textContent.text.value : ''

    return {
      id: m.id,
      role: m.role,
      content,
      timestamp: new Date(m.created_at * 1000),
    }
  })
}

/**
 * Search the vector store (simplified - returns context from assistant)
 */
export async function searchVectorStore(
  query: string,
  topK: number = 5
): Promise<VectorSearchResult[]> {
  // For now, return empty - vector search is handled by the assistant with file_search tool
  // This can be extended to use the Responses API with file_search in the future
  console.log(`Vector search for: ${query} (topK: ${topK})`)
  return []
}

/**
 * Get vector store sync status
 */
export async function getVectorStoreSyncStatus(): Promise<VectorStoreSyncStatus> {
  const client = getOpenAIClient()

  try {
    if (!NEXIFYAI_CONFIG.vectorStoreId) {
      return {
        lastSyncAt: new Date(),
        filesCount: 0,
        chunksCount: 0,
        status: 'error',
        errors: ['Vector store ID not configured'],
      }
    }

    // Use vectorStores API (not beta)
    const vectorStore = await client.vectorStores.retrieve(
      NEXIFYAI_CONFIG.vectorStoreId
    )

    return {
      lastSyncAt: new Date(),
      filesCount: vectorStore.file_counts.completed,
      chunksCount: vectorStore.usage_bytes,
      status: vectorStore.status === 'completed' ? 'synced' : 'syncing',
    }
  } catch (error) {
    return {
      lastSyncAt: new Date(),
      filesCount: 0,
      chunksCount: 0,
      status: 'error',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}

/**
 * Delete a thread
 */
export async function deleteThread(threadId: string): Promise<void> {
  const client = getOpenAIClient()
  await client.beta.threads.del(threadId)
}

/**
 * Upload a file to OpenAI for the assistant
 */
export async function uploadFile(
  content: string,
  filename: string
): Promise<string> {
  const client = getOpenAIClient()

  const file = await client.files.create({
    file: new File([content], filename, { type: 'text/plain' }),
    purpose: 'assistants',
  })

  return file.id
}

/**
 * Add file to vector store
 */
export async function addFileToVectorStore(fileId: string): Promise<void> {
  const client = getOpenAIClient()

  if (!NEXIFYAI_CONFIG.vectorStoreId) {
    throw new Error('Vector store ID not configured')
  }

  // Use vectorStores API (not beta)
  await client.vectorStores.files.create(NEXIFYAI_CONFIG.vectorStoreId, {
    file_id: fileId,
  })
}

/**
 * List files in vector store
 */
export async function listVectorStoreFiles(): Promise<
  Array<{ id: string; status: string }>
> {
  const client = getOpenAIClient()

  if (!NEXIFYAI_CONFIG.vectorStoreId) {
    return []
  }

  // Use vectorStores API (not beta)
  const files = await client.vectorStores.files.list(
    NEXIFYAI_CONFIG.vectorStoreId
  )

  return files.data.map((f: { id: string; status: string }) => ({
    id: f.id,
    status: f.status,
  }))
}
