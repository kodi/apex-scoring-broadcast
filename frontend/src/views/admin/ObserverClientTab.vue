<template>
    <div>
        <v-card v-if="!selectedClient" color="secondary">
            <v-card-title>Apex Clients<v-btn class="mx-2" @click="newClientDiag = true">Connect new</v-btn></v-card-title>
            <v-card-text>
                <h3 class="mb-3">Connected Clients</h3>
                <div v-if="clients.length == 0"><i>Your apex client will show up here when it is connected</i></div>
                <v-row v-else class="client-wrap">
                    <v-col cols="3" v-for="client in Object.keys(clients)" :key="client">
                        <v-card :class="{ connected: isConnected(client) }" class="client">
                            <v-card-title class="title">{{ client }}<v-spacer />
                                <span v-if="client == defaultClient">(Default)</span>
                            </v-card-title>
                            <v-card-text>
                                <span :class="{ connected: isConnected(client) }" class="offline">
                                    {{ isConnected(client) ? 'Online' : 'Offline' }}
                                </span>
                                <span v-if="isConnected(client)">- {{ clients[client].state }}</span>
                            </v-card-text>
                            <v-card-actions>
                                <v-btn @click="setDefault(client)" dense>Set Default</v-btn>
                                <v-btn @click="launchClient = client; launchArgDiag = true" dense>Launch Args</v-btn>
                                <v-btn @click="selectedClient = client" dense>Connect</v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-dialog v-model="newClientDiag" max-width="600px">
                <v-card>
                    <v-toolbar class="toolbar" flat>Add New Client<v-spacer></v-spacer><icon-btn-filled icon="close"
                            @click="newClientDiag = false"></icon-btn-filled></v-toolbar>
                    <v-card-text class="pa-4">
                        <v-text-field label="Client Name" v-model="newClient"></v-text-field>
                        <v-text-field label="Launch Args" readonly :disabled="newClient?.length == 0"
                            :value="newClient?.length > 0 ? getLaunchArgs(newClient) : 'Chose a client name'"></v-text-field>
                        Add these args to your apex launch args and start your game. Join a custom lobby in the observer
                        slot.

                        <v-btn color="primary" block :disabled="this.newClient.length == 0" @click="addClient()">Add</v-btn>
                    </v-card-text>
                </v-card>
            </v-dialog>
            <v-dialog v-model="launchArgDiag" max-width="600px">
                <v-card>
                    <v-toolbar class="toolbar" flat>Copy Launch Args<v-spacer></v-spacer><icon-btn-filled icon="close"
                            @click="launchArgDiag = false"></icon-btn-filled></v-toolbar>
                    <v-card-text class="pa-4">
                        <v-text-field label="Launch Args" readonly :value="getLaunchArgs(launchClient)"></v-text-field>
                        Add these args to your apex launch args and start your game. Join a custom lobby in the observer
                        slot.
                    </v-card-text>
                </v-card>
            </v-dialog>
        </v-card>
        <v-card v-else>
            <v-card-title>
                <v-btn @click="selectedClient = undefined" class="ma-2">←</v-btn>
                Connected to client "{{ selectedClient }}" 
            </v-card-title>
            <v-card-text>
                <h3>Client Controls <sup>Beta</sup> </h3>
                <v-btn @click="createLobby" class="ma-2">Create (public) Lobby</v-btn>
                <v-btn @click="JoinCodeDiag = true" class="ma-2">Join Lobby Code</v-btn>
                <!-- <v-btn @click="leaveLobby" class="ma-2">Leave Lobby</v-btn> -->
                <v-btn @click="startLobby" class="ma-2">Start Game</v-btn>
                <v-btn @click="pauseLobby" class="ma-2">Pause Game</v-btn>
                <!-- <h3>Game Setting Presets</h3>
                <v-btn @click="joinLobby" class="ma-2">Worlds Edge 3v3 Tournament Mode</v-btn>
                <v-btn @click="joinLobby" class="ma-2">Storm Point 3v3 Tournament Mode</v-btn> -->
                <h3>Live Data Feed: </h3>
                <livedata-test :liveData="liveData"></livedata-test>
            </v-card-text>
        </v-card>
         <v-dialog v-model="JoinCodeDiag" max-width="600px">
            <v-card>
                <v-toolbar class="toolbar" flat>Input Code<v-spacer></v-spacer><icon-btn-filled icon="close"
                    @click="JoinCodeDiag = false"></icon-btn-filled></v-toolbar>
                <v-card-text>
                <v-text-field label="Lobby Code" v-model="lobbyCode"></v-text-field>
              
                <v-btn color="primary" block :disabled="lobbyCode?.length == 0" class="my-3"
                    @click="joinLobby(); JoinCodeDiag = false">Join Lobby</v-btn>
                </v-card-text>
            </v-card>
            </v-dialog>
    </div>
</template>
<script>
import IconBtnFilled from "@/components/IconBtnFilled.vue"
import { processWsData } from "@/utils/liveData";
import LivedataTest from "@/views/broadcast/LivedataTest.vue";
export default {
    components: {
        IconBtnFilled,
        LivedataTest,
    },
    props: ["organizer"],
    data() {
        return {
            clients: [],
            defaultClient: "",
            newClient: "",
            newClientDiag: false,
            launchClient: "",
            selectedClient: undefined,
            launchArgDiag: false,
            liveData: undefined,
            ws: undefined,
            lobbyCode: undefined,
            JoinCodeDiag: false,
        }
    },
    watch: {
        selectedClient() {
            this.ws?.close();
            if (this.selectedClient) {
                this.connectWs();
            }
        }
    },
    methods: {
        getLaunchArgs(client) {
            return `+cl_liveapi_enabled 1 +cl_liveapi_ws_servers "${this.$apex.config.wsWriteUrl}/${this.$apex.getApiKey()}/${encodeURIComponent(client)}" +cl_liveapi_use_protobuf 0`
        },
        isConnected(client) {
            return this.clients[client].connected;
        },
        async getClients() {
            this.clients = await this.$apex.getClients(this.organizer);
            this.defaultClient = await this.$apex.getOrganizerDefaultApexClient(this.organizer);
            if (!this.stop) {
                setTimeout(() => this.getClients(), 1000);
            }
        },
        async setDefault(client) {
            await this.$apex.setOrganizerDefaultApexClient(this.organizer, client);
        },
        async addClient() {
            await this.$apex.addClient(this.newClient);
            this.newClientDiag = false;
            this.newClient = "";
        },
        async connectWs() {
            console.log("Connecting to ws ", this.organizer, this.selectedClient);
            const selectedClient = this.selectedClient;
            this.ws = this.$apex.getLiveDataWs(this.organizer, this.selectedClient, true);
            processWsData(this.ws, (data) => {
                this.$set(this, 'liveData', data);
            });

            this.ws.addEventListener("close", (e) => console.log(e) || this.selectedClient == selectedClient && setTimeout(() => this.connectWs(), 1000));
        },
        send(obj) {
            this.ws.send(JSON.stringify({
                type: "command",
                cmd: {
                    withAck: true,
                    ...obj,
                }
            }))
        },
        createLobby() {
            this.send({
                customMatch_CreateLobby: {}
            })
        },
        joinLobby() {
            this.send({
                customMatch_JoinLobby: {
                    roleToken: this.lobbyCode
                }
            })
        },
        leaveLobby() {
            this.send({
                customMatch_LeaveLobby: {}
            })
        },
        startLobby() {
            this.send({
                customMatch_SetMatchmaking: {
                    enabled: true,
                }
            })
        },
        pauseLobby() {
            this.send({
                pauseToggle: {
                    preTimer: 0.0,
                }
            });
        }
    },
    mounted() {
        this.getClients();
    },
    destroyed() {
        this.stop = true;
    }
}
</script>
<style scoped lang="scss">
.client {
    font-size: 1.2em;
    border-bottom: 2px solid red;

    &.connected {
        border-bottom: 2px solid green;
    }

    .offline {
        color: red;
    }

    .connected {
        color: green;
    }
}

.title {
    height: 64px;

    span {
        font-size: .7em;
    }
}

.toolbar.v-sheet.v-toolbar {
    background-color: $primary !important;
}
</style>