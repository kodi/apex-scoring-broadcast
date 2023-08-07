<template>
    <div>
        <div v-if="mode == 'dev'">
            <textarea :value="JSON.stringify(locations)" @input="setJson" style="color: white" cols="100"></textarea>
            <div class="edit-line" v-for="(l, i) in locations" :key="i">
                <v-text-field v-model="l.name" label="name"></v-text-field>
                <v-checkbox v-model="l.primary" label="primary"></v-checkbox>
                <v-btn @click="active = i; setNameLoc = true">Set Name Pos</v-btn>
                <v-btn @click="active = i; l.points = []">Draw</v-btn>
                <v-btn @click="active = i; linking = true">Link</v-btn>
                <v-btn @click="l.links = []">Clear Links</v-btn>
                <v-btn @click="remove(i)">X</v-btn>
            </div>
            <v-btn @click="drawLink = undefined">Done Link</v-btn>
            <v-btn @click="add">ADD</v-btn>
        </div>
        
        <div class="actions text-center" v-if="mode == 'claim' && !hideClaim">
            <v-btn v-if="!claiming && !selfDrops?.length" color="primary" class="mt-2" @click="claimDropDiag = true">Claim Drop Spot</v-btn>
            <v-btn v-if="selfDrops?.length > 0" color="secondary" class="mt-2" @click="clearDrops">Clear Drop</v-btn>
            <v-btn v-if="claiming" color="primary" :disabled="claiming.length == 0" class="mt-2"
                @click="finishClaim">Done</v-btn>
            <v-btn v-if="claiming" color="secondary" class="mt-2" @click="claiming = undefined;refreshClaims()">Cancel</v-btn>
            <!-- <v-btn class="ma-2">Export</v-btn> -->
        </div>
          <div class="actions text-center" v-if="mode == 'admin'">
                <template v-if="!claiming">
                    <v-btn color="primary" @click="claimDropDiag = true">Claim</v-btn>
                    <v-btn v-if="selectedTeam"  color="primary" class="ma-2" @click="resetTeam">Clear Team ({{ selectedTeam }})</v-btn>
                    <v-btn v-else :disabled="true" color="primary" class="ma-2" @click="resetTeam">Click Team Name to clear</v-btn>
                    <v-btn class="ma-2" @click="resetMap">Clear All</v-btn>
                </template>
                <template v-else>
                     <v-btn v-if="claiming" color="primary" :disabled="claiming.length == 0" class="mt-2"
                    @click="finishClaim">Done</v-btn>
                <v-btn v-if="claiming" color="secondary" class="mt-2" @click="claiming = undefined;refreshClaims()">Cancel</v-btn>
                </template>
            </div>
        <div class="count text-center ma-4" v-if="mode != 'display'">
            Total Teams: {{ teamCount }} 
            <span>Unclaimed: {{ unclaimedPrimary }}</span>
        </div>
        <div class="map-wrap">
            <svg viewBox="0 0 2048 2048" width="100%" xmlns:xlink="http://www.w3.org/1999/xlink" ref="svg" id="svg" @click="handleClick">
                <image v-if="!hideMap" width="2048" height="2048" :href="`/maps/${map}.webp`" />
                <svg:style type="text/css">
                    .poi-name {
                        font-size: 30px;
                        fill: white;
                        cursor: pointer;
                    }
                    .poi-outline {
                        stroke: black;
                        stroke-width: 4px;
                        paint-order: stroke;
                    }
                    .primary-poi {
                        font-size: 38px;    
                    }
                    .d-team-name {
                        font-size: 25px;
                        fill: white;
                        stroke: #0009;
                        cursor: pointer;
                    }
                    .d-large-team-name {
                        font-size: 37px;
                        stroke: black;
                            stroke-width: 10px;
                            paint-order: stroke;
                            
                    }
                    .poly {
                        <!-- stroke: #ff000bff; -->
                        fill: #ff000b77;
                    }
                    .link {
                        stroke: #0b970bff;
                        fill: #0b970b77;
                    }
                    .dotted {
                        fill: #00000000;
                        cursor: pointer;
                    }
                </svg:style>
                <template v-if="mode == 'dev'">
                    <svg>
                        <g v-for="l in locations" :key="l.name">
                            <polygon :points="l.points.map(p => p.join(',')).join(' ')"
                                stroke-width="4" class="poly"></polygon>
                            <polygon v-for="(link, i) in l.links" :key="i + link.link"
                                :points="link.points.map(p => p.join(',')).join(' ')" stroke-width="4" class="link poly">
                            </polygon>
                            <text v-if="l.namePos" @click="doLink(l)" :x="l.namePos.x" :y="l.namePos.y" text-anchor="middle"
                                class="poi-name" :class="{ 'primary-poi': l.primary }">{{
                                    l.name }}</text>
                            <text v-for="(t, k) in l.teams" :x="l.namePos.x" :y="l.namePos.y + (35 * (k + 1)) + 5"
                                text-anchor="middle" class="d-team-name" :key="t + team">{{ t }}</text>
                        </g>
                    </svg>
                </template>

                <template v-else-if="!hideDrops && (mode == 'claim' || mode == 'admin' || mode == 'display')">
                   
                    <g v-for="(points, i) in claimedPoints" :key="i">
                        <pattern :id="'stripe' + i" :width="(points?.colors?.length ?? 1) * 4" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                            <rect v-for="(color, i) in points?.colors" :x="i * 4" y="0" width="4" height="10" :style="`fill: ${color}${hideMap ? '44': '77'}`" :key="i" />
                        </pattern>
                        <polygon :fill="'url(#stripe' + i + ')'" v-if="points?.regions[0]" :points="points?.regions[0]?.map(p => p?.join(',')).join(' ')" stroke-width="4"
                                :stroke="points?.colors[0]"></polygon>
                    </g>
                    
                    <g v-for="l in locations" :key="l.name">
                        <polygon v-if="claiming && shouldShowName(l)" @click="claim(l)" 
                            :points="l.points.map(p => p.join(',')).join(' ')" stroke-width="4" class="poly dotted" :stroke="teamColor"
                            stroke-dasharray="4 1 2" ></polygon>
                        <template v-if="hidePoiNames">
                            <text v-for="(t, k) in l.teams" :x="l.namePos.x" :y="l.namePos.y + (35 * k) + 5"
                                text-anchor="middle" class="d-large-team-name d-team-name" :class="{ 'poi-outline': !downloading }" :key="t" @click="selectedTeam = t">{{ t }}</text>
                        </template>
                        <template v-else>
                            <text @click="claim(l)" v-if="shouldShowName(l)" :x="l.namePos.x" :y="l.namePos.y"
                                text-anchor="middle" class="poi-name" :class="{ 'primary-poi': l.primary, 'poi-outline': !downloading }">{{
                                    l.name }}</text>
                            <text v-for="(t, k) in l.teams" :x="l.namePos.x" :y="l.namePos.y + (35 * (k + 1)) + 5"
                                text-anchor="middle" class="d-team-name" :class="{ 'poi-outline': !downloading }" :key="t" @click="selectedTeam = t">{{ t }}</text>
                        </template>
                    </g>
                    
                </template>
                <template v-else-if="hideDrops">
                    <g v-for="l in locations" :key="l.name">
                        <text @click="claim(l)" v-if="shouldShowName(l)" :x="l.namePos.x" :y="l.namePos.y"
                            text-anchor="middle" class="poi-name" :class="{ 'primary-poi': l.primary, 'poi-outline': !downloading }">{{
                                l.name }}</text>
                     </g>
                </template>
                <image v-if="!hideMap" x="10" y="5" width="250" height="60" href="/img/powered_by_outlined.png" />

            </svg>
            <template v-if="mode != 'display'">
                <div class="export">
                    <icon-btn-filled icon="download" @click="svgImg()"></icon-btn-filled>
                </div>
                <div class="refresh">
                    <icon-btn-filled icon="refresh" @click="refreshClaims()"></icon-btn-filled>
                </div>
            </template>
        </div>
        <v-dialog v-model="claimDropDiag" max-width="600px">
            <v-card>
                <v-toolbar color="primary" class="toolbar" flat>Claim Drop Spot<v-spacer></v-spacer><icon-btn-filled
                        icon="close" @click="claimDropDiag = false"></icon-btn-filled></v-toolbar>
                <v-card-text>
                    <v-text-field label="Team Name" v-model="teamName"></v-text-field>
                    <v-text-field type="password" label="Password" v-model="pass"></v-text-field>

                    <v-color-picker
                        dot-size="10"
                        hide-canvas
                        hide-inputs
                        hide-mode-switch
                        hide-sliders
                        mode="rgba"
                        show-swatches
                        swatches-max-height="100"
                        :swatches="swatches"
                        v-model="teamColor"
                    ></v-color-picker>
                    <v-btn color="primary" block :disabled="teamName.length == 0 || pass.length == 0" class="my-3"
                        @click="claiming = []; claimDropDiag = false">Claim</v-btn>
                </v-card-text>
            </v-card>
        </v-dialog>
        <v-snackbar
          v-model="errSnack" color="red"
        >
          {{snackMessage}}
          <template v-slot:action="{ attrs }">
            <v-btn
              color="primary"
              text
              v-bind="attrs"
              @click="errSnack = false"
            >
              Close
            </v-btn>
          </template>
        </v-snackbar>
    </div>
</template>

<script>
import {mapConfigs as maps} from "@/utils/maps";
import IconBtnFilled from "@/components/IconBtnFilled";
import PolyBool from "polybooljs";
import _ from "lodash";
import colors from "@/utils/colors"
import {
    Canvg,
    presets
} from 'canvg'
const preset = presets.offscreen()

const downloadURI = (uri, name) => {
    let link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export default {
    props: ["matchId", "map", "mode", "organizer", "eventId", "hideMap", "hidePoiNames", "hideDrops", "hideClaim"],
    data() {
        return {
            claimDropDiag: false,
            pass: "",
            selectedTeam: undefined,
            setNameLoc: false,
            setTeamLoc: false,
            teamName: "",
            teamColor: _.sample(Object.values(colors)),
            drawLink: undefined,
            active: 0,
            locations: undefined,
            claiming: undefined,
            claimed: [],
            console,
            errSnack: false,
            snackMessage: "",
            selfDrops: undefined,
            drops: [],
            enabled: false,
            downloading: false,
            swatches: [Object.values(colors).slice(0, 5), Object.values(colors).slice(5, 10), Object.values(colors).slice(10, 15), Object.values(colors).slice(15, 20)]
        }
    },
    components: {
        IconBtnFilled
    },
    computed: {
        claimedPoints() {
            // console.log(this.claiming)
            let claimed = this.claimed.concat([this.claiming ?? []] );
            let map = claimed.map(team => team.map(poi => ({ regions: [poi.points], inverted: false, colors: poi.colors }))
                .concat(team.flatMap(poi => poi.links?.flatMap(l => team.find(c => c.name == l.link) ? { regions: [l.points], inverted: false } : undefined)))
                .filter(o => o));

            let result = map.map(m => m.reduce((val, cur) => val && cur ? { ...PolyBool.union(val, cur), colors: _.uniq(cur.colors ? cur.colors.concat(val.colors) : val.colors ?? ["#bb3333"])} : cur, m[0]))
            return result
        },
        claimingPoints() {
            let result = this.claiming?.map(poi => ({ regions: [poi.points], inverted: false }));

            if(result?.length > 1)
                result = result?.reduce((val, cur) => PolyBool.union(val, cur), result[0]);
            return result
        },
        teamCount() {
            return Object.keys(this.drops).length;
        },
        unclaimedPrimary() {
            let claimed = Object.values(this.drops).flat().map(d => d.drop);
            return this.locations.filter(l => l.primary && !claimed.includes(l.name)).length;
        }
    },
    watch: {
        map() {
            this.claiming = undefined;
            this.refreshClaims();
        },
        matchId() {
            this.refreshClaims();
        }
    },
    methods: {
        setJson(value) {
            // console.log(value.target.value);
            this.locations = JSON.parse(value.target.value);
        },
        handleClick(e) {
            if (this.mode != 'dev')
                return;
            var rect = this.$refs.svg.getBoundingClientRect();

            var x = parseInt(2048 * ((e.clientX - rect.left) / (rect.right - rect.left)));
            var y = parseInt(2048 * ((e.clientY - rect.top) / (rect.bottom - rect.top)));

            let locs = this.locations[this.active];

            if (this.setNameLoc) {
                locs.namePos = { x, y };
                this.setNameLoc = false;
            }
            else if (this.setTeamLoc) {
                locs.teamPos = { x, y };
                this.setTeamLoc = false;
            }
            else if (this.drawLink) {
                this.drawLink.points.push([x, y]);
                console.log("drawLink", x, y)
                this.$forceUpdate();
            }
            else {
                locs.points.push([x, y]);
            }

        },
        shouldShowName(l) {
            if (l.namePos && (!this.claiming || this.claiming.length == 0) && l.primary) {
                return true;
            }
            else if (this.claiming?.find(c => c.name == l.name || c.links?.find(i => i.link == l.name))) {
                return true;
            }
        },
        async resetTeam() {
            await this.$apex.deleteDropAdmin(this.matchId, this.map, this.selectedTeam);
            this.selectedTeam = undefined;
            this.refreshClaims();
        },
        async resetMap() {
            await this.$apex.deleteDropAdmin(this.matchId, this.map);
            this.selectedTeam = undefined;
            this.refreshClaims();
        },
        async doLink(link) {
            let poi = this.locations[this.active];
            if (this.linking) {
                if (!poi.links) {
                    this.$set(poi, "links", [])
                }
                await this.$nextTick();
                this.drawLink = {
                    link: link.name,
                    points: []
                }
                poi.links.push(this.drawLink)
                // console.log("dolink", link, poi, this.drawLink)
            }
        },
        claim(poi) {
            if (!this.claiming)
                return;
            if (!poi.teams)
                poi.teams = [];


            if (poi.teams.includes(this.teamName)) {
                _.pull(poi.teams, this.teamName);
                this.claiming = this.claiming.filter(p => p.name != poi.name);
            } else {
                poi.teams.push(this.teamName)
                this.claiming.push({ ...poi, colors: [this.teamColor] });
            }
            // console.log(JSON.stringify(poi.teams), poi.name, JSON.stringify(this.claiming));
        },
        async clearDrops() {
            let token = localStorage.getItem("claim-token");

            await this.$apex.deleteDrop(this.matchId, this.map, token);
            this.refreshClaims();
        },
        async finishClaim() {
            let token = localStorage.getItem("claim-token");
            
            for (let claim of this.claiming) {
                try {
                    let result = await this.$apex.setDrop(this.matchId, this.teamName, this.map, this.pass, this.mode == 'admin' ? this.organizer : token, this.teamColor, claim.name);
                    token = result.token;
                } catch (err) {
                    console.log(err);
                    if (err.response.data.msg) {
                        this.snackMessage = err.response.data.msg;
                    }
                    this.errSnack = true;
                }
            }
                
            localStorage.setItem("claim-token", token);
            this.claiming = undefined;
            this.refreshClaims();
            localStorage.setItem("claim-teamName", this.teamName);

        },
        add() {
            this.locations.push({
                name: "",
                namePos: undefined,
                primary: true,
                points: [],
            })
        },
        remove(id) {
            this.locations.splice(id, 1);
        },
        async refreshClaims() {
            this.$emit("map-refreshed");
            this.locations = _.cloneDeep(maps[this.map])

            this.claimed = [];

            let claimed = await this.$apex.getDrops(this.matchId, this.map);
            this.drops = claimed;

            let token = localStorage.getItem("claim-token")
            this.selfDrops = await this.$apex.getDrops(this.matchId, this.map, token);

            Object.values(claimed).forEach(team => {
                let loc = team.map(claim => {
                    let loc = this.locations.find(c => c.name == claim.drop);
                    console.log(JSON.stringify(claim))
                    if (!loc.teams)
                        loc.teams = [];
                    loc.teams.push(claim.teamName)
                    if (!loc.colors)
                        loc.colors = [];
                    loc.colors.push(claim.color);
                    return loc;
                });
                this.claimed.push(loc);
            })
        },
        async svgImg() {
            this.downloading = true;
            await this.$nextTick();
            const svg = this.$refs.svg;
            var svg_xml = (new XMLSerializer()).serializeToString(svg);
            const width = 2048, height = 2048;
            const canvas = new OffscreenCanvas(width, height)
            const ctx = canvas.getContext('2d')
            const v = await Canvg.from(ctx, svg_xml, preset)

            await v.render()
            const blob = await canvas.convertToBlob()
            const pngUrl = URL.createObjectURL(blob)

            downloadURI(pngUrl, `${this.matchId}_${this.map}_drops.png`)
            this.downloading = false;
        }
        
    },
    async mounted() {

        await this.refreshClaims();
        // this.int = setInterval(() => this.refreshClaims(), 5 * 60 * 1000);

        this.teamName = localStorage.getItem("claim-teamName") || "";
    },
    destroyed() {
        clearInterval(this.int);
    }
};
</script>

<style scoped lang="scss">
.toolbar.v-sheet.v-toolbar {
  background-color: $primary !important;
}

.edit-line {
    display: flex;
}

.map-wrap {
    position: relative;
}
.refresh {
    position: absolute;
    top: 0;
    right: 0;
}

.export {
    position: absolute;
    top: 0;
    right: 30px;
}
</style>