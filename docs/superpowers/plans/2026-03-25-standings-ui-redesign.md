# Standings Page UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Design skill:** Use `frontend-design` skill when implementing UI components for polished output.

**Goal:** Redesign the MLB fantasy league standings page with a "Clean Sports App" visual direction — light theme, team colors, expanded stats, head-to-head game highlighting.

**Architecture:** Modify existing SvelteKit components in-place. Add a team color map as a new static module. Extend the Fox Sports scraper to pull L10 and streak data (both already available in the standings table). All changes are to the single standings page — no new routes.

**Tech Stack:** SvelteKit, TypeScript, Svelte 3, Cheerio (scraping), CSS (scoped component styles)

**Spec:** `docs/superpowers/specs/2026-03-25-standings-ui-redesign.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/team-colors.ts` | Create | Static color map: team name → primary hex color for all 30 MLB teams |
| `src/lib/types.ts` | Modify | Add `streak`, `l10` to `MemberStanding`; add `winPct`, `l10` to `Team`; add `isHeadToHead` to `Game` |
| `src/routes/+page.ts` | Modify | Scrape L10 (td index 10) and streak (td index 11) from Fox Sports; calculate win %, detect head-to-head games |
| `src/routes/+page.svelte` | Modify | Redesign collapsed/expanded member cards with new Clean Sports App styling |
| `src/lib/components/game-card/GameCard.svelte` | Modify | Redesign game card with team colors, left-border outcome indicator, head-to-head banner |
| `src/lib/components/game-card-team/GameCardTeam.svelte` | Modify | Team name colored by team color, bold for member's team |
| `src/lib/components/standings-table/StandingsTable.svelte` | Modify | Redesign table: colored dots, W%, L10, color-coded diff, remove logos |
| `src/routes/+layout.svelte` | Modify | Update background color to #fafafa, minor nav styling tweaks |

---

### Task 1: Create Team Color Map

**Files:**
- Create: `src/lib/team-colors.ts`

- [ ] **Step 1: Create the team color map file**

```typescript
// src/lib/team-colors.ts

export const teamColors: Record<string, string> = {
	// AL East
	'Orioles': '#DF4601',
	'Red Sox': '#BD3039',
	'Yankees': '#003087',
	'Rays': '#092C5C',
	'Blue Jays': '#134A8E',

	// AL Central
	'White Sox': '#27251F',
	'Guardians': '#00385D',
	'Tigers': '#0C2340',
	'Royals': '#004687',
	'Twins': '#002B5C',

	// AL West
	'Astros': '#002D62',
	'Angels': '#BA0021',
	'Athletics': '#003831',
	'Mariners': '#0C2C56',
	'Rangers': '#003278',

	// NL East
	'Braves': '#CE1141',
	'Mets': '#002D72',
	'Phillies': '#E81828',
	'Marlins': '#00A3E0',
	'Nationals': '#AB0003',

	// NL Central
	'Cubs': '#0E3386',
	'Brewers': '#12284B',
	'Cardinals': '#C41E3A',
	'Pirates': '#27251F',
	'Reds': '#C6011F',

	// NL West
	'Dodgers': '#005A9C',
	'Padres': '#2F241D',
	'Giants': '#FD5A1E',
	'Diamondbacks': '#A71930',
	'Rockies': '#33006F'
};

export function getTeamColor(teamName: string): string {
	return teamColors[teamName] || '#888888';
}
```

- [ ] **Step 2: Verify the map keys match global-var.ts team names**

Run: `node -e "
const gc = require('./src/lib/global-var.ts');
" 2>&1 || echo "Manual check: compare team names in team-colors.ts keys with teams arrays in global-var.ts"`

Manually verify these match — the keys in `teamColors` must exactly match the strings in `global-var.ts`:
- Marcel: Dodgers, Tigers, Brewers, Diamondbacks, Guardians, Rockies
- Nate: Blue Jays, Cubs, Rangers, Royals, Marlins, White Sox
- Bob: Mets, Phillies, Padres, Astros, Athletics, Twins
- Tom: Mariners, Red Sox, Giants, Reds, Rays, Nationals
- Carter: Orioles, Yankees, Pirates, Braves, Cardinals, Angels

All 30 teams accounted for. ✓

- [ ] **Step 3: Commit**

```bash
git add src/lib/team-colors.ts
git commit -m "feat: add MLB team color map for all 30 teams"
```

---

### Task 2: Extend Types

**Files:**
- Modify: `src/lib/types.ts:1-30`

- [ ] **Step 1: Add new fields to MemberStanding**

Add `streak` field to `MemberStanding` class. This stores the team-level streak string from Fox Sports (e.g. "W3", "L2") — but at the member level, we derive it from daily results.

In `src/lib/types.ts`, replace the `MemberStanding` class:

```typescript
export class MemberStanding {
	name = '';
	wins = 0;
	losses = 0;
	gamesBehind = 0;
	runsScored = 0;
	diff = 0;
	collapsed = true;
	teams: Team[] = [];
	gamesToday: Game[] = [];
	dailyWins = 0;
	dailyLosses = 0;
	streak = ''; // e.g. "W3", "L2" — derived from today's results

	constructor(name: string) {
		this.name = name;
	}
}
```

- [ ] **Step 2: Add new fields to Team**

Replace the `Team` class:

```typescript
export class Team {
	name = '';
	wins = 0;
	losses = 0;
	runsScored = 0;
	diff = 0;
	img = '';
	winPct = 0;  // calculated: wins / (wins + losses)
	l10 = '';    // e.g. "7-3" — scraped from Fox Sports
	streak = ''; // e.g. "W3" — scraped from Fox Sports
}
```

- [ ] **Step 3: Add head-to-head flag to Game**

Replace the `Game` class:

```typescript
export class Game {
	awayTeam = new GameTeam('', '');
	homeTeam = new GameTeam('', '');
	status = '';
	showScore = true;
	outcome = '';
	isHeadToHead = false; // true when both teams belong to different league members
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add winPct, l10, streak, isHeadToHead to types"
```

---

### Task 3: Extend the Scraper

**Files:**
- Modify: `src/routes/+page.ts:60-109` (standings scraping section)
- Modify: `src/routes/+page.ts:129-238` (scores/games section)

- [ ] **Step 1: Scrape L10 and streak from Fox Sports standings**

In `src/routes/+page.ts`, inside the `listItems.each` callback (the standings scraping loop starting at line 60), add these lines after the existing `diff` scrape (line 64):

```typescript
			const l10 = $(element).find('td').eq(10).text().trim();
			const streak = $(element).find('td').eq(11).text().trim();
```

Then update the team push block (lines 99-106) to include the new fields and calculate winPct:

```typescript
					memberStanding.teams.push({
						name: teamSanitized,
						img: teamImg || '',
						wins,
						losses,
						runsScored: runsScored,
						diff: diff,
						winPct: wins + losses > 0 ? wins / (wins + losses) : 0,
						l10: l10 || '0-0',
						streak: streak || '-'
					});
```

- [ ] **Step 2: Calculate member-level streak from daily results**

After the scores scraping loop finishes (after line 238, before `return { members: standings }`), add streak calculation:

```typescript
			// Calculate member daily streak (only shown if >= 2)
			standings.forEach((member) => {
				if (member.dailyWins >= 2 && member.dailyLosses === 0) {
					member.streak = `W${member.dailyWins}`;
				} else if (member.dailyLosses >= 2 && member.dailyWins === 0) {
					member.streak = `L${member.dailyLosses}`;
				}
				// Mixed results, < 2, or no finals → streak stays empty string
			});
```

- [ ] **Step 3: Detect head-to-head games**

In the scores scraping loop, after `game.showScore = shouldShowScore(game);` (line 162), add head-to-head detection. This needs to happen after the away/home team members are identified later in the loop.

Find the section where `awayGame` is created (around line 208) and after `awayGame.showScore = game.showScore;` add:

```typescript
					awayGame.isHeadToHead = !!(homeTeamMember && homeTeamMember.name !== awayTeamMember.name);
```

And in the section where the home team game is pushed (around line 226), before `homeTeamMember.gamesToday.push(...)`, set:

```typescript
						game.isHeadToHead = !!(awayTeamMember && awayTeamMember.name !== homeTeamMember.name);
```

- [ ] **Step 4: Run the dev server to verify data loads**

Run: `npm run dev`

Open http://localhost:5173 and check the browser console / page output to confirm no errors. The UI will look unchanged for now — we're just verifying the scraper still works with the new fields.

- [ ] **Step 5: Commit**

```bash
git add src/routes/+page.ts
git commit -m "feat: scrape L10, streak from Fox Sports; calculate member streak and head-to-head"
```

---

### Task 4: Redesign Layout Background

**Files:**
- Modify: `src/routes/+layout.svelte:32-95`

- [ ] **Step 1: Update the layout styles**

In `src/routes/+layout.svelte`, replace the entire `<style>` block:

```css
<style>
	:global(body) {
		background-color: #fafafa;
	}

	.container {
		padding: 1rem 0.5rem;
		max-width: 400px;
		margin: 4rem auto;
	}

	nav {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		justify-content: space-between;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background-color: white;
		border: 1px solid rgba(0, 0, 0, 0.06);
		padding: 0.5rem;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		max-width: min(90vw, 365px);
		margin: 1rem auto;
		z-index: 100;
	}

	a {
		color: var(--primary-color);
		text-decoration: none;
		font-weight: 600;
		padding: 3px 6px;
		border-radius: 5px;
	}

	a.active {
		color: white;
		background-color: var(--primary-color);
	}

	.title {
		font-weight: 700;
		font-size: 1.25rem;
	}

	footer {
		color: gray;
	}

	footer p {
		margin: 0;
		text-align: center;
		font-size: 12px;
	}

	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
```

Key changes: background to `#fafafa`, nav background to `white` with softer shadow, added `z-index: 100` for fixed nav, removed unused `.outer` class.

- [ ] **Step 2: Verify the layout changes**

Run: `npm run dev`

Check that the background is a subtle off-white and the nav has a softer appearance.

- [ ] **Step 3: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "style: update layout to clean sports app theme"
```

---

### Task 5: Redesign Collapsed Member Cards

**Files:**
- Modify: `src/routes/+page.svelte:1-125`

- [ ] **Step 1: Rewrite the page component**

Replace the entire content of `src/routes/+page.svelte`:

```svelte
<script lang="ts">
	import type { Standings } from "$lib/types";
	import { slide } from "svelte/transition";
	import StandingsTable from "$lib/components/standings-table/StandingsTable.svelte";
	import GameCard from "$lib/components/game-card/GameCard.svelte";

	export let data: Standings;

	$: winPct = (wins: number, losses: number) => {
		if (wins + losses === 0) return '.000';
		return (wins / (wins + losses)).toFixed(3).replace(/^0/, '');
	};
</script>

<style>
	.container {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.member-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		overflow: hidden;
	}

	.member-header {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 14px;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.header-top {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.position-circle {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		font-weight: 700;
		color: white;
		flex-shrink: 0;
	}

	.position-circle.first {
		background-color: var(--primary-color);
	}

	.position-circle.other {
		background-color: #e5e5e5;
		color: #666;
	}

	.member-name {
		font-size: 16px;
		font-weight: 700;
		flex: 1;
	}

	.streak-badge {
		font-size: 11px;
		font-weight: 700;
		padding: 2px 6px;
		border-radius: 10px;
	}

	.streak-badge.win {
		background-color: #dcfce7;
		color: #16a34a;
	}

	.streak-badge.loss {
		background-color: #fee2e2;
		color: #dc2626;
	}

	.record {
		font-size: 16px;
		font-weight: 700;
		margin-right: 4px;
	}

	.win-pct {
		font-size: 12px;
		color: #888;
	}

	.header-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-left: 36px;
	}

	.today-record {
		font-size: 12px;
		color: #888;
	}

	.games-behind {
		font-size: 12px;
		font-weight: 700;
		color: var(--primary-color);
	}

	.expanded-content {
		padding: 0 14px 14px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.daily-summary {
		text-align: center;
		font-weight: 700;
		font-size: 1.1rem;
	}

	.games-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
</style>

<div class="container">
	{#each data.members as member, i}
		<div class="member-card">
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div class="member-header" on:click={() => member.collapsed = !member.collapsed}>
				<div class="header-top">
					<div class="position-circle" class:first={i === 0} class:other={i > 0}>
						{i + 1}
					</div>
					<div class="member-name">{member.name}</div>
					{#if member.streak}
						<span class="streak-badge" class:win={member.streak.startsWith('W')} class:loss={member.streak.startsWith('L')}>
							{member.streak}
						</span>
					{/if}
					<span class="record">{member.wins}-{member.losses}</span>
					<span class="win-pct">{winPct(member.wins, member.losses)}</span>
				</div>
				<div class="header-bottom">
					<span class="today-record">Today: {member.dailyWins}-{member.dailyLosses}</span>
					<span class="games-behind">
						{#if i === 0}—{:else}{member.gamesBehind} GB{/if}
					</span>
				</div>
			</div>
			{#if !member.collapsed}
				<div class="expanded-content" transition:slide|local={{ duration: 150 }}>
					<div class="daily-summary">
						{member.dailyWins}-{member.dailyLosses} Today
					</div>
					<div class="games-grid">
						{#each member.gamesToday as game}
							<GameCard {game} memberName={member.name} />
						{/each}
					</div>
					<StandingsTable {member} />
				</div>
			{/if}
		</div>
	{/each}
</div>
```

- [ ] **Step 2: Verify collapsed cards render correctly**

Run: `npm run dev`

Check: white cards with rounded corners, orange position circle for #1, gray for rest, streak badge if applicable, record + win % on the right, today's record and GB on the second line.

- [ ] **Step 3: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "style: redesign collapsed member cards with clean sports app look"
```

---

### Task 6: Redesign Game Cards

**Files:**
- Modify: `src/lib/components/game-card/GameCard.svelte:1-66`
- Modify: `src/lib/components/game-card-team/GameCardTeam.svelte:1-56`

- [ ] **Step 1: Rewrite GameCardTeam component**

Replace the entire content of `src/lib/components/game-card-team/GameCardTeam.svelte`:

```svelte
<script lang="ts">
	import type { GameTeam } from "$lib/types";
	import { getTeamColor } from "$lib/team-colors";

	export let team: GameTeam;
	export let showScore: boolean;
	export let memberName: string;

	$: isMemberTeam = memberName === team.memberName;
	$: teamColor = getTeamColor(team.name);
</script>

<style>
	.team-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.team-name {
		font-size: 12px;
		font-weight: 600;
	}

	.team-name.active {
		font-weight: 700;
	}

	.team-score {
		font-weight: 700;
		font-size: 12px;
	}
</style>

{#if team}
	<div class="team-row">
		<span class="team-name" class:active={isMemberTeam} style="color: {teamColor}">
			{team.name}
		</span>
		{#if showScore}
			<span class="team-score">{team.score}</span>
		{/if}
	</div>
{/if}
```

- [ ] **Step 2: Rewrite GameCard component**

Replace the entire content of `src/lib/components/game-card/GameCard.svelte`:

```svelte
<script lang="ts">
	import type { Game } from "$lib/types";
	import GameCardTeam from "$lib/components/game-card-team/GameCardTeam.svelte";
	import { getTeamColor } from "$lib/team-colors";

	export let game: Game;
	export let memberName: string;

	$: opposingMember = game.homeTeam.memberName === memberName
		? game.awayTeam.memberName
		: game.homeTeam.memberName;

	$: borderColor = game.outcome === 'win' ? '#16a34a'
		: game.outcome === 'loss' ? '#dc2626'
		: game.status === 'IN PROGRESS' ? '#f59e0b'
		: '#e5e5e5';

	$: homeColor = getTeamColor(game.homeTeam.name);
	$: awayColor = getTeamColor(game.awayTeam.name);
</script>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 8px;
		background-color: white;
		border-radius: 10px;
		font-size: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
	}

	.h2h-banner {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 10px;
		font-weight: 700;
		color: #666;
		padding-bottom: 4px;
		border-bottom: 1px solid #f0f0f0;
		margin-bottom: 2px;
	}

	.h2h-icon {
		font-size: 11px;
	}

	.bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-top: 1px solid #f0f0f0;
		font-size: 10px;
		padding-top: 4px;
		margin-top: 2px;
	}

	.status {
		font-weight: 600;
		color: #888;
	}

	.status.in-progress {
		color: #f59e0b;
	}

	.status.final {
		color: #16a34a;
	}

	.outcome {
		font-weight: 700;
		font-size: 10px;
	}

	.outcome.win {
		color: #16a34a;
	}

	.outcome.loss {
		color: #dc2626;
	}
</style>

{#if game}
	<div class="card" style="border-left: 3px solid {borderColor}">
		{#if game.isHeadToHead}
			<div class="h2h-banner" style="background: linear-gradient(90deg, {homeColor}11, {awayColor}11)">
				<span class="h2h-icon">⚔</span>
				<span>vs {opposingMember}</span>
			</div>
		{/if}

		<GameCardTeam team={game.homeTeam} showScore={game.showScore} {memberName} />
		<GameCardTeam team={game.awayTeam} showScore={game.showScore} {memberName} />

		<div class="bottom">
			<span class="status" class:in-progress={game.status === 'IN PROGRESS'} class:final={game.status.includes('FINAL')}>
				{game.status}
			</span>
			{#if game.outcome !== 'tbd' && game.outcome !== ''}
				<span class="outcome" class:win={game.outcome === 'win'} class:loss={game.outcome === 'loss'}>
					{game.outcome === 'win' ? 'WIN' : 'LOSS'}
				</span>
			{/if}
		</div>
	</div>
{/if}
```

- [ ] **Step 3: Verify game cards render**

Run: `npm run dev`

Check: cards have colored left border based on outcome, team names appear in team colors, member's team is bolder, head-to-head games show the "⚔ vs Member" banner with a subtle gradient background.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/game-card/GameCard.svelte src/lib/components/game-card-team/GameCardTeam.svelte
git commit -m "style: redesign game cards with team colors and head-to-head banner"
```

---

### Task 7: Redesign Standings Table

**Files:**
- Modify: `src/lib/components/standings-table/StandingsTable.svelte:1-73`

- [ ] **Step 1: Rewrite the StandingsTable component**

Replace the entire content of `src/lib/components/standings-table/StandingsTable.svelte`:

```svelte
<script lang="ts">
	import type { MemberStanding } from "$lib/types";
	import { getTeamColor } from "$lib/team-colors";

	export let member: MemberStanding;

	$: totalWinPct = member.wins + member.losses > 0
		? (member.wins / (member.wins + member.losses)).toFixed(3).replace(/^0/, '')
		: '.000';
</script>

<style>
	table {
		width: 100%;
		text-align: center;
		font-size: 12px;
		border-collapse: collapse;
	}

	thead td {
		color: #999;
		font-size: 11px;
		font-weight: 600;
		padding: 4px 2px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	tbody td {
		padding: 6px 2px;
	}

	.team-cell {
		text-align: left;
	}

	.team-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-weight: 600;
	}

	.team-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.totals {
		font-weight: 700;
		border-top: 2px solid #e5e5e5;
	}

	.totals td {
		padding-top: 8px;
	}

	.diff-positive {
		color: #16a34a;
	}

	.diff-negative {
		color: #dc2626;
	}
</style>

{#if member}
	<table>
		<thead>
			<tr>
				<td class="team-cell">Team</td>
				<td>W-L</td>
				<td>W%</td>
				<td>L10</td>
				<td>Diff</td>
			</tr>
		</thead>
		<tbody>
			{#each member.teams as team}
				<tr>
					<td class="team-cell">
						<div class="team-label">
							<span class="team-dot" style="background-color: {getTeamColor(team.name)}"></span>
							{team.name}
						</div>
					</td>
					<td>{team.wins}-{team.losses}</td>
					<td>{team.winPct > 0 ? team.winPct.toFixed(3).replace(/^0/, '') : '.000'}</td>
					<td>{team.l10 || '-'}</td>
					<td class:diff-positive={team.diff > 0} class:diff-negative={team.diff < 0}>
						{team.diff > 0 ? '+' : ''}{team.diff}
					</td>
				</tr>
			{/each}
			<tr class="totals">
				<td class="team-cell">{member.wins + member.losses} GP</td>
				<td>{member.wins}-{member.losses}</td>
				<td>{totalWinPct}</td>
				<td></td>
				<td class:diff-positive={member.diff > 0} class:diff-negative={member.diff < 0}>
					{member.diff > 0 ? '+' : ''}{member.diff}
				</td>
			</tr>
		</tbody>
	</table>
{/if}
```

- [ ] **Step 2: Verify the table renders**

Run: `npm run dev`

Check: colored dots next to team names, W% column shows win percentages, L10 column shows last-10 records, run diff is green/red, totals row at bottom.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/standings-table/StandingsTable.svelte
git commit -m "style: redesign standings table with team colors, W%, L10"
```

---

### Task 8: Final Integration & Visual Polish

**Files:**
- Modify: `src/routes/+page.svelte` (minor tweaks if needed)
- Modify: `src/routes/+layout.svelte` (minor tweaks if needed)

- [ ] **Step 1: Run dev server and do a full visual check**

Run: `npm run dev`

Walk through the full page:
1. Background is #fafafa
2. Nav is white with soft shadow
3. Collapsed cards show: position circle, name, streak badge, record, win %, today's record, GB
4. Tapping expands with slide animation
5. Expanded view: daily summary, game cards grid, standings table
6. Game cards have colored left borders, team-colored names, head-to-head banner
7. Standings table has colored dots, W%, L10, color-coded diff

- [ ] **Step 2: Fix any visual issues found**

Address spacing, alignment, or color issues. Common things to check:
- Text overflow on small screens
- Streak badge alignment
- Game card grid alignment when odd number of games
- Table column widths

- [ ] **Step 3: Run the build to verify production readiness**

Run: `npm run build`

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "style: final polish for standings page redesign"
```
