<template>
    <div>
        <div class="actions"></div>

        <div>
            <v-row class="header-row" no-gutters>
                <v-col cols="8"></v-col>

                <v-col md="1" cols="1" class="score">Score </v-col>
                <v-col md="2" cols="2" class="score" v-if="stats.games">Avg Pl. </v-col>
                <v-col md="1" cols="1" class="score">Kills</v-col>
                <v-btn icon class="float-icon expand-all" @click="toggleExpand"><v-icon>{{
                    expandedAll
                    ? 'mdi-menu-up' : 'mdi-menu-down'
                }}</v-icon></v-btn>
            </v-row>
        </div>
        <div class="entry-wrapper" v-for="(player, index) in playerStats" :key="player.playerId">
            <div class="entry-index">
                <div class="entry-index-text">{{ index + 1 }}</div>
            </div>

            <div class="leaderboard-container">
                <div class="entry-main">
                    <div class="entry-header">
                        <v-row class="entry-header-row">
                            <v-col sm="4" md="5" cols="8" class="team-name">
                                {{ player.name }}

                            </v-col>
                            <v-col sm="4" md="3" cols="0" class="text-right d-none d-sm-block">
                                <IconSpan v-for="(p, i) in getPlacement(player.playerId)" :key="i" icon="trophy" class="win-icon"
                                    :class="`win-icon-${p}`"></IconSpan>
                            </v-col>
                            <v-col md="1" cols="1" class="score">{{ player.score }} </v-col>
                            <v-col md="2" cols="2" class="score" v-if="stats.games">{{ getAvgPlacement(player.playerId) }} </v-col>
                            <v-col md="1" cols="1" class="score">{{ player.kills }}</v-col>
                            <v-btn icon class="float-icon" @click="updateExpanded(player.playerId)"><v-icon>{{
                                expanded[player.playerId]
                                ? 'mdi-menu-up' : 'mdi-menu-down'
                            }}</v-icon></v-btn> 

                        </v-row>

                    </div>
                    <div v-if="expanded[player.playerId]" class="entry-players entry-sub">
                        <table class="expanded-table">
                            <thead>
                                <tr>
                                    <td>&nbsp;</td>
                                    <td v-for="key in statsKeys" :key="key" class="text-capitalize">{{ key !=
                                        'characterName' ? getDisplayName(key) : "" }}</td>
                                </tr>
                            </thead>
                            <tr v-for="game in statsForPlayer(player.playerId)" :key="game.index"
                                class="text-right pr-5 text-capitalize">
                                <td class="expanded-player-name">
                                    Game {{ game.index + 1 }} 
                                </td>
                                <td v-for="key in statsKeys" :key="key">
                                    <template v-if="key == 'characterName'">
                                        <img  class="team-character" height="25"
                                            :src="'/legend_icons/' + game.stats.characterName + '.webp'">
                                    </template>
                                    <template v-else>
                                        {{ game.stats[key] }}
                                    </template>
                                </td>
                            </tr>
                            <tr class="text-right pr-5 text-capitalize">
                                <td class="expanded-player-name"><PlayerLink :player="player">{{player.name}}</PlayerLink></td>
                                <td v-for="key in statsKeys" :key="key">
                                    <span v-if="key == 'teamPlacement'">{{getAvgPlacement(player.playerId)}} avg.</span>
                                    <span v-else>{{ player[key] }}</span>
                                </td>
                            </tr>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {  getDisplayName, getStatsByMode } from '@/utils/statsUtils';

import PlayerLink from '@/components/PlayerLink.vue';
import IconSpan from "@/components/IconSpan.vue";
import _ from "lodash";

export default {
    components: {
        PlayerLink,
        IconSpan,
    },
    props: ["stats", "overall"],
    data() {
        return {
            expanded: {},
            expandedAll: false,
            statsKeys: [
                "characterName",
                "teamPlacement",
                "kills",
                "damageDealt",
                "knockdowns",
                "headshots",
                "assists",
                "shots",
                "hits",
                "respawnsGiven",
                "revivesGiven",
            ]
        }
    },
    computed: {
        playerStats() {
            let stats = getStatsByMode(this.stats.teams, "player", this.stats);
            return stats.sort((a, b) => b.score - a.score);
        },
        playerGameStats() {
            return this.overall.games.map(game => game.teams.map(t => t.player_stats).flat());
        }
    },
    methods: {
        getDisplayName,
        updateExpanded(index) {
            this.$set(this.expanded, index, !this.expanded[index]);
        },
        toggleExpand() {
            this.expandedAll = !this.expandedAll;
            this.playerStats.forEach(player => this.updateExpanded(player.playerId))
        },
        getPlacement(player) {
            if (this.stats.games)
                return this.statsForPlayer(player, false).map(s => s.stats?.teamPlacement ?? 0);
        },
        getAvgPlacement(player) {
            let stats = this.getPlacement(player).filter(s => s > 0);
            return (_.sum(stats) / stats.length).toFixed(1);
        },
        statsForPlayer(playerId, filter = true) {
            return this.playerGameStats.map((game, index) => ({index, stats: game.find(p => p.playerId == playerId) })).filter(game => !filter || game.stats);
        },
        
    }
}
</script>

<style scoped lang="scss">
.actions {
    text-align: right;
}

.entry-wrapper {
    display: flex;
    color: white;
    margin-bottom: 5px;
    // box-shadow: 0px 0px 10px #ffffff99;
    border-radius: 6px;
    overflow: hidden;
}

.win-icon {
    font-size: .7em;
    color: #000;
    // display: none;

    &.win-icon-0 {
        display: inline;
        color: #0003;
    }
    &.win-icon-1 {
        display: inline;
        color: #fb0;
    }

    &.win-icon-2 {
        display: inline;
        color: rgb(185, 184, 181);
    }

    &.win-icon-3 {
        display: inline;
        color: rgb(192, 79, 14);
    }

}

.expand-all {
    margin-top: -16px;
}

.entry-index {
    width: 50px;
    font-size: 1.2em;
    padding: 10px;
    text-align: center;
    background: #{$primary};
    color: $primary-invert;
    display: flex;
}

.team-name {
    overflow: hidden;
}

.expanded-table {
    margin: auto;
    border-collapse: collapse;

    td {
        padding: 3px 7px;
        // border: 1px solid black;
        margin: 0;
        vertical-align: middle;
    }

    img {
        margin-top: 2px;
    }

    tr:nth-child(even) {
        background: $first-tone;
    }

    thead {
        text-align: right;
    }

    .expanded-player-name {
        width: 150px;
    }
}

.entry-index-text {
    align-self: center;
    width: 100%;
}

.entry-header-row {
    padding-right: 25px;
}

.header-row {
    font-size: .7em;
    padding-left: 40px;
    padding-right: 25px;
    white-space: nowrap;
    text-align: center;
    margin-top: -16px;
    padding-bottom: 2px;
    position: relative;
}

.entry-main {
    flex-grow: 1;
    background: $background-content;
}

.float-icon {
    position: absolute;
    right: 2px;
    top: 7px;
}

.entry-header {
    padding: 10px;
    font-size: 1.2em;
    position: relative;
}

.entry-sub {
    background: $second-tone;
    font-size: .8em;
    overflow: auto;
    width: 100%;
}

.table-header {
    font-size: 1.2em;
}

.entry-player {
    display: flex;
}

.score {
    text-align: center;
}

.entry-players .col {
    border: 1px solid rgb(20, 10, 10);
    border-left: none;
    border-bottom: none;
    padding: 8px;
}

.leaderboard-container {
    flex-grow: 1;
    width: 100%;
}

.v-icon {
    font-size: .8em;
    padding: 2px;
    padding-bottom: 5px;
}
</style>