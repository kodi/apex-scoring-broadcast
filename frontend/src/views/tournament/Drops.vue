<template>
    <div class="pa-12 text-center" v-if="!settings.drops || settings.drops.enabled == false">
        <i>Drop spots have not been enabled for this tournament</i>
    </div>
    <div v-else class="overall-wrapper">
        <div class="subnav">
            <router-link v-if="this.settings.drops.maps['storm-point']" class="subnav-link"
                :to="{ name: 'tournament.drops', params: { ...$props, map: 'storm-point' } }">Storm Point</router-link>
            <router-link v-if="this.settings.drops.maps['worlds-edge']" class="subnav-link"
                :to="{ name: 'tournament.drops', params: { ...$props, map: 'worlds-edge' } }">Worlds Edge</router-link>
            <router-link v-if="this.settings.drops.maps['kings-canyon']" class="subnav-link"
                    :to="{ name: 'tournament.drops', params: { ...$props, map: 'kings-canyon' } }">Kings Canyon</router-link>
        </div>

        <DropMap class="ma-6" :map="selectedMap" :matchId="match.id" mode="claim" :hide-claim="!this.settings.drops.allowClaiming"></DropMap>

    </div>
</template>

<script>
import DropMap from "@/components/DropMap"

export default {
    props: ["match", "settings", "map"],
    components: { DropMap },

    computed: {
        selectedMap() {
            return this.settings.drops.maps[this.map];
        }
    },
    watch: {
        settings() {
            this.updateMap()
        }
    },
    methods: {
        updateMap() {
            if (!this.map && this.settings?.drops) {
                const map = Object.keys(this.settings.drops.maps)[0];
                this.$router.replace({ params: { map } })
            }
        }
    },  
    mounted() {
        this.updateMap()
    }
}

</script>

<style lang="scss" scoped>
.map-wrap {
    width: 85%;
    margin: auto;
}


</style>