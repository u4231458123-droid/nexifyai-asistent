# NeXifyAI Assistant

🤖 **Autonomer AI Agent für Softwareentwicklung**

[![npm version](https://img.shields.io/npm/v/@nexifyai/assistant.svg)](https://www.npmjs.com/package/@nexifyai/assistant)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Features

- **Task Management**: Erstelle, verwalte und führe Tasks autonom aus
- **OpenAI Assistant Integration**: Nutzt die OpenAI Assistants API mit Thread-basierter Konversation
- **Vector Store**: Synchronisiert Projektdokumentation für kontextbasierte Antworten
- **Self-Optimization**: Lernt aus erfolgreichen und fehlgeschlagenen Tasks
- **Multi-Tool Support**: Erweiterbare Tool-Architektur

## 📦 Installation

```bash
npm install @nexifyai/assistant
# oder
pnpm add @nexifyai/assistant
# oder
yarn add @nexifyai/assistant
```

## ⚙️ Konfiguration

Erstelle eine `.env` Datei:

```env
# OpenAI API Keys (Required)
OPENAI_API_KEY=sk-proj-your-api-key-here

# NeXifyAI Assistant Configuration
NEXIFYAI_ASSISTANT_ID=asst_your-assistant-id
NEXIFYAI_VECTOR_STORE_ID=vs_your-vector-store-id
NEXIFYAI_ORG_ID=org-your-org-id
```

## 🚀 Quick Start

### Einfacher Chat

```typescript
import { chat, initializeSession, endSession } from '@nexifyai/assistant'

// Session initialisieren
await initializeSession()

// Mit dem Agent chatten
const response = await chat('Analysiere die Architektur des Projekts')
console.log(response)

// Session beenden
await endSession()
```

### Task-basierte Ausführung

```typescript
import { runTask, getSessionSummary } from '@nexifyai/assistant'

// Task erstellen und ausführen
const result = await runTask(
  'Implementiere force-dynamic',
  'Füge export const dynamic = "force-dynamic" zu allen auth-required Pages hinzu',
  { priority: 'high', category: 'security' }
)

console.log(result.success ? '✅ Erfolgreich' : '❌ Fehlgeschlagen')
console.log(result.summary)

// Session-Zusammenfassung
console.log(getSessionSummary())
```

### Manuelles Task Management

```typescript
import {
  createTask,
  listTasks,
  executeTask,
  getTaskStats,
} from '@nexifyai/assistant'

// Tasks erstellen
const task1 = createTask({
  title: 'Code Review',
  description: 'Überprüfe die API Routes auf Security Issues',
  priority: 'high',
  category: 'security',
})

const task2 = createTask({
  title: 'Dokumentation',
  description: 'Aktualisiere die README',
  priority: 'medium',
  category: 'documentation',
})

// Tasks auflisten
const pendingTasks = listTasks({ status: 'pending' })
console.log(`${pendingTasks.length} ausstehende Tasks`)

// Task ausführen
const result = await executeTask(task1.id)

// Statistiken
const stats = getTaskStats()
console.log(`Erfolgsrate: ${stats.completed}/${stats.total}`)
```

### Learning & Metrics

```typescript
import {
  getLearningReport,
  getMetrics,
  findSimilarLearnings,
} from '@nexifyai/assistant'

// Ähnliche frühere Learnings finden
const learnings = findSimilarLearnings('API Security')
learnings.forEach((l) => console.log(`- ${l.pattern}: ${l.outcome}`))

// Metriken abrufen
const metrics = getMetrics()
console.log(`Erfolgsrate: ${(metrics.successRate * 100).toFixed(1)}%`)

// Vollständiger Lernbericht
console.log(getLearningReport())
```

## 📚 API Reference

### Agent Functions

| Function            | Description                         |
| ------------------- | ----------------------------------- |
| `initializeSession` | Neue Agent-Session starten          |
| `getSession`        | Aktuelle Session abrufen            |
| `chat(message)`     | Einfache Chat-Nachricht senden      |
| `processMessage`    | Nachricht mit vollem Context        |
| `executeTask(id)`   | Einzelnen Task ausführen            |
| `runTask(t, d, o)`  | Task erstellen und sofort ausführen |
| `getSessionSummary` | Session-Zusammenfassung             |
| `endSession`        | Session beenden                     |

### Task Management

| Function        | Description                      |
| --------------- | -------------------------------- |
| `createTask`    | Neuen Task erstellen             |
| `getTask`       | Task by ID abrufen               |
| `updateTask`    | Task aktualisieren               |
| `setTaskStatus` | Task-Status setzen               |
| `completeTask`  | Task als abgeschlossen markieren |
| `listTasks`     | Tasks filtern und auflisten      |
| `deleteTask`    | Task löschen                     |
| `getTaskStats`  | Task-Statistiken                 |

### Learning

| Function               | Description               |
| ---------------------- | ------------------------- |
| `recordLearning`       | Lerneintrag speichern     |
| `findSimilarLearnings` | Ähnliche Learnings finden |
| `getMetrics`           | Agent-Metriken abrufen    |
| `getLearningReport`    | Vollständiger Lernbericht |

## 🔧 OpenAI Assistant Setup

1. **Assistant erstellen** auf [platform.openai.com](https://platform.openai.com/assistants)
2. **Vector Store erstellen** für Dokumentation
3. **Tools aktivieren**: Code Interpreter, File Search
4. **System Prompt** aus `NEXIFYAI_SYSTEM_PROMPT` verwenden

## 🏗️ Architektur

```
┌─────────────────────────────────────────────────┐
│                 NeXifyAI Agent                  │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐              │
│  │    Chat     │  │    Task     │              │
│  │  Interface  │  │   Manager   │              │
│  └──────┬──────┘  └──────┬──────┘              │
│         │                │                      │
│         ▼                ▼                      │
│  ┌─────────────────────────────────────────┐   │
│  │           OpenAI Client                 │   │
│  │  (Threads, Runs, Vector Store)          │   │
│  └─────────────────────────────────────────┘   │
│                      │                          │
│                      ▼                          │
│  ┌─────────────────────────────────────────┐   │
│  │         Learning Manager                │   │
│  │  (Self-Optimization, Metrics)           │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## 📄 License

MIT © NeXify Solutions

## 🔗 Links

- [GitHub Repository](https://github.com/u4231458123-droid/nexifyai-asistent)
- [OpenAI Assistants API](https://platform.openai.com/docs/assistants)
