<template>
    <div>
        <div class="actions"></div>
        
        <div>
            <v-row class="header-row" no-gutters>
                <v-col sm="7" cols="8"></v-col>
                <v-col sm="2" cols="3" class="score">Score </v-col>
                <v-col sm="3" cols="1" class="score">Kills</v-col>
                <v-btn icon class="float-icon expand-all" @click="toggleExpand"><v-icon>{{
                    expandedAll
                    ? 'mdi-menu-up' : 'mdi-menu-down'
                }}</v-icon></v-btn>
            </v-row>
        </div>
        <div class="entry-wrapper" v-for="(team, index) in stats.teams" :key="team.id">
            <div class="entry-index">
                <div class="entry-index-text">{{ index + 1 }}</div>
            </div>

            <div class="leaderboard-container">
                <div class="entry-main">
                    <div class="entry-header">
                        <v-row class="entry-header-row">
                            <v-col sm="7" cols="8" class="team-name">
                                {{ team.name }} 
                                <IconSpan v-for="(p,i) in getPlacement(team)" :key="i" :icon="'trophy'" class="win-icon" :class="`win-icon-${p}`"></IconSpan>
                            </v-col>
                            <v-col sm="2" cols="2" class="score">{{ team.overall_stats.score }} </v-col>
                            <v-col sm="3" cols="2" class="score">{{ team.overall_stats.kills }}</v-col>
                            <v-btn icon class="float-icon" @click="updateExpanded(team.name)"><v-icon>{{
                                expanded[team.name]
                                ? 'mdi-menu-up' : 'mdi-menu-down'
                            }}</v-icon></v-btn>

                        </v-row>

                    </div>
                    <div v-if="expanded[team.name]" class="entry-players entry-sub">
                       <table class="expanded-table">
                                <thead>
                                    <tr>
                                        <td>&nbsp;</td>
                                        <td v-for="key in statsKeys" :key="key" class="text-capitalize">{{ key != 'characterName' ? getDisplayName(key) : ""}}</td>
                                    </tr>
                                </thead>
                                <tr v-for="player in team.player_stats" :key="player.id" class="text-right pr-5 text-capitalize">
                                    <td class="expanded-player-name"><PlayerLink :player="player">{{ player.name }}</PlayerLink></td>
                                    <td v-for="key in statsKeys" :key="key">
                                        <template v-if="key == 'characterName'">
                                             <template v-if="player.characters"><img class="team-character"
                                            v-for="character in player.characters" :key="character" height="25"
                                            :src="'/legend_icons/' + character + '.webp'"></template>
                                            <img v-else class="team-character" height="25"
                                                :src="'/legend_icons/' + player.characterName + '.webp'">
                                        </template>
                                        <template v-else>
                                            {{ player[key] }}
                                        </template>
                                    </td>
                                </tr>
                                <tr class="text-right pr-5 text-capitalize">
                                    <td class="expanded-player-name">{{ team.name }}</td>
                                    <td v-for="key in statsKeys" :key="key" >{{ team.overall_stats[key] }}</td>
                                </tr>
                            </table>
                    </div>

                </div>
            </div>
        </div>
</div>
</template>

<script>
import { getDisplayName } from '@/utils/statsUtils';
import PlayerLink from '@/components/PlayerLink.vue';
import IconSpan from "@/components/IconSpan.vue";

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
    methods: {
        getDisplayName,
        updateExpanded(index) {
            this.$set(this.expanded, index, !this.expanded[index]);
        },
        toggleExpand() {
            this.expandedAll = !this.expandedAll;
            this.stats.teams.forEach(team => this.updateExpanded(team.name))
        },
        getPlacement(team) {
            if(this.stats.games)
                return this.stats.games.map(game => game.teams.find(t => t.teamId == team.teamId)?.overall_stats?.teamPlacement || 0).sort();
        }
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
    display: none;

    &.win-icon-1 {
        display: inline;
        color: #fb0;
    }

    &.win-icon-2 {
        display: inline;
        color: rgb(120, 118, 113);
    }

    &.win-icon-3 {
        display: inline;
        color: rgb(140, 54, 5);
    }
}
.expand-all {
    margin-top: -16px;
}
.entry-index {
    width: 40px;
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
        margin:  0;
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