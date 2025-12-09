/**
 * NeXifyAI Task Manager
 * Handles task creation, tracking, and execution
 */

import type {
  Task,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  TaskContext,
  TaskResult,
} from './types'

// In-memory task store (can be replaced with persistent storage)
const tasks: Map<string, Task> = new Map()

/**
 * Generate unique task ID
 */
function generateTaskId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `task_${timestamp}_${random}`
}

/**
 * Create a new task
 */
export function createTask(params: {
  title: string
  description: string
  priority?: TaskPriority
  category?: TaskCategory
  parentTaskId?: string
  dependencies?: string[]
}): Task {
  const task: Task = {
    id: generateTaskId(),
    title: params.title,
    description: params.description,
    status: 'pending',
    priority: params.priority || 'medium',
    category: params.category || 'development',
    createdAt: new Date(),
    updatedAt: new Date(),
    parentTaskId: params.parentTaskId,
    dependencies: params.dependencies,
  }

  tasks.set(task.id, task)

  // If this is a subtask, add it to parent
  if (params.parentTaskId) {
    const parent = tasks.get(params.parentTaskId)
    if (parent) {
      parent.subtasks = parent.subtasks || []
      parent.subtasks.push(task)
      parent.updatedAt = new Date()
    }
  }

  return task
}

/**
 * Get a task by ID
 */
export function getTask(taskId: string): Task | undefined {
  return tasks.get(taskId)
}

/**
 * Update a task
 */
export function updateTask(
  taskId: string,
  updates: Partial<
    Pick<
      Task,
      | 'title'
      | 'description'
      | 'status'
      | 'priority'
      | 'category'
      | 'context'
      | 'result'
    >
  >
): Task | undefined {
  const task = tasks.get(taskId)
  if (!task) return undefined

  Object.assign(task, updates, { updatedAt: new Date() })

  if (updates.status === 'completed') {
    task.completedAt = new Date()
  }

  return task
}

/**
 * Set task status
 */
export function setTaskStatus(
  taskId: string,
  status: TaskStatus
): Task | undefined {
  return updateTask(taskId, { status })
}

/**
 * Add context to a task
 */
export function addTaskContext(
  taskId: string,
  context: Partial<TaskContext>
): Task | undefined {
  const task = tasks.get(taskId)
  if (!task) return undefined

  task.context = {
    ...task.context,
    ...context,
    relevantFiles: [
      ...(task.context?.relevantFiles || []),
      ...(context.relevantFiles || []),
    ],
    relevantDocs: [
      ...(task.context?.relevantDocs || []),
      ...(context.relevantDocs || []),
    ],
    codebasePatterns: [
      ...(task.context?.codebasePatterns || []),
      ...(context.codebasePatterns || []),
    ],
  }
  task.updatedAt = new Date()

  return task
}

/**
 * Complete a task with result
 */
export function completeTask(
  taskId: string,
  result: TaskResult
): Task | undefined {
  const task = tasks.get(taskId)
  if (!task) return undefined

  task.status = result.success ? 'completed' : 'failed'
  task.completedAt = new Date()
  task.result = result
  task.updatedAt = new Date()

  return task
}

/**
 * List tasks with optional filtering
 */
export function listTasks(filters?: {
  status?: TaskStatus | 'all'
  category?: TaskCategory
  priority?: TaskPriority
  limit?: number
}): Task[] {
  let result = Array.from(tasks.values())

  // Filter out subtasks (they're included in parent)
  result = result.filter((t) => !t.parentTaskId)

  if (filters?.status && filters.status !== 'all') {
    result = result.filter((t) => t.status === filters.status)
  }

  if (filters?.category) {
    result = result.filter((t) => t.category === filters.category)
  }

  if (filters?.priority) {
    result = result.filter((t) => t.priority === filters.priority)
  }

  // Sort by priority and creation date
  const priorityOrder: Record<TaskPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  result.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  if (filters?.limit) {
    result = result.slice(0, filters.limit)
  }

  return result
}

/**
 * Get task tree (with subtasks)
 */
export function getTaskTree(taskId: string): Task | undefined {
  return tasks.get(taskId)
}

/**
 * Delete a task
 */
export function deleteTask(taskId: string): boolean {
  const task = tasks.get(taskId)
  if (!task) return false

  // Delete subtasks first
  if (task.subtasks) {
    for (const subtask of task.subtasks) {
      tasks.delete(subtask.id)
    }
  }

  return tasks.delete(taskId)
}

/**
 * Get pending tasks ready for execution
 * (no pending dependencies)
 */
export function getPendingReadyTasks(): Task[] {
  return listTasks({ status: 'pending' }).filter((task) => {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true
    }

    // Check if all dependencies are completed
    return task.dependencies.every((depId) => {
      const dep = tasks.get(depId)
      return dep?.status === 'completed'
    })
  })
}

/**
 * Get task statistics
 */
export function getTaskStats(): {
  total: number
  pending: number
  inProgress: number
  completed: number
  failed: number
} {
  const allTasks = Array.from(tasks.values())

  return {
    total: allTasks.length,
    pending: allTasks.filter((t) => t.status === 'pending').length,
    inProgress: allTasks.filter((t) => t.status === 'in-progress').length,
    completed: allTasks.filter((t) => t.status === 'completed').length,
    failed: allTasks.filter((t) => t.status === 'failed').length,
  }
}

/**
 * Clear all tasks
 */
export function clearAllTasks(): void {
  tasks.clear()
}

/**
 * Export tasks as JSON
 */
export function exportTasks(): string {
  const taskArray = Array.from(tasks.values())
  return JSON.stringify(taskArray, null, 2)
}

/**
 * Import tasks from JSON
 */
export function importTasks(json: string): number {
  try {
    const taskArray: Task[] = JSON.parse(json)
    let imported = 0

    for (const task of taskArray) {
      // Convert date strings back to Date objects
      task.createdAt = new Date(task.createdAt)
      task.updatedAt = new Date(task.updatedAt)
      if (task.completedAt) {
        task.completedAt = new Date(task.completedAt)
      }

      tasks.set(task.id, task)
      imported++
    }

    return imported
  } catch {
    return 0
  }
}

/**
 * Format task for display
 */
export function formatTask(task: Task): string {
  const statusEmoji: Record<TaskStatus, string> = {
    pending: '⏳',
    'in-progress': '🔄',
    completed: '✅',
    failed: '❌',
    cancelled: '🚫',
  }

  const priorityEmoji: Record<TaskPriority, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  }

  let output = `${statusEmoji[task.status]} **${task.title}** ${
    priorityEmoji[task.priority]
  }\n`
  output += `   ID: ${task.id}\n`
  output += `   Category: ${task.category}\n`
  output += `   Description: ${task.description.slice(0, 100)}${
    task.description.length > 100 ? '...' : ''
  }\n`

  if (task.subtasks && task.subtasks.length > 0) {
    output += `   Subtasks: ${task.subtasks.length}\n`
  }

  if (task.result) {
    output += `   Result: ${task.result.success ? 'Success' : 'Failed'} - ${
      task.result.summary
    }\n`
  }

  return output
}

/**
 * Format task list for display
 */
export function formatTaskList(taskList: Task[]): string {
  if (taskList.length === 0) {
    return 'Keine Tasks vorhanden.'
  }

  let output = `📋 **Task-Übersicht** (${taskList.length} Tasks)\n\n`

  for (const task of taskList) {
    output += formatTask(task) + '\n'
  }

  return output
}
