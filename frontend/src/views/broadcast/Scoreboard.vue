<template>
  <div :class="{ 'styled': settings.styled }">
    <div class="scoreboard-wrap">
      <div class="scoreboard-header-wrap">
        <div class="scoreboard-header" :class="{ 'scoreboard-header-styled': settings.styled }">
          <div v-if="settings.styled" class="scoreboard-header-backing"></div>
          <div class="scoreboard-header-text">{{ title }} </div>
        </div>
      </div>
      <div class="overall-wrap" v-if="(stats && stats.teams)" :class="{ 'overall-wrap-styled': settings.styled }">
        <div class="table-wrap">
          <div class="row-wrap">
            <div class="column" v-for="index in settings?.single ? 1 : 2" :key="index">
              <div class="score-wrap table-header">
                <div class="score-item score-index">
                  <div>&nbsp;#&nbsp;</div>
                </div>
                <div class="score-item score-name">
                  <div>{{ settings.mode == "team" ? "Team" : "Player" }}
                  </div>
                </div>
                <div class="score-item score-value score-header">
                  <template v-if="settings.display2">&nbsp;{{ getDisplayName(settings.display) }}&nbsp;</template>
                </div>
                <div class="score-item score-value score-header">
                  &nbsp;{{ getDisplayName(settings.display2 || settings.display) }}&nbsp;
                </div>
              </div>
            </div>
            <component :is="settings.animate ? 'transition-group' : 'dev'" name="score-transition">
              <div class="column" :class="'transition-' + (score?.index - offset)" v-for="(score, index) in sortedScores" :i="score?.name + index + settings.display" :key="score?.name + settings.display + settings.game" sm="6">
                <div v-if="score && !score.fill" class="score-wrap">
                  <div class="score-item score-index" :class="{ 'score-index-styled': settings.styled }"> {{ score.index }}
                  </div>
                  <div v-if="settings.mode == 'team'" class="score-item score-name"
                    :class="{ 'score-name-styled': settings.styled }">
                    <div class="team-name-character-wrapper"
                      :class="{ 'team-name-wrapper-override': score.name.length > 14 }">
                      <div class="team-name" :class="{ 'team-name-override': score.name.length > 14 }"> {{ score.name }}
                      </div>
                      <template v-if="settings.showCharacters">
                        <div class="character-wrap score-item" :class="{ 'character-wrap-styled': settings.styled }"
                          v-if="settings.mode == 'team'">
                          <img class="team-character" v-for="character in getCharacters(score.teamId)" :key="character"
                            height="26" :src="'/legend_icons/' + character + '.webp'">
                        </div>
                      </template>
                    </div>
                    <div class="score-player-names" v-if="settings.mode == 'team'">
                      <span v-for="player in getPlayers(score.teamId)" :key="player.name">
                        {{ cleanPlayerName(score.name, player.name) }} &nbsp;</span>
                    </div>
                  </div>
                  <div v-else class="score-item score-name score-player-name padding-zero"
                    :class="{ 'score-name-styled': settings.styled }">
                    <span v-if="settings.mode == 'player' && settings.showCharacters"
                      class="character-wrap-player score-item" :class="{ 'character-wrap-styled': settings.styled }">
                      <img v-for="character in score.characters || [score.characterName]" :key="character" height="70"
                        :src="'/legend_icons/' + character + '.webp'">
                    </span>
                    <span class="fix-player-name" :style="{ 'top': settings.showCharacters ? '-25px' : '5px' }">{{
                      settings.mode ==
                      'player' ?
                      score.name : cleanPlayerName(score.teamName, score.playerName) }}</span>
                  </div>
                  <div class="score-item score-value" :class="{ 'score-value-styled': settings.styled }">
                    <template v-if="settings.display2">&nbsp;{{ score[settings.display] }}&nbsp;</template>
                  </div>
                  <div class="score-item score-value" :class="{ 'score-value-styled': settings.styled }">
                    &nbsp;{{ score[settings.display2 || settings.display] }}&nbsp;
                  </div>
                </div>
              </div>
            </component>
          </div>
        </div>
      </div>
    </div>
    <!-- <div id="credit1" class="credit dark"><img width="400" src="/img/powered_by_outlined.png"></div>
    <div id="credit2" class="credit dark"><img width="400" src="/img/powered_by_outlined.png"></div> -->
    <div id="credit1" class="credit dark"><img width="180" src="/img/powered_by_outlined.png"></div>

  </div>
</template>

<script>
import _ from "lodash";
import { sortScores, getDisplayName, getStatsByMode, getCharactersByTeam, getPlayersByTeam } from "@/utils/statsUtils";

const pad_array = function (arr, len, fill) {
  return arr.concat(Array(len).fill(fill)).slice(0, len);
};

const defScore = {
  name: "",
  fill: true,
}

export default {
  props: ["stats", "settings", "display"],

  computed: {
    sortedScores() {
      let scores = sortScores(this.scoresByMode, this.settings.display);

      scores = scores.length < 20 ? pad_array(scores, 20, defScore) : scores;

      scores.forEach((score, index) => {
        if (score.name || score.name) score.index = index + 1;
      });


      if (!this.settings.single) {
        let start = scores.slice(this.offset, this.offset + 10);
        let end = scores.slice(this.offset + 10, this.offset + 20);
        return _.zip(start, end).flat();
      }
      else {
        return scores.slice(this.offset, this.offset + 10);
      }
    },
    offset() {
      return (parseInt(this.settings.page ?? 1) - 1) * (this.settings?.single ? 10 : 20);
    },
    teams() {
      if (this.settings.game == "overall")
        return this.stats.teams
      else
        return this.stats.games[parseInt(this.settings.game) - 1 || 0]?.teams ?? [];
    },
    scoresByMode() {
      return getStatsByMode(this.teams, this.settings.mode, this.stats)
    },
    title() {
      if (this.settings.header) {
        if (this.settings.game == "overall") {
          return "Leaderboard"
        } else {
          return `Game ${this.settings.game}`
        }
      } else {
        return " "
      }
    }
  },
  methods: {
    cleanPlayerName(team, player) {
      return player.replace(team + "_", "").replace(team, "").trim();
    },
    getDisplayName(display) {
      return getDisplayName(display);
    },
    getPlayers(team) {
      return getPlayersByTeam(this.teams, team);
    },
    getCharacters(team) {
      return getCharactersByTeam(this.teams, team);
    },
  },
};
</script>

<style scoped lang="scss">
.scoreboard-wrap {
  position: absolute;
  width: 1920px;
  height: 1080px;
  color: v-bind("display?.colors?.text");

}

.styled {
  .scoreboard-wrap {
    background: v-bind("display?.colors?.background");
  }

  .scoreboard-header-backing {
    position: absolute;
    width: 100%;
    left: 0;
    top: 0;
    border-top: 80px solid;
    border-top-color: v-bind("display?.colors?.primary");
    border-right: 40px solid transparent;
    border-left: v-bind("settings.single ? '40px solid transparent' : 'none'");
  }



  .score-index {
    background-color: v-bind("display?.colors?.primary");
  }

  .score-name {
    background: v-bind("display?.colors?.secondary");
  }

  .score-value {
    background: v-bind("display?.colors?.secondary");
  }

}

.scoreboard-header-text {
  color: v-bind("display?.colors?.primaryText");
}


.table-header .score-item {
  background: transparent;
  color: v-bind("display?.colors?.secondaryText");

}

.scoreboard-header-wrap {
  position: absolute;
  top: 50px;
  height: 150px;
  width: 100%;
}

.white-text {
  color: white;
}

.scoreboard-header {
  width: v-bind("settings.single ? '50%' : '40%'");;
  /* margin: auto; */
  font-family: "Heebo", sans-serif;
  font-size: 50px;
  line-height: 80px;
  text-align: center;
  position: relative;
  margin: v-bind("settings.single ? 'auto' : 0");
}

.scoreboard-header-text {
  position: absolute;
  text-align: center;
  width: 100%;
}

.overall-wrap {
  font-family: "Heebo", sans-serif;
  width: 100%;
}

.table-header .score-item {
  height: 23px;
  line-height: 20px;
  font-size: 18px;
  white-space: nowrap !important;
  overflow: visible;
}

.score-wrap.table-header {
  height: 25px;
}

.score-wrap {
  margin: auto;
  width: 680px;
  height: 83px;
}

.column {
  display: inline-block;
  width: v-bind("settings.single ? '100%' : '50%'");
}


@for $i from 1 through 20 {
  .transition-#{$i}.score-transition-enter-active {
      transition-delay: #{2.2 + ($i * .06)}s;
  }

  .transition-#{$i} {
    transition: opacity .5s, transform .5s ease-in-out, height #{2.2 - ($i * .1)}s; //use height ani as a hack to keep boxes alive till animation is fully done
  }

  .transition-#{$i}.score-transition-leave-active {
      transition-delay: #{($i * .06)}s;
  }
}

.score-transition-leave-to {
  height: 70px;
   opacity: 0;
   transform: translateX(-200px);
}


.score-transition-enter{
    opacity: 0;
    transform: translateX(200px);
}

.score-item.character-wrap {
  display: inline-block;
  /* width: 24px; */
  height: 37px;
  margin: 0;
  padding: 0;
}

.score-item.character-wrap-player {
  display: inline-block;
  height: 70px;
  margin: 0;
  padding: 0;
}

.fix-player-name {
  position: relative;
  margin-left: 8px;
}

.team-name-character-wrapper {
  display: flex;
  height: 34px;
  margin-top: 2px;
}

.team-name {
  position: relative;
  top: -4px;
  margin-right: 4px;
}

.team-name-override {
  font-size: 22px;
  top: -2px;
}

.team-name-wrapper-override {
  margin-top: 3px;
}

.team-character {
  margin-left: 4px;
  /* display: inline-block; */
}



.character-inline-block {
  display: inline-block;
  margin: 0 4px;
  height: 26px;
}

.character {
  height: 23px;
  margin: 4px 0;
  padding: 0;
  line-height: 24px;
  width: 23px;
}

.character-player {
  height: 70px;
  margin: 0;
  padding: 0;
  line-height: 70px;
  display: inline-block;
}

.score-item {
  display: inline-block;
  height: 70px;
  margin-bottom: 0px;
  padding: 5px;
  overflow: hidden;
  /* border: 1px solid black; */
}

.score-name.padding-zero {
  padding: 0;
  padding-left: 0;
}

.score-player-name {
  line-height: 62px;
}

.score-index {
  width: 55px;
  line-height: 65px;
  text-align: center;
  color: v-bind("display?.colors?.primaryText");
}

.score-name {
  width: 417px;
  padding-left: 10px;
  font-size: 25px;
}


.score-player-names {
  font-size: 17px;
  font-weight: 300;
}

.score-value {
  width: 100px;
  padding-right: 15px;
  line-height: 65px;
  text-align: right;
}

.score-header {
  text-transform: capitalize;
}

.table-wrap {
  position: relative;
  top: 200px;
  width: 1500px;
  height: 710px;
  margin: auto;
  /* background-color: rgba(255, 0, 0, .5); */
  font-size: 30px;
  font-weight: 400;
}

.row-wrap {
  height: 100%;
  width: 100%;
}
#credit1 {
    left: 1685px;
    text-align: center;
    top: 1020px;
    position: absolute;
}
// #credit1 {
//     left: 1600px;
//     text-align: center;
//     top: 570px;
//     position: absolute;
//     opacity: .8;
//     transform: rotate(-90deg);
// }
// #credit2 {
//     left: -75px;
//     text-align: center;
//     top: 570px;
//     position: absolute;
//     opacity: .8;
//     transform: rotate(-90deg);
// }
</style>
