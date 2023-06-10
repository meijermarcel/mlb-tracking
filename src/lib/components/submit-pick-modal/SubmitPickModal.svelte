<script lang="ts">
    import { slide, fade } from "svelte/transition";
    import type { MLBGame } from "$lib/types";
    import dayjs from 'dayjs';

    export let game: MLBGame;
    export let expanded = false;
    export let members: string[] = [];

    $: pickContents = getPickContents();

    function formatSpread(spread: number) {
        if (spread > 0) {
            return `+${spread}`;
        }
        return `${spread}`;
    }

    function convertDate(date: Date) {
        // use dayjs
        return dayjs(date).format('h:mm A');
    }

    function getPickContents() {
        if (members.length > 0) {
            game.selected_member = members[0];
        }

        let contents = {
            pick: '',
            matchup: '',
            game_time: '',
        }

        contents.matchup = game.away_team + ' @ ' + game.home_team;
        contents.game_time = convertDate(game.date_time);

        if (game.selected_key === 'over') {
            contents.pick = 'Over ' + game.total;
        } else if (game.selected_key === 'under') {
            contents.pick = 'Under ' + game.total;
        } else if (game.selected_key === 'away_spread') {
            contents.pick = game.away_team + ' ' + formatSpread(game.away_spread);
        } else if (game.selected_key === 'home_spread') {
            contents.pick = game.home_team + ' ' + formatSpread(game.home_spread);
        }

        return contents;
    }

    function submitPick() {
        const pick = {
            selected_key: game.selected_key,
            selected_member: game.selected_member,
        }

        fetch('/api/games', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pick),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        });
    }
</script>

<style>
    .shade {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 100;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .modal {
        background-color: white;
        border-radius: 7px;
        padding: 1rem;
        width: 80%;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
    }

    h3 {
        margin: 0;
    }

    .modal-header button {
        background-color: transparent;
        color: var(--primary-color);
        border: none;
    }

    .pick-container {
        display: flex;
        flex-direction: column;
        /* gap: 10px; */
        border: 1px solid var(--primary-color);
        border-radius: 12px;
        overflow: hidden;
        /* background-color: var(--accent-color); */
        background-image: linear-gradient(to right bottom, #d8d8d8, #e0dee0, #ebe4e6, #f5e9e9, #fef0eb);
        /* background-image: linear-gradient(to right bottom, #ff3e00, #ff7544, #ffa07a, #ffc9b1, #fef0eb); */
    }

    .pick-container > div {
        display: flex;
        justify-content: space-between;
        padding: 15px;
    }

    .game-info {
        font-size: 12px;
        flex-direction: column;
        /* color: var(--blue); */
        font-weight: 600;
    }

    .line {
        border-bottom: 1px solid var(--primary-color);
        background-color: var(--primary-color);
        color: white;
        /* font-size: 14px; */
    }

    .line .pick {
        font-weight: bold;
    }

    .modal-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .modal-content button {
        background-color: transparent;
        color: var(--primary-color);
        font-weight: bold;
        border: 1px solid var(--primary-color);
        border-radius: 5px;
        padding: 0.5rem 1.5rem;
        background-image: linear-gradient(to right bottom, #d8d8d8, #e0dee0, #ebe4e6, #f5e9e9, #fef0eb);
        /* background-image: linear-gradient(to right bottom, #ff3e00, #ff5826, #ff6e40, #ff8158, #ff9370); */
    }

    .choose-member {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .choose-member label {
        font-weight: 600;
        font-size: 12px;
        color: gray
    }

    .choose-member select {
        padding: 0.5rem;
        border-radius: 5px;
        border: 1px solid var(--primary-color);
        --webkit-appearance: none;
    }
</style>

<div class="shade" transition:fade={{ duration: 100 }}>
    <div class="modal" transition:slide={{ duration: 300 }}>
        <div class="modal-header">
            <h3>Submit Pick</h3>
            <div>
                <button on:click={() => expanded = false }>Close</button>
            </div>
        </div>
        <div class="modal-content">
            <div class="pick-container">
                <div class="line">
                    <div class="pick">{pickContents.pick}</div>
                </div>
                <div class="game-info">
                    <div>{pickContents.matchup}</div>
                    <div>{pickContents.game_time}</div>
                </div>
            </div>
            {#if members.length > 0}
                <div class="choose-member">
                    <label for="member">This pick is for</label>
                    <select name="member" id="member" bind:value={game.selected_member}>
                        {#each members as member}
                            <option value={member}>{member}</option>
                        {/each}
                    </select>
                </div>
                <div class="text-center">
                    <button on:click={() => submitPick()}>Submit</button>
                </div>
            {:else}
                <div class="text-center">
                    <p>All members have a pick for today</p>
                </div>
            {/if}
        </div>
    </div>
</div>