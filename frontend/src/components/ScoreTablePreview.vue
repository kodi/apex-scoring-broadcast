<template>
    <div v-if="stats" class="table-wrap">
        <div v-if="stats.observers" class="pa-8">
            <v-card color="secondary" class="ma-auto" max-width="500px">
                <v-card-title>
                    Observers
                </v-card-title>
                <v-card-text>
                    <div v-for="observer in stats.observers" :key="observer.name">{{ observer.name }}</div>
                </v-card-text>
            </v-card>
        </div>
        <v-row>
            <v-col cols="12" md="5" lg="4" v-for="(team, index) in stats.teams" :key="team.id">
                <v-card color="secondary">
                    <v-card-title>{{ index + 1 }}. {{ team.name }} - {{ team.overall_stats.score }}</v-card-title>
                    <v-card-text>
                        <div v-for="player in team.player_stats" :key="player.id">
                            {{ player.playerName || player.name }} - {{ player.kills }}
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script>
export default {
    props: ['stats'],
}
</script>
<style scoped lang="scss">
.table-wrap {
    max-width: 1000px;
    margin: auto;
}
</style>