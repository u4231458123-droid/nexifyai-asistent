/**
 * NeXifyAI - Autonomous AI Agent
 *
 * Main entry point for the NeXifyAI agent system.
 *
 * @module @nexifyai/assistant
 */

// Main agent interface
export {
  initializeSession,
  getSession,
  processMessage,
  executeTask,
  getSessionSummary,
  endSession,
  chat,
  runTask,
  getLearningReport,
  NEXIFYAI_CONFIG,
} from './agent'

// Types
export type {
  Task,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  TaskContext,
  TaskResult,
  ChatMessage,
  AgentSession,
  AgentConfig,
  AgentTool,
  VectorSearchResult,
  VectorStoreSyncStatus,
  LearningEntry,
  AgentMetrics,
  ToolCall,
  OpenAIToolCall,
} from './types'

// Task management
export {
  createTask,
  getTask,
  updateTask,
  setTaskStatus,
  completeTask,
  listTasks,
  deleteTask,
  getTaskStats,
  formatTask,
  formatTaskList,
  exportTasks,
  importTasks,
  clearAllTasks,
  getPendingReadyTasks,
  getTaskTree,
  addTaskContext,
} from './task-manager'

// Learning & metrics
export {
  recordLearning,
  findSimilarLearnings,
  getSuccessfulPatterns,
  getImprovementSuggestions,
  getLearningsSummary,
  getMetrics,
  updateMetrics,
  exportLearnings,
  importLearnings,
  clearLearnings,
  addTokensUsed,
  recordCompletionTime,
  generateLearningReport,
} from './learning-manager'

// OpenAI client functions
export {
  getOpenAIClient,
  createThread,
  addMessage,
  runAssistant,
  waitForRunCompletion,
  getThreadMessages,
  searchVectorStore,
  getVectorStoreSyncStatus,
  deleteThread,
  uploadFile,
  addFileToVectorStore,
  listVectorStoreFiles,
} from './client'

// Configuration
export {
  buildAgentConfig,
  validateConfig,
  AGENT_TOOLS,
  NEXIFYAI_SYSTEM_PROMPT,
} from './config'
