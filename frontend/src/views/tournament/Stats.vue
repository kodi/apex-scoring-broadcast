<template>
    <div class="overall-wrapper">

        <div class="subnav">
            <router-link class="subnav-link" :to="{ name: 'tournament.stats.point-ratio', params: $props }">Point
                Ratio</router-link>
            <router-link class="subnav-link" :to="{ name: 'tournament.stats.pick-rate', params: $props }">Legend
                Pick Rates</router-link>
            <router-link class="subnav-link" :to="{ name: 'tournament.stats.charts', params: $props }">Cumulative
                Charts</router-link>
            <!-- <router-link class="toolbar-link"
                        :to="{ name: 'tournament.stats.game-charts', params: $props }">Game Charts</router-link>
                    -->

        </div>

        <div class="leaderboard-wrap">
            <router-view :stats="stats"></router-view>
        </div>
    </div>
</template>

<script>

export default {
    props: ["matchId"],

    data() {
        return {
            stats: [],
            gameList: []
        }
    },
    methods: {
        async updateStats() {
            this.stats = await this.$apex.getStats(this.matchId, "stacked");
        },
        getDate(timestamp) {
            return Intl.DateTimeFormat(navigator.language, { month: 'short', day: 'numeric', year: "numeric" }).format(new Date(timestamp))
        },
        getTime(timestamp) {
            return Intl.DateTimeFormat(navigator.language, { hour: "numeric", minute: "numeric", hour12: true, timeZoneName: "short" }).format(new Date(timestamp));
        }
    },
    watch: {
        game() {
            this.updateStats();
        }
    },
    mounted() {
        this.updateStats();
    }
}
</script>

<style scoped lang="scss">
.overall-wrapper {
    max-width: 1200px !important;
    margin: auto;
}

.date {
    text-transform: capitalize;
}

.map {
    font-size: .8em;
}

.sub {
    font-size: .6em;
    opacity: .7;
}

.leaderboard-wrap {
    padding: 30px;
    margin: auto;
}
</style>