import { describe, it, expect, beforeEach } from 'vitest'
import {
  createTask,
  listTasks,
  getTaskStats,
  clearAllTasks,
  setTaskStatus,
} from './task-manager'

describe('task-manager', () => {
  beforeEach(() => {
    clearAllTasks()
  })

  it('creates and lists tasks', () => {
    const task = createTask({
      title: 'Test-Task',
      description: 'Beschreibung',
    })

    const tasks = listTasks()

    expect(tasks).toHaveLength(1)
    expect(tasks[0].id).toBe(task.id)
    expect(tasks[0].status).toBe('pending')
  })

  it('updates task status and statistics', () => {
    const task = createTask({
      title: 'Status-Test',
      description: 'Status ändern',
    })

    setTaskStatus(task.id, 'completed')

    const stats = getTaskStats()

    expect(stats.total).toBe(1)
    expect(stats.completed).toBe(1)
    expect(stats.failed).toBe(0)
  })

  it('respects list filters', () => {
    const t1 = createTask({
      title: 'High-Priority',
      description: 'security task',
      priority: 'high',
    })
    const t2 = createTask({
      title: 'Low-Priority',
      description: 'cleanup',
      priority: 'low',
    })

    setTaskStatus(t1.id, 'completed')

    const completed = listTasks({ status: 'completed' })
    const lowPriority = listTasks({ priority: 'low' })

    expect(completed).toHaveLength(1)
    expect(completed[0].id).toBe(t1.id)

    expect(lowPriority).toHaveLength(1)
    expect(lowPriority[0].id).toBe(t2.id)
  })
})

