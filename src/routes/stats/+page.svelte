<script lang="ts">
	import type { Stats, MemberStat, SelectValue } from "$lib/types";
    import ItemSelect from "$lib/components/item-select/ItemSelect.svelte";
    import StatView from "$lib/components/stat-view/StatView.svelte";
    export let data: Stats;

    let selectedStat = "hr" as const;

    const availableStats: SelectValue[] = [
        { label: "HR", value: "hr" },
        { label: "RBI", value: "rbi" },
        { label: "AVG", value: "avg" },
    ];

    // function to assign selectedStat and sort members by that stat
    // function sortMembersByStat(stat: any) {
    //     selectedStat = stat;
    //     data.members = data.members.sort((a, b) => b.batting[selectedStat] - a.batting[selectedStat]);
    // }

</script>

<style>
    .stat-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    h3 {
        margin: 0;
        color: gray;
    }
</style>

<div class="stat-list">
    <h3>Batting</h3>
    {#each data.batting as stat}
        <StatView {stat}></StatView>
    {/each}
    <h3>Pitching</h3>
    {#each data.pitching as stat}
        <StatView {stat}></StatView>
    {/each}
</div>
