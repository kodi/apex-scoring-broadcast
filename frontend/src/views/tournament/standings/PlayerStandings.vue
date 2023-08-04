<template>
    <div v-if="stats && stats.teams">
        <v-data-table class="standing-table" :items-per-page="-1" hide-default-footer :headers="headers" sort-by="score" :sort-desc="true"
            :items="playerStats" dense>
            <template v-slot:item.no="{ index }">{{ index + 1 }}</template>
            <template v-slot:item.name="{ item }">
                <PlayerLink :player="item">{{ item.name }}</PlayerLink>
            </template>
            <template v-slot:item.characters="{ item }">
                <img class="team-character" v-for="character in item.characters" :key="character" height="25" :src="'/legend_icons/' + character + '.webp'">
            </template>
            <template v-slot:item.characterName="{ item }">
                <img class="team-character"  :key="character" height="25" :src="'/legend_icons/' + item.characterName + '.webp'">
            </template>
        </v-data-table>
</div>
</template>

<script>
import { getStatsDisplayOptions, getDisplayName, getStatsByMode } from '@/utils/statsUtils';
import PlayerLink from '@/components/PlayerLink.vue';
export default {
    props: ["stats"],
    data() {
        return {};
    },
    computed: {
        headers() {
            return [
                {
                    text: "#",
                    value: "no",
                },
                {
                    text: "Player",
                    value: "name",
                },
                ...getStatsDisplayOptions("player", !!this.stats.games, this.stats.source).map(o => ({
                    text: getDisplayName(o),
                    value: o,
                }))
            ];
        },
        playerStats() {
            let stats = getStatsByMode(this.stats.teams, "player", this.stats);
            return stats;
        }
    },
    components: { PlayerLink }
}
</script>

<style>
.standing-table th {
    white-space: nowrap;
    padding: 0 8px !important;
}

.standing-table td {
    padding: 0 8px !important;
}
</style>