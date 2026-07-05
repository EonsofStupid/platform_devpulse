# Reference Image Audit — Component Gap Analysis

> Every UI element visible in the reference images mapped to:
> what exists in the central library, what's missing, what needs to be built.

---

## DASHBOARD-REFERENCE-01.png

### Top Bar
| Element | Component | Primitive | Status |
|---------|-----------|-----------|--------|
| App logo "DevPULSE" | Text | heading | EXISTS |
| Top nav tabs ("IoT PALETTES") | Tabs | tabs | EXISTS |
| Tab bar with underline glow | TabsTrigger | tabs | EXISTS — needs glow preset |

### Left Column — Clyffy Control Widget
| Element | Component | Primitive | Status |
|---------|-----------|-----------|--------|
| Widget container (glass panel) | Card → Widget block | — | EXISTS |
| Widget title "Clyffy Control" | Heading | heading | EXISTS |
| Radial gauge (large circle) | RadialGauge block | — | EXISTS |
| Gauge tick marks | RadialGauge internal | — | EXISTS |
| Gauge value text (glow) | Text | — | EXISTS — needs glow text preset |
| Gauge label | Text | — | EXISTS |

### Center Column — Sparkline Charts
| Element | Component | Primitive | Status |
|---------|-----------|-----------|--------|
| Sparkline chart widget | Widget block + SparkLine | — | EXISTS |
| Multi-line sparkline (3 colors) | SparkLine block | — | EXISTS — needs multi-series |
| Chart legend dots | StatusDot | — | EXISTS |
| Chart axis labels | Text | — | EXISTS |

### Right Column — Status Panel
| Element | Component | Primitive | Status |
|---------|-----------|-----------|--------|
| Context Load widget | Widget block | — | EXISTS |
| Horizontal bar chart | Progress | progress | EXISTS |
| Bar labels | Text | — | EXISTS |
| "PLANNING" badge (orange glow) | Badge | badge | EXISTS — needs ember glow preset |
| Small info panel (bottom right) | Card | — | EXISTS |

### Background
| Element | Component | Primitive | Status |
|---------|-----------|-----------|--------|
| Circuit board grid pattern | — (CSS backdrop) | — | EXISTS (app.css) |
| Teal radial glow center | — (CSS backdrop) | — | EXISTS (app.css) |

### MISSING for Dashboard
| What | Type | Priority |
|------|------|----------|
| Chrome-style curved tab bar (sits behind glass container) | Component: ChromeTabs | HIGH |
| Multi-series sparkline (overlapping colored lines) | Block enhancement: SparkLine | MEDIUM |
| Glow text preset (value text with emission) | Preset: text-glow-teal | HIGH |

---

## CHAT-REFERENCE-01.png + CHAT-REFERENCE-02.png

### Top Tab Bar
| Element | Component | Primitive | Status |
|---------|-----------|-----------|--------|
| "DEVELOPMENT" / "OUTER MEMORY" tabs | Tabs | tabs | EXISTS |
| Tab underline glow (teal active) | TabsTrigger | tabs | EXISTS — needs underline glow preset |
| Tab bar background (dark glass) | Card/Panel | — | EXISTS |

### Left Sidebar — Thread List
| Element | Component | Primitive | Status |
|---------|-----------|-----------|--------|
| Sidebar container (glass panel) | Sidebar | sidebar | EXISTS |
| Thread list items | List + ListItem | list | EXISTS |
| Active thread highlight (teal border) | ListItem state | — | EXISTS — needs active preset |
| Thread labels (ALPHA, BETA, GAMMA) | Text | — | EXISTS |
| Thread metadata (timestamps) | Text | — | EXISTS |

### Center — Chat Panel
| Element | Component | Primitive | Status |
|---------|-----------|-----------|--------|
| Chat container (glass panel) | Card | — | EXISTS |
| Message thread header "Task_AI" | Heading | heading | EXISTS |
| AI message bubble (glass, teal border) | **MISSING: ChatBubble** | — | NEEDS BUILDING |
| User message bubble | **MISSING: ChatBubble** | — | NEEDS BUILDING |
| Message text | Text | — | EXISTS |
| Code block in message | Code (InlineCode/CodeBlock) | — | EXISTS |
| Input field at bottom | TextField | text-field | EXISTS |
| Send button | Button | button | EXISTS |

### Right Panel — Context Visualization
| Element | Component | Primitive | Status |
|---------|-----------|-----------|--------|
| Neural network visualization | **MISSING: Canvas/SVG viz** | — | FUTURE (Candle) |
| "Policy_Ref" floating labels | Badge/Text | — | EXISTS |
| Connection lines (glow) | SVG paths | — | NEEDS BUILDING |

### Bottom Right — Voice Active
| Element | Component | Primitive | Status |
|---------|-----------|-----------|--------|
| "Voice Active" button (red glow, pulsing) | Button | button | EXISTS — needs ember/red glow preset + pulse animation |
| Microphone icon | Icon (lucide) | — | EXISTS |
| Glow ring around button | **Handled by glow preset** | — | EXISTS |

### MISSING for Chat
| What | Type | Priority |
|------|------|----------|
| ChatBubble (AI + User variants) | Component | HIGH |
| ChatThread (list of bubbles) | Block | HIGH |
| ChatInput (text field + send + voice) | Block | HIGH |
| ThreadList (sidebar with active state) | Block | HIGH |
| ContextVisualization (neural network) | Block | FUTURE |

---

## reference-cag.png (CAG: Knowledge/Trait/Persona Core)

### Central Visualization
| Element | Component | Primitive | Status |
|---------|-----------|-----------|--------|
| Liquid metal sphere | **MISSING: 3D/WebGL or SVG** | — | FUTURE |
| Trait Matrix label | Text + Badge | — | EXISTS |
| Knowledge Pool label | Text + Badge | — | EXISTS |
| Persona Engine label | Text + Badge | — | EXISTS |
| Flow lines (teal glow) | SVG paths | — | NEEDS BUILDING |
| "ADAPTATION" badge | Badge | badge | EXISTS |

### Governance Controls (bottom right panel)
| Element | Component | Primitive | Status |
|---------|-----------|-----------|--------|
| Panel container (glass) | Card | — | EXISTS |
| "GOVERNANCE CONTROLS" heading | Heading | heading | EXISTS |
| Slider: Knowledge Density | Slider | slider | EXISTS |
| Slider: Trait Fluidity | Slider | slider | EXISTS |
| Slider: Persona Stability | Slider | slider | EXISTS |
| Slider labels | Label | label | EXISTS |

### MISSING for CAG
| What | Type | Priority |
|------|------|----------|
| FlowDiagram (SVG with glow paths) | Block | MEDIUM |
| 3D sphere visualization | Block | FUTURE (WebGL) |

---

## refrence-liquid.png (CAG/RAG/HyDE Reasoning Core)

### Central Hub Visualization
| Element | Component | Primitive | Status |
|---------|-----------|-----------|--------|
| CAG HUB circle | Badge/custom SVG | — | NEEDS BUILDING |
| RAG RETRIEVAL circle | Badge/custom SVG | — | NEEDS BUILDING |
| HyDE SYNTHESIS circle | Badge/custom SVG | — | NEEDS BUILDING |
| Async flow arrows (glow) | SVG | — | NEEDS BUILDING |
| Minion agent nodes | Card (small) | — | EXISTS |
| "Coder Minion" / "Researcher Minion" labels | Text + Badge | — | EXISTS |

### Governance Controls
| Element | Component | Primitive | Status |
|---------|-----------|-----------|--------|
| Controls panel | Card | — | EXISTS |
| RAG Threshold slider | Slider | slider | EXISTS |
| HyDE Iterations slider | Slider | slider | EXISTS |
| HYDE Handlers slider | Slider | slider | EXISTS |

---

## reference-liquid-metal.png (3D Liquid Metal)

This is a visual target for the neumorphic aesthetic — liquid metal, chrome reflections, deep shadows. Not a UI layout. Informs preset values: chrome surfaces, specular highlights, deep bevel.

---

## COMPLETE COMPONENT INVENTORY

### EXISTS and ready to use (with correct presets)
| Component | Primitive | Uses RenderForge |
|-----------|-----------|----------------|
| Accordion | accordion | YES |
| Alert | alert | YES |
| AlertDialog | alert-dialog | YES |
| Avatar | — | YES |
| AvatarGroup | — | YES |
| Badge | badge | YES |
| Banner | banner | YES |
| Button | button | YES |
| Calendar | — | YES |
| Callout | — | YES |
| Card | — | YES |
| Checkbox | checkbox | YES |
| Code (InlineCode + CodeBlock) | — | YES |
| Collapsible | — | YES |
| ColorArea | — | YES |
| ColorField | color-field | YES |
| ColorSlider | color-slider | YES |
| ColorSwatch | — | YES |
| ColorSwatchPicker | — | YES |
| ColorWheel | — | YES |
| Combobox | combobox | YES |
| ContextualHelp | — | YES |
| DataTable | — | YES |
| DateField | — | YES |
| DatePicker | — | YES |
| DateRangeField | — | YES |
| DateRangePicker | — | YES |
| DescriptionList | — | YES |
| Dialog | dialog | YES |
| EmptyState | — | YES |
| FileUpload | — | YES |
| Form | form | YES |
| FormField | form-field | YES |
| Heading | heading | YES |
| InlineMessage | — | YES |
| InputGroup | — | YES |
| Kbd | kbd | YES |
| Label | label | YES |
| LinkPreview | — | YES |
| List | list | YES |
| LoadingOverlay | — | YES |
| Menubar | — | YES |
| Nav | — | YES |
| NavigationMenu | — | YES |
| NotificationCenter | — | YES |
| Pagination | pagination | YES |
| PinInput | — | YES |
| Popover | popover | YES |
| Progress | progress | YES |
| Prose | — | YES |
| RadioGroup | radio-group | YES |
| RangeCalendar | — | YES |
| ScrollArea | scroll-area | YES |
| Select | select | YES |
| Separator | separator | YES |
| Sheet | sheet | YES |
| Sidebar | sidebar | YES |
| Skeleton | skeleton | YES |
| SkipLink | — | YES |
| Slider | slider | YES |
| Spinner | spinner | YES |
| Stat | — | YES |
| StatusDot | — | YES |
| Steps | — | YES |
| Switch | switch | YES |
| Table | table | YES |
| TableOfContents | — | YES |
| Tabs | tabs | YES |
| Text | — | YES |
| TextField | text-field | YES |
| Textarea | textarea | YES |
| Toaster | — | YES |
| Toggle | toggle | YES |
| ToggleGroup | toggle-group | YES |
| Toolbar | toolbar | YES |
| Tooltip | tooltip | YES |

### EXISTS as blocks
| Block | Composed From |
|-------|--------------|
| Widget | Card + Heading + Separator |
| RadialGauge | SVG + Text |
| SparkLine | SVG + Text |

### NEEDS BUILDING — Components (central library)
| Component | Layer | Primitive Exists? | ARIA Pattern | Priority |
|-----------|-------|-------------------|-------------|----------|
| ChatBubble | component | NO — need to create | role="log" children | HIGH |
| ChatInput | component | NO — need to create | textbox + button composite | HIGH |

### NEEDS BUILDING — Blocks (compositions of components)
| Block | Composed From | Priority |
|-------|--------------|----------|
| ChatThread | List + ChatBubble + ScrollArea | HIGH |
| ChatPanel | Card + ChatThread + ChatInput | HIGH |
| ThreadList | Sidebar + List + Badge | HIGH |
| DashboardWidget | Widget (already exists) | DONE |
| GovernanceControls | Card + Slider + Label | MEDIUM |
| FlowDiagram | SVG + Badge + Text | MEDIUM |
| MinionNode | Card + Avatar + Badge + Text | LOW |

### NEEDS BUILDING — Presets (visual treatments)
| Preset | For | Values |
|--------|-----|--------|
| text-glow-teal | Text | `text-shadow: 0 0 12px var(--glow-teal)` |
| text-glow-purple | Text | `text-shadow: 0 0 12px var(--glow-purple)` |
| badge-ember-glow | Badge | ember glow + orange surface |
| button-voice-active | Button | red glow + pulse animation |
| tabs-underline-glow | Tabs | teal underline with glow emission |
| card-chat-bubble-ai | Card | teal border glow, glass surface |
| card-chat-bubble-user | Card | subtle glass, no glow |
| sidebar-thread-active | ListItem | teal left border + glow |

---

## EXECUTION ORDER

1. **Presets first** — add the missing presets to DTCG JSON files. This makes existing components render correctly with rich visuals. No new code needed.

2. **ChatBubble component** — structural: `<div data-kind="chat-bubble" data-slot="root" data-variant={variant}>`. Uses Card with chat-specific presets. Primitive: simple ARIA (role implied by parent log region).

3. **ChatInput block** — composes TextField + Button. No new primitive needed.

4. **ChatThread block** — composes ScrollArea + List + ChatBubble.

5. **ChatPanel block** — composes Card + ChatThread + ChatInput.

6. **ThreadList block** — composes Sidebar + List.

7. **GovernanceControls block** — composes Card + Slider + Label.

8. **Reauthor route pages** — replace raw HTML with central library components + blocks.
