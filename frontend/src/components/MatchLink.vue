<template>
    <router-link :to="{ name: to ?? 'tournament.standings.scoreboard', params: { matchSlug: linkId, organizer, game: gameId ?? 'overall' } }">
        <slot></slot>
    </router-link>
</template>
<script>
export default {
    props: ["matchId", "eventId", "organizer", "to", "gameId"],
    computed: {
        linkId() {
            if (this.eventId) {
                return this.matchId + "." + this.sanatizedEventId;
            } else {
                return this.matchId;
            }
        },
        sanatizedEventId() {
            return this.eventId.replace(/[\W_]+/g, "_").substring(0, 30);
        },
    }
}
</script>
