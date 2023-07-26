<template>
    <div >
        <DropMap class="ma-auto" :matchId="matchId" :map="settings.selectedMap" mode="display" :hideMap="!settings.showMap" :style="{width}" :hide-poi-names="!settings.showMap" :hide-drops="!settings.showDrops"></DropMap>
    </div>
</template>


<script>
import DropMap from "@/components/DropMap";

export default {
    props: ["stats", "liveData", "settings", "display", "matchId"],
    components: {
        DropMap
    },
    computed: {
        width() {
            return (this.settings.showMap ? "1080px" : "1023px")
        }
    }
}
</script>
<style scoped>
.ma-auto {
    position: absolute;
    left: 420px;
}
</style>