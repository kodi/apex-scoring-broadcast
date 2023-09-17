<template>
    <div class="d">
        <v-row v-if="liveData">
            <v-col cols="12" sm="6" md="4" lg="3" v-for="team in liveData.teams" :key="team.teamId">
                <v-card>
                    <v-card-title>
                        {{ team[0].teamName }}
                    </v-card-title>
                    <v-card-text>
                    <div v-for="player in team" :key="player.name">
                        <div class="name-line">
                            <img class="team-character" height="30"
                                :src="'/legend_icons/' + player.character + '.webp'">
                                <span class="pa-2">{{ player.name }}</span>
                                <span class="pa-2">{{ player.kills }}</span>
                                <WeaponIcon hide-unknown :feed="{weapon: getWeaponName(player.currentWeapon)}"></WeaponIcon></div>
                        <div v-if="player.status == 'alive'" class=" prog-bar"
                            :style="{ width: (player.maxHealth + player.shieldMaxHealth) + 'px' }">
                            <div class="hb health" :style="{ width: player.currentHealth + 'px' }"></div>
                            <div class="hb sheild"
                                :style="{ left: player.currentHealth + 'px', width: player.shieldHealth + 'px', backgroundColor: getShieldColor(player.shieldMaxHealth) }">
                            </div>
                        </div>
                    </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        
    </div>
</template>

<script>
import WeaponIcon from '@/components/WeaponIcon.vue';
import { getWeaponName } from "@/utils/statsUtils";
export default {
    props: ["liveData"],
    components: {
        WeaponIcon,
    },
    methods: {
        getShieldColor(health) {
            switch (health) {
                case 50:
                    return "grey";
                case 75:
                    return "blue";
                case 100:
                    return "purple";
                case 125:
                    return "red";

            }
        },
        getWeaponName,
    }
}
</script>

<style scoped> 
.d {
     color: white;
 }

.prog-bar {
    background-color: black;
    height: 5px;
    display: inline-block;
}

.hb {
    position: relative;
    left: 0;
    top: 0;
    background-color: blue;
    height: 5px;
}

.health {
    background-color: darkred;
}

.sheild {
    background-color: blue;
    top: -5px;
}
table {
    width: 100%;
}
.name-line {
    display: flex;
    align-items: center;
}



</style>