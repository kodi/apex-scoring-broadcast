<template>
    <v-container>
        <v-card>
            <v-card-title>Match Managment</v-card-title>
            <v-card-text>
                <table>

                    <tr v-for="match in matchList" :key="match.id" class="ma-1 match" color="secondary">
                        <td>{{ match.eventId }}</td>
                        <td>
                            <IconBtnFilled icon="open_in_new"></IconBtnFilled>
                            <IconBtnFilled icon="share"></IconBtnFilled>
                            <IconBtnFilled icon="archive"></IconBtnFilled>
                            <IconBtnFilled icon="content_copy"></IconBtnFilled>
                            <IconBtnFilled icon="restart_alt"></IconBtnFilled>
                        </td>
                    </tr>
                </table>
            </v-card-text>
        </v-card>
    </v-container>
</template>
<script>
import IconBtnFilled from "@/components/IconBtnFilled"

export default {
    props: ["organizer"],
    components: {
        IconBtnFilled
    },
    data() {
        return {
            matchList: []
        }
    },
    methods: {
        async refreshMatchList() {
            this.matchList = await this.$apex.getMatchList(this.organizer);
        }
    },
    mounted() {
        this.refreshMatchList();
    }
}
</script>

<style lang="scss">
.match {
    
    tr {
        background-color:$second-tone;
    }

    td {
        padding: 5px;
    }
}
</style>