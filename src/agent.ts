/**
 * NeXifyAI Agent
 * Main autonomous agent interface
 */

import type { AgentSession, Task, TaskResult, OpenAIToolCall } from './types'
import { buildAgentConfig } from './config'
import {
  createThread,
  addMessage,
  runAssistant,
  waitForRunCompletion,
  getThreadMessages,
  searchVectorStore,
  deleteThread,
} from './client'
import {
  createTask,
  updateTask,
  listTasks,
  completeTask,
  getTaskStats,
  formatTaskList,
  setTaskStatus,
} from './task-manager'
import {
  recordLearning,
  findSimilarLearnings,
  getMetrics,
  addTokensUsed,
  recordCompletionTime,
  generateLearningReport,
} from './learning-manager'

// Active session store
let activeSession: AgentSession | null = null

/**
 * Initialize a new agent session
 */
export async function initializeSession(): Promise<AgentSession> {
  const threadId = await createThread()
  const config = buildAgentConfig()

  activeSession = {
    id: `session_${Date.now().toString(36)}`,
    threadId,
    status: 'active',
    createdAt: new Date(),
    lastActivityAt: new Date(),
    tasks: [],
    messages: [],
    config,
  }

  return activeSession
}

/**
 * Get current session or create new one
 */
export async function getSession(): Promise<AgentSession> {
  if (!activeSession) {
    return initializeSession()
  }
  return activeSession
}

/**
 * Process a user message
 */
export async function processMessage(userMessage: string): Promise<string> {
  const session = await getSession()
  const startTime = Date.now()

  // Add user message to thread
  const userMsg = await addMessage(session.threadId, userMessage)
  session.messages.push(userMsg)
  session.lastActivityAt = new Date()
  session.status = 'processing'

  try {
    // Search for relevant context in vector store
    const context = await searchVectorStore(userMessage, 5)

    // Build additional instructions with context
    let additionalInstructions = ''
    if (context.length > 0) {
      additionalInstructions = `\n\nRelevante Dokumente gefunden:\n${context
        .map((c) => `- ${c.metadata.source}`)
        .join('\n')}`
    }

    // Check for similar past learnings
    const similarLearnings = findSimilarLearnings(userMessage, 3)
    if (similarLearnings.length > 0) {
      additionalInstructions += `\n\nRelevante frühere Learnings:\n`
      for (const learning of similarLearnings) {
        additionalInstructions += `- ${learning.pattern} (${learning.outcome})\n`
        if (learning.improvement) {
          additionalInstructions += `  → ${learning.improvement}\n`
        }
      }
    }

    // Run assistant
    const runId = await runAssistant(session.threadId, additionalInstructions)
    session.runId = runId

    // Wait for completion with tool call handling
    await waitForRunCompletion(session.threadId, runId, async (toolCalls) => {
      return handleToolCalls(toolCalls, session)
    })

    // Get response
    const messages = await getThreadMessages(session.threadId, 1)
    const response = messages[messages.length - 1]

    if (response) {
      session.messages.push(response)

      // Track metrics
      addTokensUsed(response.content.length / 4) // Approximate tokens
      recordCompletionTime(Date.now() - startTime)

      session.status = 'active'
      return response.content
    }

    session.status = 'active'
    return 'Keine Antwort erhalten.'
  } catch (error) {
    session.status = 'error'
    const errorMessage =
      error instanceof Error ? error.message : 'Unbekannter Fehler'

    // Record learning about the error
    recordLearning({
      taskId: 'error',
      pattern: `Fehler bei Verarbeitung: ${userMessage.slice(0, 50)}`,
      outcome: 'failure',
      feedback: errorMessage,
      improvement: 'Bessere Fehlerbehandlung für diese Art von Anfrage',
    })

    return `❌ Fehler bei der Verarbeitung: ${errorMessage}`
  }
}

/**
 * Handle tool calls from the assistant
 */
async function handleToolCalls(
  toolCalls: OpenAIToolCall[],
  session: AgentSession
): Promise<Record<string, string>> {
  const results: Record<string, string> = {}

  for (const toolCall of toolCalls) {
    const { id, function: fn } = toolCall
    const args = JSON.parse(fn.arguments)

    try {
      let result: string

      switch (fn.name) {
        case 'task_create': {
          const task = createTask({
            title: args.title,
            description: args.description,
            priority: args.priority,
            category: args.category,
          })
          session.tasks.push(task)
          result = `Task erstellt: ${task.id} - ${task.title}`
          break
        }

        case 'task_update': {
          const updated = updateTask(args.taskId, {
            status: args.status,
            priority: args.priority,
            description: args.description,
          })
          result = updated
            ? `Task aktualisiert: ${updated.id}`
            : `Task nicht gefunden: ${args.taskId}`
          break
        }

        case 'task_list': {
          const tasks = listTasks({
            status: args.status,
            category: args.category,
            limit: args.limit,
          })
          result = formatTaskList(tasks)
          break
        }

        case 'vector_store_search':
        case 'documentation_search': {
          const searchResults = await searchVectorStore(
            args.query,
            args.topK || 5
          )
          result =
            searchResults.length > 0
              ? `Gefunden:\n${searchResults
                  .map(
                    (r) =>
                      `- ${r.metadata.source}: ${r.content.slice(0, 100)}...`
                  )
                  .join('\n')}`
              : 'Keine relevanten Dokumente gefunden.'
          break
        }

        case 'codebase_search': {
          result =
            'Das Tool "codebase_search" ist in @nexifyai/assistant als Schnittstelle definiert und erfordert eine IDE- oder CI-Umgebung mit eigenem Code-Suchservice (z.B. Repomax). In dieser Laufzeitumgebung steht keine direkte Codebase-Suche zur Verfügung.'
          break
        }

        case 'sync_vector_store': {
          result =
            'Das Tool "sync_vector_store" triggert in der Regel eine externe Sync-Pipeline (z.B. Repomax → OpenAI Vector Store). Bitte führe den entsprechenden CI-/Sync-Job in deiner Umgebung aus.'
          break
        }

        case 'learning_record': {
          const learning = recordLearning({
            taskId: session.tasks[session.tasks.length - 1]?.id || 'unknown',
            pattern: args.pattern,
            outcome: args.outcome,
            improvement: args.improvement,
          })
          result = `Learning gespeichert: ${learning.id}`
          break
        }

        default:
          result = `Tool nicht implementiert oder in dieser Laufzeitumgebung nicht verfügbar: ${fn.name}`
      }

      results[id] = result
    } catch (error) {
      results[id] = `Fehler: ${
        error instanceof Error ? error.message : 'Unbekannt'
      }`
    }
  }

  return results
}

/**
 * Execute a specific task
 */
export async function executeTask(taskId: string): Promise<TaskResult> {
  const session = await getSession()
  const task = session.tasks.find((t) => t.id === taskId)

  if (!task) {
    return {
      success: false,
      summary: `Task nicht gefunden: ${taskId}`,
      filesModified: [],
      linesChanged: 0,
      errors: [`Task ${taskId} existiert nicht`],
    }
  }

  const startTime = Date.now()
  setTaskStatus(taskId, 'in-progress')

  try {
    // Process the task through the AI
    const response = await processMessage(
      `Führe diesen Task aus:\n\nTitle: ${task.title}\nDescription: ${task.description}\nCategory: ${task.category}\nPriority: ${task.priority}`
    )

    const result: TaskResult = {
      success: true,
      summary: response.slice(0, 500),
      filesModified: [],
      linesChanged: 0,
    }

    completeTask(taskId, result)
    recordCompletionTime(Date.now() - startTime)

    // Record learning
    recordLearning({
      taskId,
      pattern: `Task ${task.category}: ${task.title}`,
      outcome: 'success',
      improvement: 'Pattern für ähnliche Tasks verwenden',
    })

    return result
  } catch (error) {
    const result: TaskResult = {
      success: false,
      summary: error instanceof Error ? error.message : 'Task fehlgeschlagen',
      filesModified: [],
      linesChanged: 0,
      errors: [error instanceof Error ? error.message : 'Unbekannter Fehler'],
    }

    completeTask(taskId, result)

    recordLearning({
      taskId,
      pattern: `Fehler bei Task ${task.category}: ${task.title}`,
      outcome: 'failure',
      feedback: result.summary,
    })

    return result
  }
}

/**
 * Get session summary
 */
export function getSessionSummary(): string {
  if (!activeSession) {
    return 'Keine aktive Session.'
  }

  const taskStats = getTaskStats()
  const agentMetrics = getMetrics()

  let summary = `# NeXifyAI Session Summary\n\n`
  summary += `**Session ID:** ${activeSession.id}\n`
  summary += `**Status:** ${activeSession.status}\n`
  summary += `**Erstellt:** ${activeSession.createdAt.toLocaleString(
    'de-DE'
  )}\n`
  summary += `**Letzte Aktivität:** ${activeSession.lastActivityAt.toLocaleString(
    'de-DE'
  )}\n\n`

  summary += `## Tasks\n`
  summary += `- Gesamt: ${taskStats.total}\n`
  summary += `- Ausstehend: ${taskStats.pending}\n`
  summary += `- In Bearbeitung: ${taskStats.inProgress}\n`
  summary += `- Abgeschlossen: ${taskStats.completed}\n`
  summary += `- Fehlgeschlagen: ${taskStats.failed}\n\n`

  summary += `## Metriken\n`
  summary += `- Erfolgsrate: ${(agentMetrics.successRate * 100).toFixed(1)}%\n`
  summary += `- Tokens verwendet: ${agentMetrics.tokensUsed.toLocaleString()}\n`
  summary += `- Nachrichten: ${activeSession.messages.length}\n`

  return summary
}

/**
 * End current session
 */
export async function endSession(): Promise<void> {
  if (activeSession) {
    try {
      await deleteThread(activeSession.threadId)
    } catch {
      // Ignore cleanup errors
    }
    activeSession = null
  }
}

/**
 * Quick chat - simplified interface
 */
export async function chat(message: string): Promise<string> {
  return processMessage(message)
}

/**
 * Create and execute a task in one step
 */
export async function runTask(
  title: string,
  description: string,
  options?: {
    priority?: 'low' | 'medium' | 'high' | 'critical'
    category?: string
  }
): Promise<TaskResult> {
  const task = createTask({
    title,
    description,
    priority: options?.priority || 'medium',
    category: (options?.category as Task['category']) || 'development',
  })

  const session = await getSession()
  session.tasks.push(task)

  return executeTask(task.id)
}

/**
 * Get learning report
 */
export function getLearningReport(): string {
  return generateLearningReport()
}

// Export configuration
export { NEXIFYAI_CONFIG } from './config'
