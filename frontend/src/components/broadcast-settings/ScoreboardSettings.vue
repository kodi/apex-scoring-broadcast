<template>
    <div>
        <v-row class="mb-2">
            <v-col cols="2">
                <v-checkbox label="Styled" v-model="displayChoices.styled"></v-checkbox>
            </v-col>

            <v-col cols="2">
                <v-checkbox label="Show Header" v-model="displayChoices.header"></v-checkbox>
            </v-col>
            <v-col cols="2">
                <v-checkbox label="Show Characters" v-model="displayChoices.showCharacters"></v-checkbox>
            </v-col>
            <v-col cols="2">
                <v-checkbox label="Single Column" v-model="displayChoices.single"></v-checkbox>
            </v-col>
            <v-col cols="2">
                <v-checkbox label="Animate" v-model="displayChoices.animate"></v-checkbox>
            </v-col>
        </v-row>
        <v-select label="Game" :items="displayOptions.game" v-model="displayChoices.game" dense></v-select>
        <v-select label="Mode" :items="displayOptions.mode" v-model="displayChoices.mode" @change="
            this.displayChoices.display = undefined;
        this.displayChoices.display2 = undefined;" dense></v-select>
        <v-select v-model="displayChoices.page" label="Page" :items="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]" dense></v-select>
        <v-select label="Column 1 (Sort)" v-if="displayChoices.mode" :items="getStatsDisplayOptions(displayChoices.mode)"
            v-model="displayChoices.display" dense></v-select>
        <v-select label="Column 2" v-if="displayChoices.mode" :items="getStatsDisplayOptions(displayChoices.mode)"
            v-model="displayChoices.display2" clearable dense></v-select>
        <v-btn color="primary" @click="update()">Update</v-btn>
    </div>
</template>
<script>
import { displayOptions, getStatsDisplayOptions } from "../../utils/statsUtils";

export default {
    props: ["value"],
    data() {
        return {
            displayOptions,
            displayChoices: JSON.parse(JSON.stringify(this.value.settings)),
        }
    },
    watch: {
        value() {
            this.displayChoices = JSON.parse(JSON.stringify(this.value.settings));
        }
    },
    methods: {
        update() {
            this.$emit('input', { ...this.value, settings: this.displayChoices })
        },
        getStatsDisplayOptions
    }
}
</script>