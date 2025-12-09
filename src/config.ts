/**
 * NeXifyAI Configuration
 * Central configuration for the autonomous AI agent
 * Version: 2.0.0
 */

import type { AgentConfig, AgentTool } from './types'

// Environment variables with defaults
export const NEXIFYAI_CONFIG = {
  // OpenAI API Keys
  apiKey: process.env.OPENAI_API_KEY || '',
  serviceKey: process.env.OPENAI_SERVICE_KEY || '',
  adminKey: process.env.OPENAI_ADMIN_KEY || '',

  // Assistant Configuration
  assistantId:
    process.env.NEXIFYAI_ASSISTANT_ID || 'asst_q9v3fPTIvfACHNx04aJDS2PB',
  vectorStoreId:
    process.env.NEXIFYAI_VECTOR_STORE_ID ||
    'vs_69382330fae481919429750c2fa90e4c',
  projectId: process.env.NEXIFYAI_PROJECT_ID || 'proj_FeQSUpe4jJmFVV0G3YFp6cwg',
  organizationId: process.env.NEXIFYAI_ORG_ID || 'org-kk1ld7YE4t09C9fLQSCOkJWZ',

  // Prompt Configuration
  promptId: 'pmpt_693863013d9c8194bc93c362016920570c032926a27fd740',
  promptVersion: '6',

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

  // Primary Project
  primaryProject: 'MyDispatch',
  domain: 'my-dispatch.de',
  supabaseProject: 'ykfufejycdgwonrlbhzn',
  region: 'eu-central-1',
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
    name: 'task_complete',
    description: 'Mark a task as completed with optional result notes',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID to complete' },
        result: {
          type: 'string',
          description: 'Result or notes about completion',
        },
      },
      required: ['taskId'],
    },
    enabled: true,
  },
  {
    name: 'vector_store_search',
    description:
      'Search the vector store for relevant documentation and context. MUST be called at session start.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        topK: {
          type: 'number',
          description: 'Number of results to return',
          default: 5,
        },
        segment: {
          type: 'string',
          enum: ['critical', 'high', 'standard', 'all'],
          description: 'Priority segment to search',
        },
      },
      required: ['query'],
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
  {
    name: 'sync_vector_store',
    description:
      'Synchronize vector store with latest project data via Repomax',
    parameters: {
      type: 'object',
      properties: {
        fullSync: {
          type: 'boolean',
          description: 'Perform full sync vs incremental',
        },
        segments: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific segments to sync',
        },
      },
    },
    enabled: true,
  },
]

// Vector Store Segments (Priority-based)
export const VECTOR_STORE_SEGMENTS = {
  critical: [
    '.github/copilot-instructions.md',
    'docs/ARCHITECTURE_MASTER.md',
    'docs/DATABASE_SCHEMA.md',
    'docs/API_EDGE_FUNCTIONS.md',
    'middleware.ts',
  ],
  high: [
    'docs/SUPABASE_RLS_POLICIES.md',
    'docs/COMPONENT_PATTERNS.md',
    'docs/STRIPE_INTEGRATION.md',
    'docs/REALTIME_PATTERNS.md',
    '.github/instructions/snyk_rules.instructions.md',
  ],
  standard: [
    'docs/MCP_SERVER.md',
    'docs/DEPENDENCY_MAPPING.md',
    'docs/SYSTEM_REQUIREMENTS_PROFILE.md',
    'docs/JWT_KEYS_INDEX.md',
    'README.md',
  ],
} as const

// System prompt for NeXifyAI (Optimized v2.0)
export const NEXIFYAI_SYSTEM_PROMPT = `# NeXifyAI - Autonomer Mastermind-Agent v2.0

Du bist **NeXifyAI**, der zentrale, vollstaendig autonome Mastermind-Agent fuer alle NeXify-Projekte.
Owner: **Pascal Courbois**

## PFLICHT-SEQUENZ (Bei jedem Start)

### 1. Vector-Datenbank Laden (IMMER ZUERST!)
- Store ID: vs_69382330fae481919429750c2fa90e4c
- Lade kritische Segmente: copilot-instructions, architecture-master, database-schema
- Semantische Suche fuer Kontext aktivieren

### 2. Prompt laden
- Prompt ID: pmpt_693863013d9c8194bc93c362016920570c032926a27fd740
- Version: 6

## Kern-Konfiguration

- Primary Project: MyDispatch
- Domain: my-dispatch.de
- Supabase: ykfufejycdgwonrlbhzn (Frankfurt/eu-central-1)
- Tech Stack: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Supabase

## Multi-Tenant Sicherheit (3-Layer Defense)

KRITISCH - Bei jeder Code-Aenderung beachten!

Layer 1: middleware.ts - Auth + Subscription Check
Layer 2: API Routes - company_id FORCED from profile (NICHT vom Request!)
Layer 3: RLS Policies - Database-level Row Filtering

VERBOTEN: company_id vom User-Input akzeptieren
KORREKT: company_id aus profile.company_id erzwingen

## Autonome Arbeitssequenz

Phase 1: Initialisierung
- Vector Store laden
- Umgebung erkennen (IDE/staging/production)
- Supabase, MCP-Server, Repomax verbinden

Phase 2: Daten-Aggregation
- Vector Store abfragen
- Repository-Status holen
- Datenintegritaet validieren

Phase 3: IST-SOLL-Analyse
- Aktuellen Zustand analysieren
- Zielzustand definieren
- Abhaengigkeiten mappen

Phase 4: Implementierungsplan
- Risiken reflektieren
- Segmentierten Plan erstellen
- Aktionen strukturieren

Phase 5: Ausfuehrung
- Plan ausfuehren (autonom)
- Live-Validierung
- Luecken sofort schliessen
- Backup mit Versionierung

Phase 6: Finalisierung
- Ergebnisse dokumentieren
- Vector Store synchronisieren
- Naechste Schritte empfehlen

## Output-Format (STRIKT!)

{
  "reasoning": "[Analyse, geladene Infos, erkannte Probleme, Validierung]",
  "vector_store_context": {
    "loaded_segments": ["..."],
    "semantic_matches": 5
  },
  "ist_state": "[Aktueller Zustand]",
  "soll_state": "[Zielzustand]",
  "implementation_plan": {
    "steps": ["..."],
    "risks": ["..."],
    "mitigations": ["..."]
  },
  "execution_log": ["[Chronologische Events]"],
  "conclusion": "[Ergebnis - IMMER ZULETZT]",
  "next_steps": ["[Weitere Aktionen]"]
}

WICHTIG:
- reasoning IMMER zuerst
- conclusion IMMER zuletzt
- Niemals mit Schlussfolgerungen beginnen!

## Sub-Agenten

- DevOpsAI: CI/CD, Deployment
- DocsAI: Dokumentation, Vector Store Sync
- AnalyticsAI: Metriken, Monitoring
- SecurityAI: Snyk Scans, RLS Policies

## Self-Healing

- Fehlende Segmente: Auto-Repair + Rekursion
- Agent-Konflikte: Auto-Rekonciliation
- Legal/Ethical Risks: IMMER loggen und eskalieren
`

/**
 * Build agent configuration
 */
export function buildAgentConfig(): AgentConfig {
  return {
    name: 'NeXifyAI',
    version: '2.0.0',
    model: NEXIFYAI_CONFIG.model,
    temperature: NEXIFYAI_CONFIG.temperature,
    maxTokens: NEXIFYAI_CONFIG.maxTokens,
    systemPrompt: NEXIFYAI_SYSTEM_PROMPT,
    tools: AGENT_TOOLS.filter((t) => t.enabled),
    vectorStoreId: NEXIFYAI_CONFIG.vectorStoreId,
    assistantId: NEXIFYAI_CONFIG.assistantId,
  }
}

/**
 * Validate configuration
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!NEXIFYAI_CONFIG.apiKey) {
    errors.push('OPENAI_API_KEY is not configured')
  }

  if (!NEXIFYAI_CONFIG.assistantId) {
    errors.push('NEXIFYAI_ASSISTANT_ID is not configured')
  }

  if (!NEXIFYAI_CONFIG.vectorStoreId) {
    errors.push('NEXIFYAI_VECTOR_STORE_ID is not configured')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
