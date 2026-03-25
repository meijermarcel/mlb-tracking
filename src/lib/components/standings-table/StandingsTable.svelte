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
