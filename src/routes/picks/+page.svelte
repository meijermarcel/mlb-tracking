<script lang="ts">
	import type { PageData } from "./$types";
    import type { MLBGame } from "$lib/types";
    import dayjs from 'dayjs';
	import SubmitPickModal from "$lib/components/submit-pick-modal/SubmitPickModal.svelte";

    export let data: PageData;

    $: ({games} = data);
    // games for today only
    $: gamesFiltered = games.filter((game: MLBGame) => {
        const today = new Date();
        const gameDate = new Date(game.date_time);
        return today.getDate() === gameDate.getDate();
    });

    let selectedGame: MLBGame;
    let viewPickModal = false;
    const possibleMembers = ['Marcel', 'Nate', 'Bob', 'Tom', 'Carter'];
    // const possibleMembers = [];

    function convertDate(date: Date) {
        // use dayjs
        return dayjs(date).format('ddd MMM D, h:mm A');
    }

    function addPlusSign(spread: number) {
        if (spread > 0) {
            return `+${spread}`;
        }
        return spread;
    }

    function selectGame(game: MLBGame, key: string) {
        selectedGame = game;
        selectedGame.selected_key = key;
        viewPickModal = true;
    }
</script>

<style>

    .games {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .game {
        display: flex;
        flex-direction: column;
        gap: 5px;
        /* background-color: whitesmoke; */
        /* border-radius: 7px; */
    }

    .game-time {
        font-weight: bold;
    }

    .game-lines {
        display: flex;
        flex-direction: column;
    }
    
    .game-lines > div {
        display: flex;
        flex-direction: row;
        padding: 5px;
        justify-content: center;
        align-items: center;
    }

    .team-name {
        font-weight: bold;
        font-size: 12px;
        text-align: left;
        flex: 2;
    }

    .line {
        flex: 1;
        text-align: center;
        background-color: whitesmoke;
        border-radius: 7px;
        margin: 2px;
        padding: 5px 0;
        border: 1px solid var(--primary-color);
        color: var(--primary-color);
    }

    .divider {
        height: 2px;
        width: 100%;
        background-color: lightgray;
    }

</style>

{#if viewPickModal}
    <SubmitPickModal game={selectedGame} members={possibleMembers} bind:expanded={viewPickModal}></SubmitPickModal>
{/if}

<h3>Picks</h3>

<div class="games">
    <div class="divider"></div>
    {#each gamesFiltered as game}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="game">
            <div class="game-time">{convertDate(game.date_time)}</div>
            <div class="game-lines">
                <div>
                    <div class="team-name">{game.away_team}</div>
                    <button class="line" on:click={() => selectGame(game, 'away_spread')}>{addPlusSign(game.away_spread)}</button>
                    <button class="line" on:click={() => selectGame(game, 'over')}>O{game.total}</button>
                </div>
                <div>
                    <div class="team-name">{game.home_team}</div>
                    <button class="line" on:click={() => selectGame(game, 'home_spread')}>{addPlusSign(game.home_spread)}</button>
                    <button class="line" on:click={() => selectGame(game, 'under')}>U{game.total}</button>
                </div>
            </div>
        </div>
        <div class="divider"></div>
    {/each}
</div>