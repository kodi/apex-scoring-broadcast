<template>
    <div>
        <div v-if="!liveData || game == 'overall'" class="overall text-center"><i>Please choose a game</i></div>
        <div v-else-if="liveData.err" class="overall text-center"><i>{{ liveData.msg }}</i></div>
        <template v-else>
            <v-virtual-scroll :items="liveData.feed" height="600" item-height="45">
                <template #default="{ item }">
                    <FeedCard :feed="item" :startTime="liveData.match_start"></FeedCard>
                </template>
            </v-virtual-scroll>
        </template>
    </div>
</template>


<script>
import FeedCard from "./subcomponents/FeedCard.vue";

export default {
    data() {
        return {
            liveData: undefined,
        }
    },
    components: { FeedCard },
    props: ["matchId", "game"],
    methods: {
        async getLiveData() {
            this.liveData = await this.$apex.getLiveData(this.matchId, this.game);
        }
    },
    watch: {
        game() {
            this.getLiveData();
        }
    },
    mounted() {
        this.getLiveData();
    }
}
</script>

<style scoped>
.feed-wrap {
    max-height: 60vh;
    overflow: auto;
}
</style>