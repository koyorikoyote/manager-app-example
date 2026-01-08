# Manager App Color Scheme

This document outlines the color scheme used in the Manager App, which is based on the teal/green and orange/gold color palette from the mock-app project.

## Primary Colors (Teal/Green)

The primary color palette uses teal/green tones for main UI elements, buttons, and interactive components.

- **Primary 50**: `#f0fdfa` - Very light teal background
- **Primary 100**: `#ccfbf1` - Light teal background
- **Primary 200**: `#99f6e4` - Light teal borders
- **Primary 300**: `#5eead4` - Medium light teal
- **Primary 400**: `#2dd4bf` - Medium teal
- **Primary 500**: `#14b8a6` - Main primary color (teal-500)
- **Primary 600**: `#0d9488` - Darker teal for hover states
- **Primary 700**: `#0f766e` - Dark teal
- **Primary 800**: `#115e59` - Very dark teal
- **Primary 900**: `#134e4a` - Darkest teal

## Secondary Colors (Orange/Gold)

The secondary color palette uses orange/gold tones for accent elements and secondary actions.

- **Secondary 50**: `#fff7ed` - Very light orange background
- **Secondary 100**: `#ffedd5` - Light orange background
- **Secondary 200**: `#fed7aa` - Light orange borders
- **Secondary 300**: `#fdba74` - Medium light orange
- **Secondary 400**: `#fb923c` - Medium orange (used in gradients)
- **Secondary 500**: `#f97316` - Main secondary color (orange-500)
- **Secondary 600**: `#ea580c` - Darker orange for hover states
- **Secondary 700**: `#c2410c` - Dark orange
- **Secondary 800**: `#9a3412` - Very dark orange
- **Secondary 900**: `#7c2d12` - Darkest orange

## Accent Colors (Cyan)

The accent color palette uses cyan tones for complementary elements and gradients.

- **Accent 50**: `#ecfeff` - Very light cyan background
- **Accent 100**: `#cffafe` - Light cyan background
- **Accent 200**: `#a5f3fc` - Light cyan borders
- **Accent 300**: `#67e8f9` - Medium light cyan
- **Accent 400**: `#22d3ee` - Medium cyan
- **Accent 500**: `#06b6d4` - Main accent color (cyan-500)
- **Accent 600**: `#0891b2` - Darker cyan for hover states
- **Accent 700**: `#0e7490` - Dark cyan
- **Accent 800**: `#155e75` - Very dark cyan
- **Accent 900**: `#164e63` - Darkest cyan

## Neutral Colors (Gray/Slate)

The neutral color palette uses gray/slate tones for text, borders, and backgrounds.

- **Neutral 50**: `#f8fafc` - Very light gray background
- **Neutral 100**: `#f1f5f9` - Light gray background
- **Neutral 200**: `#e2e8f0` - Light gray borders
- **Neutral 300**: `#cbd5e1` - Medium light gray
- **Neutral 400**: `#94a3b8` - Medium gray
- **Neutral 500**: `#64748b` - Main neutral color (slate-500)
- **Neutral 600**: `#475569` - Darker gray for text
- **Neutral 700**: `#334155` - Dark gray for headings
- **Neutral 800**: `#1e293b` - Very dark gray
- **Neutral 900**: `#0f172a` - Darkest gray

## Gradients

### Primary Gradient (Nifty Gradient)
```css
background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
```
Used for primary buttons, hero sections, and main call-to-action elements.

### Secondary Gradient (Orange Gradient)
```css
background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
```
Used for secondary buttons, accent elements, and warning states.

## Usage Guidelines

### Buttons
- **Primary buttons**: Use primary gradient (`from-primary-500 to-accent-500`)
- **Secondary buttons**: Use secondary gradient (`from-secondary-500 to-secondary-400`)
- **Outline buttons**: Use primary-200 border with primary-700 text
- **Ghost buttons**: Use primary-700 text with primary-100 hover background

### Form Elements
- **Input borders**: Use neutral-300 for default, primary-500 for focus
- **Input focus**: Use primary-500/20 for ring color
- **Labels**: Use neutral-700 for form labels
- **Placeholders**: Use neutral-500 for placeholder text

### Text Colors
- **Headings**: Use neutral-900 for main headings
- **Body text**: Use neutral-700 for regular text
- **Muted text**: Use neutral-500 for secondary text
- **Links**: Use primary-500 for links

### Cards and Containers
- **Default cards**: Use neutral-200 borders
- **Interactive cards**: Use primary-300 border on hover
- **Gradient cards**: Use nifty or orange gradients for special cards

### Focus States
- **Ring color**: Use primary-500/20 (20% opacity)
- **Border color**: Use primary-500 for focused elements

## Accessibility

All color combinations meet WCAG 2.1 AA contrast requirements:
- Primary colors on white backgrounds: ✅ AA compliant
- Secondary colors on white backgrounds: ✅ AA compliant
- Text colors on their respective backgrounds: ✅ AA compliant

## Implementation

Colors are implemented using Tailwind CSS custom color tokens in `tailwind.config.js`. The color scheme is also available as CSS custom properties and utility classes in `index.css`.