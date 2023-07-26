<template>
    <div class="page-wrap content-wrap pa-2">
        <Pagnation v-model="start" :count="count" :total="matches.total"></Pagnation>
        <div class="px-7 pt-5 ma-1 ">
            <v-row no-gutters>
                <v-col md="5" cols="12">Tournament</v-col>
                <v-col md="3" cols="4">Name</v-col>
                <v-col md="3" cols="4" class="px-2">Team</v-col>
                <v-col md="1" cols="4" class="text-right">Score</v-col>
            </v-row>
        </div>
        <MatchLink :matchId="match.matchId" :eventId="match.eventId" :organizer="match.organizerName" v-for="match in matches.data" :key="match.matchId">
            <div class="list-item ma-1 white--text">
                <v-row no-gutters>
                    <v-col md="5" cols="12">{{ getName(match) }} - {{ match.organizerName }}</v-col>
                    <v-col md="3" cols="4">{{ match.playerName }}</v-col>
                    <v-col md="3" cols="4" class="px-2">{{ match.teamName }}</v-col>
                    <v-col md="1" cols="4" class="text-right">{{ match.score }}</v-col>
                </v-row>
            </div>
        </MatchLink>

        <Pagnation v-model="start" :count="count" :total="matches.total"></Pagnation>
</div>
</template>

<script>
import Pagnation from '@/components/Pagnation.vue';
import MatchLink from "@/components/MatchLink.vue"

export default {
    components: {
        Pagnation,
        MatchLink,
    },
    props: ["player", "playerId"],
    data() {
        return {
            matches: {},
            start: 0,
            count: 25,
            search: "",
        }
    },
    methods: {
        async updateMatches() {
            this.matches = await this.$apex.getPlayerMatches(this.playerId, this.start, this.count);
        },
        getName(match) {
            return match.matchName || match.eventId;
        }
    },
    watch: {
        start() {
            this.updateMatches();
        },
        search() {
            this.updateMatches();
        }
    },
    async mounted() {
        await this.updateMatches()
    }
}
</script>
<style scoped lang="scss"></style>