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

	.team-info {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.team-logo {
		height: 14px;
		width: 14px;
		object-fit: contain;
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
		<div class="team-info">
			<img class="team-logo" src="{team.logoSrc}" alt="" />
			<span class="team-name" class:active={isMemberTeam} style="color: {teamColor}">
				{team.name}
			</span>
		</div>
		{#if showScore}
			<span class="team-score">{team.score}</span>
		{/if}
	</div>
{/if}
