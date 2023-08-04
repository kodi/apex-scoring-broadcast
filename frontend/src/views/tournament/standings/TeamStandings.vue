<template>
    <div v-if="stats && stats.teams">
        <v-data-table class="standing-table" :items-per-page="-1" hide-default-footer :headers="headers"
            :items="teamStats" dense>
            <template v-slot:item.no="{ index }">{{ index + 1 }}</template>
         </v-data-table>
    </div>
</template>

<script>
import { getStatsDisplayOptions, getDisplayName, getStatsByMode } from '@/utils/statsUtils';
export default {
    props: ["stats"],
    data() {
        return {
        }
    },
    computed: {
        headers() {
            return [
                {
                    text: "#",
                    value: "no",
                },
                {
                    text: "Team",
                    value: "name",
                },
                ...getStatsDisplayOptions("team", !!this.stats.games, this.stats.source).map(o => ({
                    text: getDisplayName(o),
                    value: o,
                }))]
        },
        teamStats() {
            return getStatsByMode(this.stats.teams, "team");
        }
    }
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