<template>
    <div>

    <div class="wrap" :class="{ styled: settings.styled, dark: settings.dark }"
        :style="`transform: translate(${calcTrans}, 0)`">
        <template v-if="stats.teams">
            <div class="team"
                v-for="(team, index) in [...sortTeamsStats(stats.teams), ...sortTeamsStats(stats.teams).slice(0, 5)]"
                :key="team.name + ':' + index">
                <div class="index">{{ (index >= teamLength ? index - teamLength : index) + 1 }}</div>
                <div class="score">{{ getTeamScoreByStatsTeam(team) }}</div>
                <div class="name"><span>{{ team.name }}</span></div>
            </div>
        </template>
        <template v-else-if="liveData.teams">
            <div class="team"
                v-for="(team, index) in [...sortTeamsLive(liveData.teams), ...sortTeamsLive(liveData.teams).slice(0, 5)]"
                :key="team.name + ':' + index">
                <div class="index">{{ (index >= teamLength ? index - teamLength : index) + 1 }}</div>
                <div class="score">{{ getTeamScoreByLiveTeam(team) }}</div>
                <div class="name"><span>{{ team.name }}</span></div>
            </div>
        </template>
    </div>
     <div id="credit1" class="credit dark"><img width="255" src="/img/powered_by_outlined.png"></div>
</div>
</template>

<script>
import {
    getTeamScoreByStatsTeam,
    getTeamScoreByLiveTeam,
    getPlacementPoints,
    sortTeamsLive,
    sortTeamsStats,
    isAlive,
} from "@/utils/overlayUtils.js"

const timer = 5000;

export default {
    props: ["stats", "liveData", "settings", "display"],
    data() {
        return {
            rotated: 0,
            smoothed: 0,
            alive: true,
            timer: Date.now(),
        }
    },
    computed: {
        calcTrans() {
            if (this.settings.smooth) {
                return `${-this.smoothed}px`;
            } else {
                return `${-this.rotated * 1920}px`;
            }
        },
        teamLength() {
            if (this.stats.teams) {
                return this.stats.teams.length
            } else if (this.liveData.teams) {
                return Object.keys(this.liveData.teams).length
            }
            return 0;
        }
    },
    methods: {
        getTeamScoreByStatsTeam,
        getTeamScoreByLiveTeam,
        getPlacementPoints,
        sortTeamsLive,
        sortTeamsStats,
        isAlive,
        rotate() {
            this.rotated++;
            if (this.rotated >= (this.teamLength / 5))
                this.rotated = 0;
        },
        rotateSmooth() {
            let diff = Date.now() - this.timer;

            this.smoothed = (diff / (30 - (this.settings?.speed ?? 15))) % ((this.teamLength / 5) * 1920);
            // if (this.smoothed >= (this.stats?.teams?.length / 5) * 1920)
            //     this.smoothed = 0;
            // this.timer = Date.now();
            if (this.alive) requestAnimationFrame(() => this.rotateSmooth());
        }
    },
    mounted() {
        this.inter = setInterval(() => this.rotate(), timer);
        this.alive = true;
        this.rotateSmooth()
    },
    destroyed() {
        clearInterval(this.inter);
        this.alive = false;
    }
}
</script>
<style lang="scss" scoped>
.wrap {
    color: v-bind("display?.colors?.text");
    display: flex;
    font-size: 25px;
    position: absolute;
    top: 0;
    left: 0;
}

.team {
    display: flex;
}

.index {
    width: 50px;
    text-align: center;
}

.score {
    width: 50px;
    text-align: center;
    margin-left: 1px;
}

.name {
    width: 282px;
    margin-left: 1px;
    padding-left: 10px;
    font-size: 18px;
    display: flex;
    align-items: center;
}

.styled {
    &.wrap {}

    .index {
        background-color: v-bind("display?.colors?.primary");
        color: v-bind("display?.colors?.primaryText");
    }

    .score {
        background-color: v-bind("display?.colors?.secondary");
    }

    .name {
        background-color: v-bind("display?.colors?.secondary");
    }
}

.dark {
    &.wrap {
        color: black;
    }
}

#credit1 {
    left: 42px;
    text-align: center;
    top: 370px;
    position: absolute;
    opacity: .95;
}
</style>