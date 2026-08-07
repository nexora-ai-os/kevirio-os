# KEVIRIO V3 Design System

## Experience promise

The interface is an Owner decision environment, not a generic dashboard. It prioritizes one strategic narrative: what changed, why it matters, what evidence supports it, what decision is required, and what happens next.

## Visual foundation

- Warm White surfaces, Charcoal text, Champagne Gold emphasis; soft blue/pale purple only for secondary semantic support.
- Premium Japanese-first typography with readable Latin numerals; restrained glass, fine warm borders and soft layered shadows.
- Large whitespace and clear hierarchy: page title → decision context → evidence → action.
- Color never carries meaning alone; icon, label and text accompany every state.
- Motion explains continuity, 120–240ms, and disappears under reduced-motion preference.

## Tokens

Use semantic tokens rather than fixed component colors: canvas/surface/glass, text-primary/secondary, border/subtle/strong, accent-gold, state-actual/forecast/inference/unknown/locked/risk, focus-ring, elevation-1..4, radius-1..4, space-1..12, type-display/title/body/meta/mono, motion-fast/standard. Contrast must meet WCAG AA; focus indicators meet 3:1 adjacent contrast.

## Information architecture

Application shell: global navigation, Workspace/Business context, command palette, notifications and Owner menu. Main surfaces: Home, Revenue Engines, intelligence functions, AI Employees, Approvals, Operations, Revenue, Insights, Learning, Memory, Knowledge, Marketplace, Audit and Settings. A sticky Decision Rail surfaces the next bounded Owner action; mobile uses an accessible bottom sheet.

## Component contracts

Cards summarize one concept and link to evidence. Tables retain headers and become labeled records on narrow screens. Badges always include text. Forms associate labels, help, errors and disabled reasons. Drawers/dialogs trap focus, close by Escape when safe, restore focus and prevent background interaction. Graphs always provide a synchronized list. Loading, Empty, Error, Locked, Conditional, Unknown and Success are distinct states.

## Responsive and accessibility contracts

Desktop supports dense comparison; laptop reduces columns; iPad preserves rail priority; mobile uses one-column flow without horizontal page scroll. Touch targets ≥44px. Keyboard order follows document order; skip link, landmarks, unique headings, live regions and accessible names are mandatory. Localization supports Japanese expansion, RTL-ready layout primitives, locale dates/numbers/currency and no text embedded in imagery.

## Performance

Route/screen lazy loading, skeleton stability, bounded virtualization, responsive imagery and memoized derived views. Avoid duplicate fetches and waterfalls; show freshness and partial availability. Performance budgets and accessible behavior are release gates, not polish.
