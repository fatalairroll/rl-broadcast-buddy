

# Plan: Usunięcie strzałki z menu sidebar

## Zmiana

Usunąć przycisk toggle (ChevronLeft, linie 121-140) z sidebara w `StudioRender.tsx`. Sidebar pozostanie zawsze widoczny bez przycisku strzałki po prawej stronie.

Również usunąć przycisk "collapsed toggle" (ChevronRight) poniżej, oraz nieużywany import `ChevronLeft`/`ChevronRight` i stan `sidebarOpen`.

## Plik

| Plik | Zmiana |
|------|--------|
| `src/pages/StudioRender.tsx` | Usunąć toggle button (linie 121-140), collapsed button, stan `sidebarOpen`, importy ChevronLeft/ChevronRight |

