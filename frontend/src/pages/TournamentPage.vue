<template>
    <v-app>
        <div class="public-wrapper">
            <NavBar></NavBar>
            <div class="page-header">
                <div class="page-title">{{ title }}</div>
            </div>
            <v-container>
                <div class="page-wrap">
                    <div class="page-nav">
                        <div class="link-container">
                            <router-link class="nav-link"
                                :to="{ name: 'tournament.standings', params: $props }">Standings</router-link>
                            <router-link class="nav-link"
                                :to="{ name: 'tournament.stats', params: $props }">Stats</router-link>
                            <router-link class="nav-link"
                                :to="{ name: 'tournament.drops', params: $props }">Drops</router-link>
                        </div>
                    </div>
                    <div class="content-wrap">
                        <router-view :matchId="matchId" :match="match" :settings="publicSettings"/>
                    </div>
                </div>

            </v-container>

        </div>
        <div class="credit">Created by <a target="_blank" href="https://twitter.com/Double0_">@Double0negative</a>
        </div>
    </v-app>
</template>

<script>
import NavBar from "@/components/NavBar"
export default {
    props: ["matchSlug"],
    components: {
        NavBar
    },
    data() {
        return {
            publicSettings: {},
            match: {},
            eventId: undefined,
            organizer: undefined,
        }
    },
    methods: {
        async refreshPublicOptions() {
            this.match = await this.$apex.getMatchById(this.matchId);

            this.eventId = this.match.eventId;
            this.organizer = this.match.organizer;

            let options = await this.$apex.getPublicSettings(this.matchId);
            if (options) {
                this.publicSettings = options;
            }
        }
    },
    computed: {
        title() {
            return this.publicSettings.title || this.match.organizerName + " - " + this.match.eventId
        },
        matchId() {
            return this.matchSlug.split(".")[0];
        }
    },
    async mounted() {
        
        await this.refreshPublicOptions();
    }
}
</script>
<style lang="scss" scoped>
body {
    width: 100%;
    height: 100%;
    font-family: "Heebo", sans-serif;
}

.credit {
    margin: 5px auto;

    a {
        color: $primary !important;

    }
}
</style>
