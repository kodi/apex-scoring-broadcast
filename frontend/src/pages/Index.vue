<template>
    <v-app>
        <div class="public-wrapper">
            <nav-bar></nav-bar>
            <div class="page-header">
                <div class="page-title">Recent Tournaments</div>
            </div>

            <div class="recent-wrapper content-wrap">
                <v-row>
                    <v-col cols="12" md="4" lg="3" v-for="match in latest" :key="match.id">
                        <div>
                            <div class="title-toolbar text-center text-uppercase">{{ getName(match) }}</div>
                            <div class="top-team" :class="'team-' + (index + 1)" v-for="(team, index) in match.top3"
                                :key="team.id">
                                <div class="entry-index">
                                    <div class="entry-index-text">{{ index + 1 }}</div>
                                </div>
                                <div class="team-name"> {{ team.name }}</div>
                                <div class="team-score"> {{ team.score }}</div>
                            </div>
                            <div class="view-more">
                                <MatchLink :matchId="match.matchId" :eventId="match.eventId" :organizer="match.organizer">View More</MatchLink>
                            </div>
                        </div>
                    </v-col>
                </v-row>
            </div>


        </div>
        <div class="credit">Created by <a target="_blank" href="https://twitter.com/Double0_">@Double0negative</a></div>
    </v-app>
</template>

<script>
import NavBar from "../components/NavBar.vue"
import MatchLink from "../components/MatchLink.vue"
export default {
    props: ["organizer", "eventId"],
    components: {
        MatchLink,
        NavBar,
    },
    data() {
        return {
            latest: []
        }
    },
    methods: {
        async refreshRecent() {
            let latest = await this.$apex.getLatest();
            console.log(latest)
            if (latest) {
                this.latest = latest;
            }
        },
        getName(match) {
            return match.title || `${match.organizer} - ${match.eventId}`;
        },
    },
    async mounted() {
        await this.refreshRecent();
    }
}
</script>
<style lang="scss" scoped>
body {
    background: black;
    width: 100%;
    height: 100%;
    font-family: "Heebo", sans-serif;
}

.recent-wrapper {
    margin: 30px auto;
    max-width: 1200px;
    // background: $background;
    padding: 40px;
}

.title-toolbar {
    background-color: $second-tone;
}

.public-header {
    height: 150px;
    color: white;
    background: $third-tone;
}

.top-team {
    height: 50px;
    line-height: 50px;
    font-size: 1.2em;
    width: 100%;
    display: flex;
    background-color: $background-content;
    margin: 3px 0px;
}

.team-name {
    padding-left: 10px;
    flex: 1;
    overflow: hidden;
}

.view-more {
    height: 25px;
    background: $second-tone;
    font-size: .9em;
    text-align: center;
}

.view-more a {
    text-decoration: none;
    color: $primary !important;
}

.team-score {
    padding-right: 30px;
}

.entry-index {
    width: 40px;
    text-align: center;
}

.team-1 .entry-index {
    background-color: rgba(255, 200, 0, .3);
}

.team-2 .entry-index {
    background-color: rgba(200, 200, 200, .3);
}

.team-3 .entry-index {
    background-color: rgba(88, 54, 7, 0.3);
}

.credit {
    margin: 5px auto;

    a {
        color: $primary !important;

    }
}
</style>
