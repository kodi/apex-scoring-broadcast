<template>
    <div class="overall-wrapper">

        <div class="subnav">
            <router-link class="subnav-link"
                :to="{ name: 'tournament.standings.scoreboard', params: $props }">Scoreboard</router-link>
            <router-link class="subnav-link" :to="{ name: 'tournament.standings.player', params: $props }">Player
                Standings</router-link>
            <router-link class="subnav-link" :to="{ name: 'tournament.standings.team', params: $props }">Team
                Standings</router-link>
            <!-- <router-link class="subnav-link"
                :to="{ name: 'tournament.standings.feed', params: $props }">Feed</router-link> -->
        </div>

        <div class="leaderboard-wrap">
            <v-row no-gutters>
                <v-col cols="12" sm="2">
                    <div class="game-select-wrap">
                        <div :class="{ 'selected-game': 'overall' == game }" class="game-select game py-4"
                            @click="setGame('overall')"> Overall</div>
                        <div v-for="g in stats.games" :class="{ 'selected-game': g.game == game }" class="game-select pa-2"
                            @click="setGame(g.game)" :key="g.id">

                            <div class="data-source">
                                <v-tooltip bottom>
                                    <template v-slot:activator="{ on, attrs }">
                                        <div v-bind="attrs" v-on="on" class="game">Game {{ g.game }}</div>
                                    </template>
                                    <span v-html="getSourceDesc(g.source)"></span>
                                </v-tooltip>
                            </div>
                            <div class="map">{{ getMapNameShort(g.map_name) }}</div>
                            <div class="date sub">{{ getDate(g.match_start * 1000) }} {{
                                getTime(g.match_start *
                                    1000)
                            }}</div>

                        </div>
                    </div>
                </v-col>
                <v-col cols="12" sm="10">
                    <router-view :stats="game == 'overall' ? stats : stats.games?.find(g => g.game == game)" :overall="stats"></router-view>
                </v-col>
            </v-row>
        </div>
    </div>
</template>

<script>
import { getMapNameShort } from '../../utils/statsUtils';

export default {
    props: ["organizer", "eventId", "game"],

    data() {
        return {
            stats: [],
        }
    },
    methods: {
        getMapNameShort,
        async updateStats() {
            this.stats = await this.$apex.getStats(this.organizer, this.eventId, "overall");
        },
        setGame(game) {
            this.$router.replace({ params: { game, organizer: this.organizer, eventId: this.eventId } });
        },
        getDate(timestamp) {
            return Intl.DateTimeFormat(navigator.language, { month: 'short', day: 'numeric', year: "numeric" }).format(new Date(timestamp))
        },
        getTime(timestamp) {
            return Intl.DateTimeFormat(navigator.language, { hour: "numeric", minute: "numeric", hour12: true, timeZoneName: "short" }).format(new Date(timestamp));
        },
        getSourceIcon(source) {
            switch (source) {
                case "livedata":
                    return "mdi-star-outline";
                case "statscode":
                    return "mdi-star";
                case "statscode+livedata":
                    return "mdi-star-plus";
            }
        },
        getSourceDesc(source) {
            switch (source) {
                case "livedata":
                    return "<center>DataSource: Livedata  ";
                case "statscode":
                    return "<center>DataSource: StatsCode ";
                case "statscode+livedata":
                    return "<center>DataSource: StatsCode + LiveData";
            }
        }
    },
    watch: {
        game() {
            this.updateStats();
        }
    },
    mounted() {
        if (!this.game) {
            this.setGame("overall");
        } else {
            this.updateStats();
        }
    }
}
</script>

<style scoped lang="scss">
.overall-wrapper {
    // background: $third-tone;
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



.game-select {
    background: $background-content;
    border-radius: 5px;
    color: white;
    text-align: center;
    padding: 3px;
    margin: 3px 7px;
    cursor: pointer;
}

.selected-game {
    background: $primary;
    color: $primary-invert;
}

.leaderboard-wrap {
    padding: 20px 20px;
    margin: auto;
}
</style>