/**
 * NeXifyAI Configuration
 * Central configuration for the autonomous AI agent
 */

import type { AgentConfig, AgentTool } from './types'

// Environment variables with defaults
export const NEXIFYAI_CONFIG = {
  // OpenAI API Keys
  apiKey: process.env.OPENAI_API_KEY || '',
  serviceKey: process.env.OPENAI_SERVICE_KEY || '',
  adminKey: process.env.OPENAI_ADMIN_KEY || '',

  // Assistant Configuration
  assistantId: process.env.NEXIFYAI_ASSISTANT_ID || '',
  vectorStoreId: process.env.NEXIFYAI_VECTOR_STORE_ID || '',
  projectId: process.env.NEXIFYAI_PROJECT_ID || '',
  organizationId: process.env.NEXIFYAI_ORG_ID || '',

  // Model settings
  model: process.env.NEXIFYAI_MODEL || 'gpt-4o',
  temperature: parseFloat(process.env.NEXIFYAI_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.NEXIFYAI_MAX_TOKENS || '16000', 10),

  // Retry settings
  maxRetries: 3,
  retryDelayMs: 1000,

  // Timeouts
  timeoutMs: 120000, // 2 minutes
  pollIntervalMs: 1000,
} as const

// Available tools for the agent
export const AGENT_TOOLS: AgentTool[] = [
  {
    name: 'task_create',
    description:
      'Create a new task with title, description, priority, and category',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: {
          type: 'string',
          description: 'Detailed task description',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
        },
        category: {
          type: 'string',
          enum: [
            'development',
            'bugfix',
            'documentation',
            'refactoring',
            'security',
            'performance',
            'feature',
            'maintenance',
            'research',
          ],
        },
      },
      required: ['title', 'description'],
    },
    enabled: true,
  },
  {
    name: 'task_update',
    description: 'Update an existing task status, priority, or details',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID to update' },
        status: {
          type: 'string',
          enum: ['pending', 'in-progress', 'completed', 'failed', 'cancelled'],
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
        },
        description: { type: 'string', description: 'Updated description' },
      },
      required: ['taskId'],
    },
    enabled: true,
  },
  {
    name: 'task_list',
    description: 'List all tasks with optional filtering by status or category',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: [
            'pending',
            'in-progress',
            'completed',
            'failed',
            'cancelled',
            'all',
          ],
        },
        category: { type: 'string' },
        limit: {
          type: 'number',
          description: 'Maximum number of tasks to return',
        },
      },
    },
    enabled: true,
  },
  {
    name: 'codebase_search',
    description: 'Search the codebase for files, functions, or patterns',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        filePattern: {
          type: 'string',
          description: 'Glob pattern for file filtering',
        },
        searchType: { type: 'string', enum: ['semantic', 'grep', 'file'] },
      },
      required: ['query'],
    },
    enabled: true,
  },
  {
    name: 'documentation_search',
    description:
      'Search the documentation vector store for relevant information',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        topK: {
          type: 'number',
          description: 'Number of results to return',
          default: 5,
        },
      },
      required: ['query'],
    },
    enabled: true,
  },
  {
    name: 'learning_record',
    description: 'Record a learning entry for self-optimization',
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Pattern or insight learned' },
        outcome: { type: 'string', enum: ['success', 'failure', 'partial'] },
        improvement: {
          type: 'string',
          description: 'Suggested improvement for future',
        },
      },
      required: ['pattern', 'outcome'],
    },
    enabled: true,
  },
]

// System prompt for NeXifyAI
export const NEXIFYAI_SYSTEM_PROMPT = `# NeXifyAI - Autonomous Development Agent

Du bist NeXifyAI, ein vollständig autonomer KI-Agent für Softwareentwicklung.

## Deine Kernfähigkeiten

1. **Codebase-Verständnis**: Du hast Zugriff auf alle Dokumentationen in der Vector-Datenbank
2. **Task-Management**: Du kannst Tasks erstellen, priorisieren und verwalten
3. **Code-Implementierung**: Du kannst Dateien lesen, erstellen und bearbeiten
4. **Selbstoptimierung**: Du lernst kontinuierlich aus erfolgreichen und fehlgeschlagenen Tasks

## Arbeitsweise

1. **Request analysieren**: Verstehe die Anfrage vollständig
2. **Context laden**: Suche relevante Dokumentation und Code
3. **Plan erstellen**: Definiere konkrete Tasks
4. **Implementieren**: Führe Änderungen durch
5. **Validieren**: Teste und verifiziere
6. **Dokumentieren**: Committe und berichte

## Antwortformat

🎯 **REQUEST**: [Zusammenfassung]

📚 **CONTEXT LOADED**:
- [Relevante Docs]
- [Relevante Files]

🔍 **ANALYSIS**:
- Current state: [Befunde]
- Required changes: [Liste]

⚙️ **IMPLEMENTATION**:
- [Änderungen]

✅ **VALIDATION**:
- Build: ✓/✗
- Types: ✓/✗

📝 **COMMIT**:
- Message: [Beschreibung]

Antworte immer auf Deutsch. Sei präzise und fokussiert.`

// Build default agent configuration
export function buildAgentConfig(
  overrides?: Partial<AgentConfig>
): AgentConfig {
  return {
    assistantId: NEXIFYAI_CONFIG.assistantId,
    vectorStoreId: NEXIFYAI_CONFIG.vectorStoreId,
    projectId: NEXIFYAI_CONFIG.projectId,
    organizationId: NEXIFYAI_CONFIG.organizationId,
    model: NEXIFYAI_CONFIG.model,
    temperature: NEXIFYAI_CONFIG.temperature,
    maxTokens: NEXIFYAI_CONFIG.maxTokens,
    tools: AGENT_TOOLS.filter((t) => t.enabled),
    systemPrompt: NEXIFYAI_SYSTEM_PROMPT,
    ...overrides,
  }
}

// Validate configuration
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!NEXIFYAI_CONFIG.apiKey) {
    errors.push('OPENAI_API_KEY is required')
  }

  if (!NEXIFYAI_CONFIG.assistantId) {
    errors.push('NEXIFYAI_ASSISTANT_ID is required')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
