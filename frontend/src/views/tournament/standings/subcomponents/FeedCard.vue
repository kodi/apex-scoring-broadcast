<template>
    <v-card class="ma-1" tile>
        <v-card-text class="feed-card text-center first-tone-background pa-0 flex-center">
            <span class="time pa-1">{{ formatTime(feed.timestamp - startTime) }}</span>

            <template v-if="feed.type == 'damage'">
                <span class="type pa-1"><v-icon>mdi-target</v-icon></span>
                <span>{{ nonNullFeed.player.name }} ({{ nonNullFeed.damage }} damage)</span>

                <WeaponIcon :feed="nonNullFeed"></WeaponIcon>

                {{ nonNullFeed.victim.name }} ({{
                    nonNullFeed.victim.currentHealth + nonNullFeed.victim.shieldHealth
                        - feed.damage
                }} hp)
            </template>

            <template v-else-if="feed.type == 'down'">
                <span class="type pa-1"><v-icon>mdi-arrow-down</v-icon></span>
                <span>{{ nonNullFeed.player.name }} </span>

                <WeaponIcon :feed="nonNullFeed"></WeaponIcon>
                {{ nonNullFeed.victim.name }}
            </template>

            <template v-else-if="feed.type == 'kill'">
                <span class="type pa-1"><v-icon>mdi-skull-outline</v-icon></span>
                <span>{{ nonNullFeed.player.name }}</span>
                <WeaponIcon :feed="nonNullFeed"></WeaponIcon>

                {{ nonNullFeed.victim.name }}
            </template>

            <template v-else-if="feed.type == 'eliminated'">
                <span class="type pa-1">[Eliminated]</span>
                <span>({{ nonNullFeed.team[0].teamName }}) {{ nonNullFeed.team.map(p => p.name).join(", ") }}</span>
                {{ nonNullFeed.victim.name }}
            </template>

            <template v-else>
                <span class="type pa-1">[{{ feed.type }}]</span>
                <span>{{ nonNullFeed.player.name }}</span>
            </template>
        </v-card-text>
    </v-card>
</template>


<script>
import WeaponIcon from '@/components/WeaponIcon.vue';

export default {
    props: ['feed', "startTime"],
    components: {
        WeaponIcon
    },
    computed: {
        nonNullFeed() {
            return {
                type: "",
                player: {},
                victim: {},
                damage: 0,
                ...this.feed,
            }
        }
    },
    methods: {
        formatTime(seconds) {
            if (seconds < 60) {
                return seconds + "s";
            } else {
                return Math.floor(seconds / 60) + ":" + (seconds % 60);
            }
        }
    }
}
</script>

<style scoped>
.time {
    width: 40px;
    text-align: right;
    color: white;
}

.type {
    color: white;
}

.feed-card {
    height: 43px;
    margin: 2px;
}

.flex-center {
    align-items: center;
    display: flex;
    /* justify-content: center; */
}
</style>