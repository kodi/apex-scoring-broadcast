<template>
    <v-container>
        <template v-if="!eventId || eventId == ''">
            
                <v-card class="pa-3">
                    <v-card-text>
                        <i>Please choose or create a match</i>
                    </v-card-text>
                </v-card>
        </template>
        <template v-else>
            <v-tabs v-model="tab">
                <v-tab>General</v-tab>
                <v-tab>Teams</v-tab>
                <v-tab>Drop Spots</v-tab>
            </v-tabs>
            <v-tabs-items v-model="tab">
                <v-tab-item>
                    <v-row>
                        <v-col sm="12" lg="6">
                            <v-card class="ma-2">
                                <v-card-title>Settings</v-card-title>
                                <v-card-text>
                                    <v-text-field v-model="publicData.title" label="Public Title"></v-text-field>
                                </v-card-text>
                                <v-card-actions>
                                    <v-btn @click="setPublicSettings" color="primary">Update</v-btn>
                                </v-card-actions>
                            </v-card>
                            <v-card class="ma-2">
                                <v-card-title>Public Link</v-card-title>
                                <v-card-text>
                                    <v-form><v-text-field solo :value="publicUrl" readonly></v-text-field></v-form>
                                </v-card-text>
                            </v-card>
                            
                        </v-col>
                        <v-col sm="12" lg="6">

                            <v-card class="ma-2">
                                <v-card-title>Twitch Chat Integration</v-card-title>
                                <v-card-text>
                                    <v-text-field v-model="command" label="Command"></v-text-field>
                                    <v-radio-group v-model="add">
                                        <v-radio key="add" value="add" :label="`Add new command ${command}`"></v-radio>
                                        <v-radio key="edit" value="edit"
                                            :label="`Update existing command ${command}`"></v-radio>
                                        <v-radio key="raw" value="raw" :label="`Raw command (Add via website)`"></v-radio>
                                    </v-radio-group>

                                    <template v-if="add != 'raw'">
                                        <v-text-field readonly label="Nightbot" :value="nightbotCommand"></v-text-field>
                                        <v-text-field readonly label="Stream Elements" :value="SECommand"></v-text-field>
                                    </template>
                                    <v-text-field v-else readonly label="Command" :value="rawCommand"></v-text-field>
                                </v-card-text>

                            </v-card>
                        </v-col>
                        <v-col sm="12" lg="12">
                            <v-card class="ma-2">
                                <v-card-title>Management</v-card-title>
                                <v-card-text>
                                    <v-row>
                                        <v-col md="4" cols="12">
                                            <v-card class="ma-1">
                                                <v-card-title>Archive</v-card-title>
                                                <v-card-text>
                                                    Hide this match. You can view archived matches in account options
                                                </v-card-text>
                                                <v-card-actions><v-btn block color="primary" @click="archive">Archive</v-btn></v-card-actions>
                                            </v-card>

                                        </v-col>
                                        <v-col md="4" cols="12">
                                            <v-card class="ma-1">
                                                <v-card-title>Clone</v-card-title>
                                                <v-card-text>
                                                    Create a new match with duplicated settings.
                                                </v-card-text>
                                                <v-card-actions><v-btn block color="primary" @click="showCloneDiag = Date.now()">Clone</v-btn></v-card-actions>

                                            </v-card>

                                        </v-col>
                                        <v-col md="4" cols="12">
                                            <v-card class="ma-1">
                                                <v-card-title>Archive Data & Reset</v-card-title>
                                                <v-card-text>
                                                    Copy data to a new match, then reset. Useful if you want to reuse this match without losing the data (eg daily scrims)
                                                </v-card-text>
                                                <v-card-actions><v-btn block color="primary" @click="showResetDiag = Date.now()">Reset</v-btn></v-card-actions>
                                            </v-card>

                                        </v-col>
                                    </v-row>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-tab-item>
                <v-tab-item>
                    <v-card>
                        <v-card-title>Team Managment</v-card-title>
                        <v-card-text>
                            <div v-for="team in teams" :key="team.teamId" class="team-wrap">
                                <div class="team-index">{{ team.teamId - 1 }}</div>
                                <div class="team-name"> <v-text-field v-model="team.name" dense></v-text-field></div>
                                <div class="team-name"> <v-btn @click="updateTeam(team)">Update</v-btn></div>
                            </div>
                            <v-btn @click="addTeam" color="seconday">Add Team</v-btn>
                            <v-btn @click="add20Teams" color="seconday">Add 20 Teams</v-btn>
                        </v-card-text>
                    </v-card>
                </v-tab-item>
                <v-tab-item>
                    <v-card>
                        <v-card-text>

                            <template>
                                <v-row>
                                    <v-col cols="12" sm="4">
                                        <v-card>
                                            <v-card-title>Configure Maps</v-card-title>
                                            <v-card-text>
                                                <v-btn color="primary" @click="enableDropsDiag = true">Configure</v-btn>
                                            </v-card-text>
                                        </v-card>
                                        </v-col>
                                        <v-col cols="12" sm="8">
                                        <v-card v-if="publicData.drops">
                                            <v-card-title>
                                                Direct Link
                                            </v-card-title>
                                            <v-card-text>
                                                <v-text-field v-if="publicData.drops" :value="publicUrlDrops" read-only solo
                                                    label="direct link"></v-text-field>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>
                            </template>

                            <template >
                                <v-card>
                                    <v-card-title>
                                        Map & Team Managment
                                    </v-card-title>
                                    <v-card-text v-if="publicData.drops">
                                        <v-tabs v-model="dropTab">
                                            <v-tab v-for="id in publicData.drops.maps" :key="id">{{ getMapNameShort(id)
                                            }}</v-tab>
                                        </v-tabs>
                                        <v-tabs-items v-model="dropTab">
                                            <v-tab-item v-for="id in publicData.drops.maps" :key="id">
                                                <DropMap class="drop-map" :map="id" :matchId="matchId" mode="admin"></DropMap>
                                            </v-tab-item>
                                        </v-tabs-items>
                                    </v-card-text>
                                    <v-card-text v-else>
                                        <i>Click configure to enable drop selection for this match</i>
                                    </v-card-text>
                                </v-card>
                            </template>
                        </v-card-text>
                    </v-card>
                    <v-dialog v-model="enableDropsDiag" max-width="600px">
                        <v-card>
                            <v-toolbar color="primary" class="toolbar" flat>Enable Drop
                                Spots<v-spacer></v-spacer><icon-btn-filled icon="close"
                                    @click="enableDropsDiag = false"></icon-btn-filled></v-toolbar>
                            <v-card-title>Choose Maps</v-card-title>
                            <v-card-text>
                                <v-checkbox v-for="(id, name) in maps" :label="getMapName(id)" :key="name"
                                    v-model="selectedMaps[name]" dense></v-checkbox>
                                <!-- <v-checkbox v-model="enabled" label="Drop Selection Enabled"></v-checkbox> -->
                                <v-text-field v-model="pass" label="Password"></v-text-field>
                                <v-btn :disabled="!pass" color="primary" block class="my-3" @click="enableDrops">Submit</v-btn>
                            </v-card-text>
                        </v-card>
                    </v-dialog>
                </v-tab-item>
            </v-tabs-items>

            <NewMatchDiag @add="clone" :show="showCloneDiag" message="Create new match" button="Clone" :eventId="eventId"></NewMatchDiag>
            <NewMatchDiag @add="cloneReset" :show="showResetDiag" message="Archive data to:" button="Archive" :eventId="addDate"></NewMatchDiag>
        </template>
    </v-container>
</template>

<script>
import _ from "lodash";
import { getMapName, getMapNameShort } from "@/utils/statsUtils";
import IconBtnFilled from "@/components/IconBtnFilled";
import DropMap from "../../components/DropMap.vue";
import { maps } from "@/utils/maps";
import NewMatchDiag from "../../components/NewMatchDiag.vue";
export default {
    props: ["eventId", "organizer", "matchId"],
    components: {
        IconBtnFilled,
        DropMap,
        NewMatchDiag,
    },
    data() {
        return {
            publicData: {},
            publicUrl: undefined,
            publicUrlDrops: undefined,
            command: "!score",
            add: "edit",
            tab: undefined,
            teams: [],
            enableDropsDiag: false,
            selectedMaps: {},
            dropTab: undefined,
            pass: "",
            enabled: true,
            maps,
            showCloneDiag: false,
            showResetDiag: false,
        }
    },
    computed: {
        publicFullUrl() {
            return window.location.origin + this.$router.resolve({ name: 'tournament', params: { organizer: this.organizer, matchSlug: this.matchId, game: "overall" } }).href;
        },
        publicFullUrlDrops() {
            return window.location.origin + this.$router.resolve({ name: 'tournament.drops', params:  { organizer: this.organizer, matchSlug: this.matchId } }).href;
        },
        summaryUrl() {
            return encodeURI(`${this.$apex.config.fullUrl}stats/${this.matchId}/summary`);
        },
        rawCommand() {
            return `$(urlfetch ${this.summaryUrl}) -- ${this.publicUrl}`;
        },
        SECommand() {
            return `!command ${this.add} ${this.command} ${this.rawCommand}`;
        },
        nightbotCommand() {
            return `!commands ${this.add} ${this.command} ${this.rawCommand}`;
        },
        addDate() {
            let date = new Date();
            return `${this.eventId} ${date.getMonth() + 1}/${date.getDay() + 1}/${date.getFullYear()}`;
        },
    },
    watch: {
        eventId() {
            this.refreshPublicOptions();
        }
    },
    methods: {
        getMapName,
        getMapNameShort,
        setPublicSettings() {
            this.$apex.setPublicSettings(this.matchId, this.publicData);
        },
        async refreshPublicOptions() {
            if (this.eventId) {
                let options = await this.$apex.getPublicSettings(this.matchId);
                let overall = await this.$apex.getStats(this.matchId, "overall");
                overall = overall?.teams?.map(t => ({ name: t.name, teamId: parseInt(t.teamId), matchId: this.matchId })).sort((a, b) => a.teamId - b.teamId);

                let teams = await this.$apex.getMatchTeams(this.matchId);
                teams = teams?.sort((a, b) => a.teamId - b.teamId);

                this.teams = _.merge(teams, overall);
                this.publicData = {};
                if (options) {
                    this.publicData = options;
                }

                this.pass = this.publicData.drops?.pass;
                this.selectedMaps = {};
                Object.keys(this.publicData.drops?.maps ?? {}).forEach(key => this.selectedMaps[key] = true);

                this.publicUrlDrops = (await this.getShortLink(this.publicFullUrlDrops)) || this.publicFullUrlDrops;
            }
        },
        async enableDrops() {
            let enabledMaps = {};
            Object.keys(this.selectedMaps).filter(key => this.selectedMaps[key]).forEach(key => enabledMaps[key] = maps[key]);
            this.publicData.drops = {
                pass: this.pass,
                maps: enabledMaps,
                enabled: this.enabled,
            }
            await this.setPublicSettings();
            this.enableDropsDiag = false;
        },
        async getShortLink(link) {
            let { hash } = await this.$apex.getShortLink(link);
            return `${window.location.origin}/${hash}`;
        },
        async add20Teams() {
            for (let i = 0; i < 20; i++) {
                await this.addTeam();
            }
        },
        async addTeam() {
            let team = {
                match: this.eventId,
                teamId: this.teams.length + 2, // team 1 is spectators, skip
                name: "Team " + (this.teams.length + 1),
            };
            this.teams.push(team);
            await this.updateTeam(team);
        },
        async updateTeam(team) {
            await this.$apex.setMatchTeam(this.matchId, team.teamId, team.name);
        },
        async archive() {
            await this.$apex.archiveMatch(this.matchId);
            this.$emit("refresh");
        },
        async clone(eventId) {
            await this.$apex.cloneMatch(eventId, this.matchId);
            this.showCloneDiag = false;
        },
        async cloneReset(eventId) {
            await this.$apex.cloneDataAndReset(eventId, this.matchId);
            this.showResetDiag = false;
        },
    },
    async mounted() {
        this.publicUrl = this.publicFullUrl;
        await this.refreshPublicOptions();
        this.publicUrl = (await this.getShortLink(this.publicFullUrl)) || this.publicFullUrl;
    }
}
</script>
<style lang="scss" scoped>
.team-wrap {
    display: flex;
    height: 40px;
    margin: 5px;
}

.team-index {
    background: $primary;
    height: 40px;
    width: 40px;
    text-align: center;
    line-height: 40px;
    color: white;
    font-size: 1.3em;
}

.team-name {
    background: $second-tone;
    height: 40px;
    flex: 1;
    padding: 5px;
}


.toolbar.v-sheet.v-toolbar {
    background-color: $primary !important;
}

.drop-map {
    width: 80%;
    max-width: 1000px;
    margin: auto;
}
</style>