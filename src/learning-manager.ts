/**
 * NeXifyAI Learning Manager
 * Handles self-optimization and continuous learning
 */

import type { LearningEntry, AgentMetrics } from './types'

// In-memory learning store
const learnings: Map<string, LearningEntry> = new Map()
const metrics: AgentMetrics = {
  totalTasks: 0,
  completedTasks: 0,
  failedTasks: 0,
  averageCompletionTime: 0,
  successRate: 0,
  tokensUsed: 0,
  lastActiveAt: new Date(),
}

/**
 * Generate unique learning ID
 */
function generateLearningId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 6)
  return `learn_${timestamp}_${random}`
}

/**
 * Record a learning entry
 */
export function recordLearning(params: {
  taskId: string
  pattern: string
  outcome: 'success' | 'failure' | 'partial'
  feedback?: string
  improvement?: string
}): LearningEntry {
  const entry: LearningEntry = {
    id: generateLearningId(),
    timestamp: new Date(),
    taskId: params.taskId,
    pattern: params.pattern,
    outcome: params.outcome,
    feedback: params.feedback,
    improvement: params.improvement,
  }

  learnings.set(entry.id, entry)

  // Update metrics
  metrics.totalTasks++
  if (params.outcome === 'success') {
    metrics.completedTasks++
  } else if (params.outcome === 'failure') {
    metrics.failedTasks++
  }
  metrics.successRate = metrics.completedTasks / metrics.totalTasks
  metrics.lastActiveAt = new Date()

  return entry
}

/**
 * Get learnings by pattern similarity
 */
export function findSimilarLearnings(
  pattern: string,
  limit: number = 5
): LearningEntry[] {
  const patternLower = pattern.toLowerCase()
  const words = patternLower.split(/\s+/)

  return Array.from(learnings.values())
    .map((entry) => {
      const entryLower = entry.pattern.toLowerCase()
      let score = 0

      // Simple word matching score
      for (const word of words) {
        if (entryLower.includes(word)) {
          score++
        }
      }

      return { entry, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.entry)
}

/**
 * Get successful patterns for a category
 */
export function getSuccessfulPatterns(category?: string): string[] {
  return Array.from(learnings.values())
    .filter((entry) => entry.outcome === 'success')
    .filter(
      (entry) =>
        !category ||
        entry.pattern.toLowerCase().includes(category.toLowerCase())
    )
    .map((entry) => entry.pattern)
}

/**
 * Get improvement suggestions
 */
export function getImprovementSuggestions(): string[] {
  return Array.from(learnings.values())
    .filter((entry) => entry.improvement !== undefined)
    .map((entry) => entry.improvement as string)
    .filter((value, index, self) => self.indexOf(value) === index) // Unique
}

/**
 * Get learnings summary
 */
export function getLearningsSummary(): {
  total: number
  successful: number
  failed: number
  partial: number
  patterns: string[]
  improvements: string[]
} {
  const all = Array.from(learnings.values())

  return {
    total: all.length,
    successful: all.filter((l) => l.outcome === 'success').length,
    failed: all.filter((l) => l.outcome === 'failure').length,
    partial: all.filter((l) => l.outcome === 'partial').length,
    patterns: all.slice(-10).map((l) => l.pattern),
    improvements: getImprovementSuggestions().slice(-5),
  }
}

/**
 * Update metrics
 */
export function updateMetrics(updates: Partial<AgentMetrics>): AgentMetrics {
  Object.assign(metrics, updates)
  metrics.lastActiveAt = new Date()
  return { ...metrics }
}

/**
 * Add tokens used
 */
export function addTokensUsed(count: number): void {
  metrics.tokensUsed += count
}

/**
 * Record task completion time
 */
export function recordCompletionTime(durationMs: number): void {
  const totalTime = metrics.averageCompletionTime * (metrics.completedTasks - 1)
  metrics.averageCompletionTime =
    (totalTime + durationMs) / metrics.completedTasks
}

/**
 * Get current metrics
 */
export function getMetrics(): AgentMetrics {
  return { ...metrics }
}

/**
 * Export learnings as JSON
 */
export function exportLearnings(): string {
  const data = {
    learnings: Array.from(learnings.values()),
    metrics: { ...metrics },
    exportedAt: new Date().toISOString(),
  }
  return JSON.stringify(data, null, 2)
}

/**
 * Import learnings from JSON
 */
export function importLearnings(json: string): number {
  try {
    const data = JSON.parse(json)
    let imported = 0

    if (data.learnings) {
      for (const entry of data.learnings) {
        entry.timestamp = new Date(entry.timestamp)
        learnings.set(entry.id, entry)
        imported++
      }
    }

    if (data.metrics) {
      Object.assign(metrics, data.metrics)
      metrics.lastActiveAt = new Date()
    }

    return imported
  } catch {
    return 0
  }
}

/**
 * Clear all learnings
 */
export function clearLearnings(): void {
  learnings.clear()
}

/**
 * Generate learning report
 */
export function generateLearningReport(): string {
  const summary = getLearningsSummary()
  const currentMetrics = getMetrics()

  let report = `# NeXifyAI Lernbericht\n\n`
  report += `**Generiert:** ${new Date().toLocaleString('de-DE')}\n\n`

  report += `## 📊 Metriken\n\n`
  report += `- Gesamt Tasks: ${currentMetrics.totalTasks}\n`
  report += `- Abgeschlossen: ${currentMetrics.completedTasks}\n`
  report += `- Fehlgeschlagen: ${currentMetrics.failedTasks}\n`
  report += `- Erfolgsrate: ${(currentMetrics.successRate * 100).toFixed(1)}%\n`
  report += `- Durchschn. Bearbeitungszeit: ${(
    currentMetrics.averageCompletionTime / 1000
  ).toFixed(1)}s\n`
  report += `- Tokens verwendet: ${currentMetrics.tokensUsed.toLocaleString()}\n\n`

  report += `## 📚 Lerneinträge\n\n`
  report += `- Gesamt: ${summary.total}\n`
  report += `- Erfolgreich: ${summary.successful}\n`
  report += `- Teilweise: ${summary.partial}\n`
  report += `- Fehlgeschlagen: ${summary.failed}\n\n`

  if (summary.patterns.length > 0) {
    report += `## 🎯 Letzte Patterns\n\n`
    for (const pattern of summary.patterns) {
      report += `- ${pattern}\n`
    }
    report += '\n'
  }

  if (summary.improvements.length > 0) {
    report += `## 💡 Verbesserungsvorschläge\n\n`
    for (const improvement of summary.improvements) {
      report += `- ${improvement}\n`
    }
  }

  return report
}
