<template>
    <div>
        <PlayerScoreboard v-if="settings.matchType == 'player'" :stats="stats" :overall="overall"></PlayerScoreboard>
        <TeamScoreboard v-else :stats="stats" :overall="overall"></TeamScoreboard>
    </div>
</template>

<script>
import TeamScoreboard from "./subcomponents/TeamScoreboard.vue";
import PlayerScoreboard from "./subcomponents/PlayerScoreboard.vue";

export default {
    components: {
        TeamScoreboard,
        PlayerScoreboard
    },
    props: ["stats", "overall", "settings"],
    data() {
        return {
           
        }
    },
    methods: {
      
    }
}
</script>

<style scoped lang="scss">


</style>