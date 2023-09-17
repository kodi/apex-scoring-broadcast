<template>
    <span>
        <img v-show="loaded" class="white-svg pa-2" style="transform: scaleX(-1);" height="30"
            :src="`/weapon_icons/${feed.weapon}.svg`" @load="loaded = true" />
        <span class="pa-2 white--text" v-if="!loaded && hideUnknown != ''">[{{ feed.weapon }}]</span>
    </span>
</template>

<script>
export default {
    props: ["feed", "hideUnknown"],
    data() {
        return {
            loaded: false,
        }
    }, 
    watch: {
        feed() {
            this.loaded = false;
        }
    }
}
</script>

<style scoped>
.white-svg {
    filter: invert(100%) sepia(100%) saturate(0%) hue-rotate(146deg) brightness(105%) contrast(101%);
}
</style>