# Standings Page UI Redesign

## Overview

Redesign the single standings page of the MLB fantasy league tracker with a "Clean Sports App" visual direction. The goal is a polished, data-dense, mobile-first UI that incorporates MLB team colors and surfaces more useful data — while keeping the existing light theme and orange primary accent.

## Visual Direction

**Style: Clean Sports App** — inspired by Apple Sports / MLB app. Light background (#fafafa), white cards with soft shadows, rounded corners (12px), outlined team-color pills, numbered position circles. Orange (#ff3e00) remains the primary accent color.

**Team colors** are introduced via a new static color map (`team-colors.ts`) keyed by team name (matching existing names in `global-var.ts`). Each team has a primary color used for outlined pills, colored dots, and team name text. All 30 MLB teams are mapped.

## Page Layout

Mobile-first, ~400px max-width container. Fixed nav stays as-is. Each member is rendered as a white card with:
- 12px border-radius
- Subtle box-shadow (`0 1px 3px rgba(0,0,0,0.06)`)
- Tap to expand/collapse (existing slide transition preserved)

Members are listed in standings order (sorted by wins, as currently implemented).

## Collapsed Member Row

Each collapsed card displays:

- **Position circle**: Orange-filled circle for 1st place, gray for 2nd–5th. Contains the rank number.
- **Name**: Bold, primary text.
- **Streak badge**: Small pill — green for winning streak ("W3"), red for losing streak ("L2"). Only shown if streak length >= 2.
- **Record**: e.g. "52-38"
- **Win percentage**: e.g. ".578"
- **Second line**: "Today: 3-1" (daily record) on the left, Games Behind on the right in orange.

Layout:
```
┌─────────────────────────────────────────┐
│  ①  Marcel          W3     52-38  .578  │
│      Today: 3-1                    — GB │
└─────────────────────────────────────────┘
```

## Expanded View

Tapping a member slides open (existing `slide` transition, 150ms). Contains three sub-sections:

### 1. Daily Record Summary

Centered text: "3-1 Today" in slightly larger/bold font.

### 2. Game Cards (2-column grid)

Each game card is a white card with subtle shadow.

**Standard game card:**
- Team names displayed with member's team in bold
- Team name text colored with team's primary color
- Left border indicates outcome: green (win), red (loss), amber (in-progress), gray (scheduled)
- Bottom row: game status (left), outcome badge (right, small colored text — "WIN" / "LOSS")

**Head-to-head game card** (when both teams belong to league members):
- Top banner: "⚔ vs [Member]" text
- Split left-border using both teams' primary colors (top half = home team color, bottom half = away team color)
- Otherwise same layout as standard card

### 3. Team Breakdown Table

Redesigned stats table with team color accents:

| Column | Description |
|--------|-------------|
| Team | Small colored dot (team primary color) + team abbreviation |
| W-L | Win-loss record |
| W% | Win percentage (new, calculated) |
| L10 | Last 10 games record (new — source TBD, see Data Changes) |
| Diff | Run differential, color-coded green/red |

- Sorted by wins descending (current behavior)
- Totals row at bottom with bold top-border divider
- Team logos removed in favor of colored dots + abbreviations for a cleaner look

## Team Color Map

New file: `src/lib/team-colors.ts`

A static map of all 30 MLB teams keyed by team name (e.g. "Dodgers", "Yankees") to match `global-var.ts`. Each entry contains a `primary` color string (hex). Examples:
- Dodgers: `#005A9C`
- Yankees: `#003087`
- Cardinals: `#C41E3A`
- Orioles: `#DF4601`

## Data Changes

| Data Point | Source | Status |
|------------|--------|--------|
| Win % | Calculated from existing W-L data | New, trivial |
| Streak (W3/L2) | Derived from today's game outcomes — count consecutive wins or losses for the member | New, needs logic |
| Head-to-head detection | Already tracked via `memberName` on `GameTeam` | Exists |
| Run differential | Already scraped from Fox Sports | Exists |
| Runs scored | Already scraped from Fox Sports | Exists |
| Team colors | New static map file | New, static |
| Last 10 record | Check if Fox Sports standings table has this column; fallback to MongoDB historical data or replace with RS (runs scored) if unavailable | New, TBD source |

### Streak Calculation

The streak is a "today only" streak: count the member's total wins and losses from today's final games. If all final games are wins, show "W[count]" (e.g. 3 wins, 0 losses → "W3"). If all final games are losses, show "L[count]". If the record is mixed (e.g. 2-1) or no games are final yet, no badge is shown. Multi-day streaks are deferred to Tier 2.

## Scope

- **In scope**: UI redesign of existing standings page, new team color map, new calculated data (win %, streak, L10 if available), head-to-head card styling
- **Out of scope**: New pages/routes, dark mode, Tier 2 features (historical trends, sparklines, season milestones), stats/trends/picks pages
- **Constraint**: Mobile-first (~400px), deployed on Vercel, SvelteKit + TypeScript

## Tier 2 (Future)

Deferred for a follow-up design cycle:
- Historical trend sparklines (requires MongoDB query on page load)
- Multi-day winning/losing streaks
- Season milestones and fun callouts ("closest to .500", "biggest comeback today")
- Last 10 record (if not achievable in Tier 1)

## Implementation Notes

- Use the `frontend-design` skill during implementation for polished output
- Existing component structure: `+page.svelte`, `GameCard.svelte`, `GameCardTeam.svelte`, `StandingsTable.svelte` — all will need redesign
- Team color map should be importable and usable anywhere a team name is available
- Preserve existing data loading flow (`+page.ts` scraping Fox Sports)
- Preserve existing collapse/expand interaction pattern with slide transition
