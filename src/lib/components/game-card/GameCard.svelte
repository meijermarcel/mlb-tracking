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
