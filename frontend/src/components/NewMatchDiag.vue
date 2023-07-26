<template>
    <v-dialog v-model="newMatchDiag" max-width="600px">
        <v-card>
            <v-toolbar class="toolbar" flat>{{message}}<v-spacer></v-spacer><icon-btn-filled icon="close"
                @click="newMatchDiag = false"></icon-btn-filled></v-toolbar>
            <v-card-text>
            <v-text-field label="Match ID" v-model="newMatchId"></v-text-field>
            <v-btn @click="addRandom()">+ Random</v-btn><v-btn @click="addDate" class="mx-2">+ Date</v-btn><v-btn @click="addTime">+ Time</v-btn>
            <!-- <v-text-field label="Display Name (optional)" v-model="newMatchName"></v-text-field> -->

            <v-btn color="primary" block :disabled="newMatchId?.length == 0" class="my-3"
                @click="addMatch()">{{ button }}</v-btn>
            </v-card-text>
        </v-card>
        </v-dialog>
</template>

<script>
import IconBtnFilled from "../components/IconBtnFilled.vue"
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export default {
    props: ["show", "message", "button", "eventId"],
    components: {
        IconBtnFilled,
    },
    data() {
        return {
            newMatchDiag: false,
            newMatchId: "",
        }
    },
    watch: {
        show() {
            if (!this.show) {
                this.newMatchDiag = false;
            } else {
                this.newMatchDiag = true;
                this.newMatchId = this.eventId ?? "";
            }
        }
    },
    methods: {
        generateRandomString() {
            let randomString = '';

            for (let i = 0; i < 8; i++) {
                randomString += characters[Math.floor(Math.random() * characters.length)];
            }

            return randomString;
        },
        addDate() {
            let date = new Date();
            this.newMatchId = this.append(this.newMatchId, `${date.getMonth() + 1}/${date.getDay() + 1}/${date.getFullYear()}`)
        },
        addTime() {
            let date = new Date();
            this.newMatchId = this.append(this.newMatchId, `${date.getHours()}:${date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()}`)
        },
        addRandom() {
            this.newMatchId = this.append(this.newMatchId, this.generateRandomString());
        },
        append(str, text) {
            return str + (str.length > 0 ? " " : "") + text;
        },
        addMatch() {
            this.$emit("add", this.newMatchId);
        }
    }
}
</script>

<style lang="scss">
.toolbar.v-sheet.v-toolbar {
  background-color: $primary !important;
}
</style>