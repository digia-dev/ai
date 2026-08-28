# Tara AI — Design Document

## Design Principles

1. **Clean & Minimal** — White background, black text, no clutter
2. **Timeless** — No trendy gradients, no unnecessary animations
3. **Functional** — Every element serves a purpose
4. **Responsive** — Works on mobile and desktop

## Colors

```css
--bg:             #ffffff;
--bg-secondary:   #f5f5f5;
--bg-tertiary:    #eaeaea;
--text:           #000000;
--text-secondary: #666666;
--text-muted:     #999999;
--border:         #e0e0e0;
--accent:         #000000;
--error:          #dc2626;
--success:        #16a34a;
```

## Typography

- **Font**: Plus Jakarta Sans (Google Fonts)
- **Weights**: 400 (body), 500 (labels), 600 (headings), 700 (titles)
- **Sizes**:
  - Title: 28px
  - H2: 20px
  - H3: 16px
  - Body: 14px
  - Small: 12–13px

## Icon

- **Logo**: SVG abstract diamond/geometric shape
- **Colors**: Black version (default), White version (inverted)
- **Usage**: Sidebar header, auth page, favicon, PWA icon
- **Size**: 32x32 (UI), 192x192 (PWA), 512x512 (PWA)

## Components

### Radix UI Components Used

| Component   | Usage                              |
|-------------|-------------------------------------|
| Tabs        | Sources page (File / Text)          |
| Dialog      | Confirm delete conversation/source  |
| Toast       | Success/error notifications         |
| DropdownMenu| User menu (future)                 |

### Button

| Variant   | Style                                              |
|-----------|-----------------------------------------------------|
| Primary   | bg-black text-white rounded-lg px-4 py-2 font-semibold |
| Secondary | border border-black bg-transparent text-black       |
| Icon      | w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center |

### Input

```
rounded-lg border border-gray-200 px-3 py-2 text-sm
Focus: border-black outline-none
```

### Card

```
rounded-xl border border-gray-200 shadow-sm p-4
```

## Pages

### Auth (/login, /register)

```
┌──────────────────────────────────┐
│                                  │
│         ┌──────────────┐         │
│         │    ◆         │         │
│         │   Tara AI    │         │
│         │   Subtitle   │         │
│         │              │         │
│         │  [Name]      │  ← register only
│         │  [Email]     │         │
│         │  [Password]  │         │
│         │              │         │
│         │  [ Login  ]  │         │
│         │              │         │
│         │  Don't have  │         │
│         │  an account? │         │
│         │  Register →  │         │
│         └──────────────┘         │
│                                  │
└──────────────────────────────────┘
```

- Centered card (max-w-sm)
- Error message: red bg, red text
- Toggle between login/register

### Chat (/chat)

```
┌──────────┬───────────────────────┐
│ Sidebar  │  Header               │
│          │  ──────────────────── │
│  ◆ Tara  │                       │
│          │    Messages Area      │
│ [+ New]  │                       │
│          │  ┌─────────────────┐  │
│ Conv 1   │  │ U: user message │  │
│ Conv 2   │  └─────────────────┘  │
│ Conv 3   │  ┌─────────────────┐  │
│          │  │ T: AI response  │  │
│          │  └─────────────────┘  │
│          │                       │
│          │  ┌─────────────────┐  │
│          │  │ Clarification   │  │
│          │  │ [Option 1]      │  │
│          │  │ [Option 2]      │  │
│          │  └─────────────────┘  │
│          │                       │
│  Sources │  [Message input] [↑]  │
│  Logout  │                       │
└──────────┴───────────────────────┘
```

- Sidebar: 280px, bg-secondary
- New chat: + icon button
- Conversation list: title + delete on hover
- Messages: max-w-2xl centered
- User avatar: gray circle "U"
- AI avatar: black circle "T"
- Welcome screen: icon + 4 suggestion cards (2x2 grid)
- Input: textarea + send button
- Typing indicator: 3 dots blink

### Sources (/sources)

```
┌──────────────────────────────────┐
│  Sources                [← Back] │
│                                  │
│  [File Upload] [Text Source]     │
│  ─────────────────────────────── │
│                                  │
│  ┌─────────────────────────────┐ │
│  │      📎                     │ │
│  │  Click or drag files here   │ │
│  │  PDF, DOCX, TXT (10MB max) │ │
│  └─────────────────────────────┘ │
│                                  │
│  ┌──────────────────────────────┐│
│  │ 📄 document.pdf   1.2K words││
│  │                        [×]  ││
│  ├──────────────────────────────┤│
│  │ 📄 notes.txt      500 words││
│  │                        [×]  ││
│  └──────────────────────────────┘│
└──────────────────────────────────┘
```

- Radix Tabs: File Upload | Text Source
- File tab: drag & drop zone
- Text tab: name input + textarea + submit
- Source list: icon + name + word count + delete button

## Responsive

| Breakpoint | Sidebar       | Layout         |
|------------|---------------|----------------|
| > 768px    | Visible       | Sidebar + Main |
| ≤ 768px    | Overlay (hamburger) | Full-width main |

## Animation

| Element     | Animation                            |
|-------------|--------------------------------------|
| Buttons     | transition-colors duration-200       |
| Typing      | 3 dots, staggered blink 1.4s infinite|
| Hover       | bg-secondary on hover                |
| No page transitions or scroll effects |  |

## Accessibility

- Semantic HTML (labels, buttons, headings)
- Keyboard: Enter to send, Escape to close sidebar
- Focus states: ring-2 ring-black on inputs
- Min touch target: 44x44px on mobile
- Radix UI: built-in ARIA support

## SVG Logo

Abstract geometric diamond shape:
- Black version: #000000 fill
- White version: #ffffff fill
- Used as: favicon, PWA icon, sidebar logo, auth page
