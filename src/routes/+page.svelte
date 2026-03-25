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
