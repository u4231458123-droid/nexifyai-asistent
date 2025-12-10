import { describe, it, expect, beforeEach } from 'vitest'
import {
  recordLearning,
  getLearningsSummary,
  getMetrics,
  clearLearnings,
  importLearnings,
} from './learning-manager'

describe('learning-manager', () => {
  beforeEach(() => {
    // Learnings und Metriken auf definierten Ausgangszustand zurücksetzen
    clearLearnings()
    importLearnings(
      JSON.stringify({
        learnings: [],
        metrics: {
          totalTasks: 0,
          completedTasks: 0,
          failedTasks: 0,
          averageCompletionTime: 0,
          successRate: 0,
          tokensUsed: 0,
          lastActiveAt: new Date().toISOString(),
        },
      })
    )
  })

  it('records learnings and updates metrics', () => {
    recordLearning({
      taskId: 'task-1',
      pattern: 'API Security Fix',
      outcome: 'success',
      improvement: 'Pattern für zukünftige Security-Tasks wiederverwenden',
    })

    const summary = getLearningsSummary()
    const metrics = getMetrics()

    expect(summary.total).toBe(1)
    expect(summary.successful).toBe(1)
    expect(summary.failed).toBe(0)
    expect(metrics.totalTasks).toBe(1)
    expect(metrics.completedTasks).toBe(1)
    expect(metrics.failedTasks).toBe(0)
    expect(metrics.successRate).toBeGreaterThan(0)
  })

  it('aggregates improvement suggestions', () => {
    recordLearning({
      taskId: 'task-1',
      pattern: 'Refactoring',
      outcome: 'partial',
      improvement: 'Mehr Unit-Tests für kritische Pfade schreiben',
    })

    recordLearning({
      taskId: 'task-2',
      pattern: 'Refactoring Followup',
      outcome: 'success',
      improvement: 'Mehr Unit-Tests für kritische Pfade schreiben',
    })

    const summary = getLearningsSummary()

    expect(summary.improvements).toContain(
      'Mehr Unit-Tests für kritische Pfade schreiben'
    )
    expect(summary.improvements.length).toBe(1)
  })
})
