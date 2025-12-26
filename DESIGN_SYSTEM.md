# Awesome Rank Design System

> Unified design system for all Awesome Rank apps (2025)

## Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#d4a574` | Main accent, buttons, highlights |
| Primary Light | `#e8c9a3` | Hover states, light accents |
| Primary Dark | `#b88a52` | Active states, gradients |

### Accent Colors
| Name | Hex | Usage |
|------|-----|-------|
| Accent | `#c76d4e` | Terracotta/coral highlights |
| Accent Light | `#e89a7a` | Hover accents |
| Accent Dark | `#a44d32` | Active accents |

### Secondary Colors
| Name | Hex | Usage |
|------|-----|-------|
| Secondary | `#7a9e7e` | Sage green, success states |
| Secondary Light | `#a3c4a7` | Light success |
| Secondary Dark | `#5a7d5e` | Dark success |

### Background Colors
| Name | Hex | Usage |
|------|-----|-------|
| Background | `#0a0908` | Main background |
| Surface | `#141210` | Card backgrounds |
| Surface Elevated | `#1a1815` | Elevated elements |

### Text Colors
| Name | Hex | Usage |
|------|-----|-------|
| Text Primary | `#f5f2ed` | Main text |
| Text Secondary | `#9a958c` | Secondary text |
| Text Muted | `#5c584f` | Disabled, hints |

### Semantic Colors
| Name | Hex | Usage |
|------|-----|-------|
| Success | `#7a9e7e` | Success states |
| Warning | `#d4a574` | Warning states |
| Error | `#c76d4e` | Error states |
| Info | `#6b8cae` | Information |

---

## Typography

### Font Families
```css
--font-main: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'Space Mono', 'IBM Plex Mono', monospace;
```

### Font Weights
| Name | Value |
|------|-------|
| Light | 300 |
| Regular | 400 |
| Medium | 500 |
| Semibold | 600 |
| Bold | 700 |

### Font Sizes (Fluid)
| Name | Size |
|------|------|
| `--text-xs` | clamp(0.7rem, 0.65rem + 0.25vw, 0.75rem) |
| `--text-sm` | clamp(0.8rem, 0.75rem + 0.25vw, 0.875rem) |
| `--text-base` | clamp(0.9rem, 0.85rem + 0.25vw, 1rem) |
| `--text-lg` | clamp(1rem, 0.95rem + 0.25vw, 1.125rem) |
| `--text-xl` | clamp(1.15rem, 1.05rem + 0.5vw, 1.25rem) |
| `--text-2xl` | clamp(1.35rem, 1.2rem + 0.75vw, 1.5rem) |
| `--text-3xl` | clamp(1.6rem, 1.4rem + 1vw, 1.875rem) |
| `--text-4xl` | clamp(2rem, 1.7rem + 1.5vw, 2.5rem) |

---

## Spacing

| Name | Value |
|------|-------|
| `--space-xs` | 0.5rem |
| `--space-sm` | 0.75rem |
| `--space-md` | 1rem |
| `--space-lg` | 1.5rem |
| `--space-xl` | 2rem |
| `--space-2xl` | 3rem |
| `--space-3xl` | 4rem |

---

## Border Radius

| Name | Value |
|------|-------|
| `--radius-sm` | 6px |
| `--radius-md` | 10px |
| `--radius-lg` | 16px |
| `--radius-xl` | 24px |
| `--radius-full` | 9999px |

---

## Shadows

```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
--shadow-glow: 0 0 40px rgba(212, 165, 116, 0.15);
```

---

## Glass Morphism

```css
/* Standard glass panel */
--glass-bg: rgba(20, 18, 16, 0.85);
--glass-border: rgba(212, 165, 116, 0.12);

/* Subtle glass panel */
--glass-bg-light: rgba(26, 24, 21, 0.75);
--glass-border-subtle: rgba(245, 242, 237, 0.06);
```

### Usage
```css
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}
```

---

## Transitions

```css
--transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
--transition-bounce: 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## Button Styles

### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: var(--bg-color);
  box-shadow: var(--shadow-sm), inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary-color) 100%);
  box-shadow: var(--shadow-md), var(--primary-glow);
  transform: translateY(-1px);
}
```

### Secondary Button
```css
.btn-secondary {
  background: var(--glass-bg);
  border: 1px solid var(--border);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--glass-bg-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
}
```

---

## Card Styles

```css
.card {
  background: var(--card-bg);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  transition: all var(--transition-base);
}

.card:hover {
  background: var(--card-bg-hover);
  border-color: var(--border);
}
```

---

## Responsive Breakpoints

| Breakpoint | Width |
|------------|-------|
| Mobile Small | 320px |
| Mobile Standard | 375px |
| Mobile Large | 480px |
| Tablet | 768px |
| Desktop | 1024px |

---

## Design Principles

1. **Warm Tones**: Use warm amber/gold primary colors instead of cold blues/cyans
2. **Subtle Glassmorphism**: Semi-transparent backgrounds with blur effects
3. **Consistent Spacing**: Use spacing variables for consistent layouts
4. **Fluid Typography**: Font sizes scale smoothly across viewports
5. **Accessible Contrast**: Maintain readable text contrast ratios
6. **Touch-Friendly**: Minimum 44px touch targets for mobile

---

## CSS Variables Reference

All variables are defined in `/frontend/src/index.css` and can be used throughout the application:

```css
/* Example usage */
.my-component {
  background: var(--card-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  font-size: var(--text-base);
  transition: all var(--transition-fast);
}

.my-component:hover {
  background: var(--card-bg-hover);
  border-color: var(--primary-color);
  box-shadow: var(--primary-glow);
}
```
