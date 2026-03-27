# ShitDone

Porque ya era hora de organizar tu desorden. Aplicacion de escritorio para gestion de tareas (Kanban) y notas con soporte Markdown. Construida con Electron, React y Firebase.

## Caracteristicas

**Kanban Board**
- Columnas personalizables con drag-and-drop
- Tareas con prioridad (baja, media, alta, urgente), fecha de vencimiento y organizacion
- Indicadores visuales de prioridad y fechas vencidas

**Notas con Markdown**
- Editor con CodeMirror y vista previa en tiempo real
- Syntax highlighting en bloques de codigo (GFM, tablas, checkboxes)
- Auto-guardado con debounce de 1 segundo
- Descarga de notas como archivos `.md`

**Sistema de Tags**
- Tags compartidos entre tareas y notas
- Colores personalizables por tag
- Filtrado por tags con logica AND

**Organizaciones**
- Categoriza tareas por contexto: trabajo, estudio, emprendimiento, etc.
- Agregar y quitar organizaciones libremente

**Busqueda y Filtros**
- Busqueda en tiempo real por texto en titulos y contenido
- Filtros combinables: tags, prioridad, organizacion, rango de fechas
- Chips de filtros activos con opcion de limpiar

**Vinculacion Bidireccional**
- Asocia tareas con notas y viceversa
- Navegacion directa entre items vinculados

**Split View**
- Vista dividida 50/50: Kanban en una mitad, notas en la otra
- Toggle rapido desde la barra de navegacion

**Atajos de Teclado**
- `Ctrl+K` — Enfocar buscador
- `Ctrl+\` — Alternar split view

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Desktop | Electron |
| Frontend | React 19 + TypeScript |
| Estilos | Tailwind CSS |
| Estado | Zustand |
| Base de datos | Firebase Firestore |
| Autenticacion | Firebase Anonymous Auth |
| Drag & Drop | @dnd-kit |
| Editor Markdown | CodeMirror |
| Renderizado Markdown | react-markdown + remark-gfm + rehype-highlight |
| Iconos | lucide-react |

## Requisitos Previos

- Node.js 18+
- npm 9+
- Un proyecto en [Firebase Console](https://console.firebase.google.com)

## Configuracion de Firebase

1. Crea un proyecto en Firebase Console
2. Activa **Firestore Database** (modo produccion)
3. Activa **Authentication** > **Sign-in method** > **Anonymous**
4. En **Firestore > Rules**, aplica estas reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{document} {
      allow read, write: if request.auth != null
                         && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

5. Ve a **Project Settings** > **General** > **Your apps** > agrega una app Web y copia las credenciales

## Instalacion

```bash
git clone <repo-url>
cd shitdone
npm install
```

Crea el archivo `.env` en la raiz del proyecto:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

## Uso

```bash
# Desarrollo con hot reload
npm run dev

# Build de produccion
npm run build
```

## Estructura del Proyecto

```
shitdone/
├── electron/                 # Proceso principal de Electron
│   ├── main.ts               # Creacion de ventana, IPC handlers
│   └── preload.ts            # contextBridge API
├── src/
│   ├── components/
│   │   ├── kanban/           # KanbanBoard, Column, TaskCard, TaskDetail, TaskForm
│   │   ├── layout/           # TopNav, SplitView, SearchBar
│   │   ├── notes/            # NotesList, NoteEditor, NotePreview, NoteForm
│   │   ├── organizations/    # OrgManager
│   │   ├── shared/           # Modal, ConfirmDialog, MarkdownRenderer, EmptyState, etc.
│   │   └── tags/             # TagChip, TagSelector, TagManager
│   ├── hooks/                # useSearch (filtrado client-side)
│   ├── lib/                  # Firebase init, utilidades, config markdown
│   ├── pages/                # TasksPage, NotesPage
│   ├── stores/               # Zustand: tasks, notes, tags, orgs, ui
│   └── types/                # Interfaces TypeScript
├── .env.example
├── tailwind.config.ts
└── vite.config.ts
```

## Modelo de Datos (Firestore)

| Coleccion | Campos principales |
|-----------|--------------------|
| `tasks` | title, description (md), tags[], priority, dueDate, organizationId, columnId, order, linkedNoteIds[] |
| `notes` | title, content (md), tags[], linkedTaskIds[] |
| `tags` | name, color |
| `organizations` | name |
| `kanbanColumns` | name, order |

Todos los documentos incluyen `userId` para aislamiento por usuario.

## Licencia

MIT
