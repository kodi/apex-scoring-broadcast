<template>
    <v-container>
        <v-row>
            <v-col cols="12" md="10">
                <v-card color="secondary">
                    <v-card-title>Match Managment</v-card-title>
                    <v-card-text>
                        <v-checkbox v-model="showArchived" label="Show Archived"></v-checkbox>
                        <table class="match-table pa-12">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tr v-for="(match) in matchList" :key="match.id" class="ma-1 match" >
                                <td class="text-center index px-3">{{ match.id }}</td>
                                <td class="match-name pa-4" :class="match.archived ? 'archived' : 'normal'">
                                        {{ match.eventId }}
                                </td>

                                <td class="text-right">
                                    <span class="buttons">
                                        <v-btn @click="cloneMatchId = match.id; newEventId = match.eventId; showEditDiag = Date.now()">Edit Name</v-btn>
                                        <MatchLink :eventId="match.eventId" :matchId="match.id" :organizer="organizer"><v-btn>Open</v-btn></MatchLink>
                                        <v-btn @click="copyUrl(match.id, match.eventId)">Copy Link</v-btn>
                                        <v-btn @click="activate(match.id)">Set Active</v-btn>
                                        <v-btn v-if="!match.archived" @click="archive(match.id, match.eventId)">Archive</v-btn>
                                        <v-btn v-else-if="match.archived" @click="unArchive(match.id, match.eventId)">Unarchive</v-btn>
                                        <v-btn @click="cloneMatchId = match.id; newEventId = match.eventId; showCloneDiag = Date.now()">Clone</v-btn>
                                        <v-btn @click="cloneMatchId = match.id; newEventId = match.eventId; showResetDiag = Date.now()">Archive Data & Reset</v-btn>
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <NewMatchDiag @add="updateEventId" :show="showEditDiag" message="Edit Name" button="Update" :eventId="newEventId"></NewMatchDiag>
        <NewMatchDiag @add="clone" :show="showCloneDiag" message="Create new match" button="Clone" :eventId="newEventId"></NewMatchDiag>
        <NewMatchDiag @add="cloneReset" :show="showResetDiag" message="Archive data to:" button="Archive" :eventId="newEventId"></NewMatchDiag>
        <v-snackbar color="primary" v-model="showSnack">
            {{ message }}

            <template v-slot:action="{ attrs }">
                <v-btn color="black" text v-bind="attrs" @click="showError = false">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
    </v-container>
</template>
<script>
import IconBtnFilled from "@/components/IconBtnFilled"
import IconSpan from "@/components/IconSpan"
import MatchLink from "@/components/MatchLink"
import NewMatchDiag from "@/components/NewMatchDiag"

export default {
    props: ["organizer"],
    components: {
        IconBtnFilled,
        IconSpan,
        MatchLink,
        NewMatchDiag,
    },
    data() {
        return {
            newEventId: "",
            cloneMatchId: undefined,
            showCloneDiag: false,
            showResetDiag: false,
            showEditDiag: false,
            showArchived: false,
            message: "",
            showSnack: false,
            matchList: []
        }
    },
    watch: {
        showArchived() {
            this.refreshMatchList()
        }
    },
    methods: {
        async refreshMatchList() {
            this.$emit("refresh");

            this.matchList = [];
            this.matchList = (await this.$apex.getMatchList(this.organizer, this.showArchived)).map(m => ({ ...m, editing: false, link: undefined }));
        },
        async archive(id, eventId) {
            await this.$apex.archiveMatch(id);
            this.refreshMatchList();
            this.snack("Archived " + eventId);
        },
        async unArchive(id, eventId) {
            await this.$apex.unArchiveMatch(id);
            this.refreshMatchList();
            this.snack("Unarchived " + eventId);
        },
        async clone(eventId) {
            await this.$apex.cloneMatch(eventId, this.cloneMatchId);
            this.showCloneDiag = false;
            this.refreshMatchList();
            this.snack("Cloned to new match " + eventId);
        },
        snack(message) {
            this.message = message;
            this.showSnack = true;
        },
        async cloneReset(eventId) {
            await this.$apex.cloneDataAndReset(eventId, this.cloneMatchId);
            this.showResetDiag = false;
            this.refreshMatchList();
            this.snack("Moved data to " + eventId);
        },
        async activate(id) {
            await this.$apex.setSelectedMatch(this.organizer, id);
            this.$emit("refresh");
            this.snack("Set active " + id);
        },
        async getShortLink(link) {
            let { hash } = await this.$apex.getShortLink(link);
            return `${window.location.origin}/${hash}`;
        },
        async copyUrl(matchId, eventId) {
            let short = await this.getShortLink(this.$apex.getMatchPageUrl(this.$router, this.organizer, matchId, eventId));
            await navigator.clipboard.writeText(short);
            this.snack("Copied " + short);
        },
        async updateEventId(eventId) {
            await this.$apex.updateEventId(this.cloneMatchId, eventId);
            await this.refreshMatchList();
            this.showEditDiag = false;
        }
    },
    mounted() {
        this.refreshMatchList();
    }
}
</script>

<style lang="scss">
.match-table {
    border-collapse: collapse;
    width: 100%;
}

.match-name {
    font-size: 1.2em;
}

.match {
    
    .archived {
        color: $primary;
    }

    td {
        padding: 5px;
        background-color: $second-tone;
        margin: 5px;
        border-top: 5px solid $first-tone;
        border-left: 0px solid $second-tone;
        border-right: 0px solid $second-tone;
    }

    .buttons .v-btn {
        opacity: 0;
        transition: opacity ease .2s;
        margin: 4px;
    }

    &:hover .buttons .v-btn {
        opacity: 1;
    }

    .index {
        background: $primary;
    }
}</style>