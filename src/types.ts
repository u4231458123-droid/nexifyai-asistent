/**
 * NeXifyAI Types - Type definitions for the autonomous AI agent
 */

// Task status enum
export type TaskStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'cancelled'

// Task priority levels
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

// Task categories
export type TaskCategory =
  | 'development'
  | 'bugfix'
  | 'documentation'
  | 'refactoring'
  | 'security'
  | 'performance'
  | 'feature'
  | 'maintenance'
  | 'research'

// Individual task definition
export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  category: TaskCategory
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  assignedTo?: string
  parentTaskId?: string
  subtasks?: Task[]
  dependencies?: string[]
  context?: TaskContext
  result?: TaskResult
}

// Task context for execution
export interface TaskContext {
  relevantFiles: string[]
  relevantDocs: string[]
  codebasePatterns: string[]
  vectorSearchResults?: VectorSearchResult[]
  sessionHistory?: ChatMessage[]
}

// Task execution result
export interface TaskResult {
  success: boolean
  summary: string
  filesModified: string[]
  linesChanged: number
  testsRun?: number
  testsPassed?: number
  errors?: string[]
  warnings?: string[]
  gitCommitHash?: string
}

// Vector search result from OpenAI
export interface VectorSearchResult {
  id: string
  content: string
  score: number
  metadata: {
    source: string
    type: string
    lastUpdated?: string
  }
}

// Chat message structure
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: Date
  metadata?: {
    toolCalls?: ToolCall[]
    tokensUsed?: number
    model?: string
  }
}

// Tool call structure
export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  result?: unknown
}

// Agent session
export interface AgentSession {
  id: string
  threadId: string
  runId?: string
  status: 'active' | 'idle' | 'processing' | 'error'
  createdAt: Date
  lastActivityAt: Date
  tasks: Task[]
  messages: ChatMessage[]
  config: AgentConfig
}

// Agent configuration
export interface AgentConfig {
  assistantId: string
  vectorStoreId: string
  projectId: string
  organizationId: string
  model: string
  temperature: number
  maxTokens: number
  tools: AgentTool[]
  systemPrompt: string
}

// Agent tool definition
export interface AgentTool {
  name: string
  description: string
  parameters: Record<string, unknown>
  enabled: boolean
}

// Sync status for vector store
export interface VectorStoreSyncStatus {
  lastSyncAt: Date
  filesCount: number
  chunksCount: number
  status: 'synced' | 'syncing' | 'error' | 'stale'
  errors?: string[]
}

// Learning entry for self-optimization
export interface LearningEntry {
  id: string
  timestamp: Date
  taskId: string
  pattern: string
  outcome: 'success' | 'failure' | 'partial'
  feedback?: string
  improvement?: string
}

// Agent metrics
export interface AgentMetrics {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  averageCompletionTime: number
  successRate: number
  tokensUsed: number
  lastActiveAt: Date
}

// OpenAI Tool Call Type for compatibility
export interface OpenAIToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}
