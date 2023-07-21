const cache = require("./cache.service");
const { db } = require("../connectors/db");

function getCacheKey(value, option) {
    return `MATCH-SETTING:${value}-${option}`;
}

async function getOrganizerMatch(organizerName) {
    return await cache.getOrSet(getCacheKey(organizerName, "selected_match"), async () => {
        return await db("organizers")
            .where({ username: organizerName })
            .first(["selected_match as matchId"])
    }, 300);
}

async function setOrganizerMatch(organizerName, match) {
    await db("organizers")
        .where({ username: organizerName })
        .update({ "selected_match": match })

    cache.del(getCacheKey(organizerName, "selected_match"));
}

async function getMatchList(organizerName) {
    return await cache.getOrSet(getCacheKey(organizerName, "match_list"), async () => {
        let result = await db("match")
            .join("organizers", "organizers.id", "match.organizer")
            .where({ username: organizerName })
            .orderBy("match.id", "desc")
            .select(["match.id as id", "eventId"]);
        return result;
    }, 300)
}

async function createMatch(organizer, eventId) {
    let id = await db("match").insert({ organizer: organizer.id, eventId }, ["id"]);
    await setOrganizerMatch(organizer.username, id[0].id);
    await cache.del(getCacheKey(organizer.username, "match_list"));
    return id[0].id;
}

async function setMatchSettings(matchId, settings) {
    await db("match_settings")
        .insert({ matchId, settings: JSON.stringify(settings) })
        .onConflict(["matchId"])
        .merge();

    cache.del(getCacheKey(matchId, "settings"));
}

async function getMatchSettings(matchId) {
    return await cache.getOrSet(getCacheKey(matchId, "settings"), async () => {
        let result = await db("match_settings")
            .where({ matchId })
            .first("settings");

        return result?.settings;
    }, 300)
}

async function setMatchTeam(matchId, teamId, name) {
    await db("match_teams")
        .insert({ matchId, teamId, name })
        .onConflict(["matchId", "teamId"])
        .merge();
    cache.del(getCacheKey(matchId, "teams"));
}

async function getMatchTeams(matchId) {
    if (matchId)
        return await cache.getOrSet(getCacheKey(matchId, "teams"), async () => {
            let result = await db("match_teams")
                .where({ matchId })
                .select("*");

            return result;
        }, 300);
}

async function getMatch(organizerName, eventId) {
    return await cache.getOrSet(getCacheKey(organizerName + "-" + eventId, "match"), async () => {
        let result = await db("match")
            .join("organizers", "organizers.id", "match.organizer")
            .where({ username: organizerName, eventId })
            .first(["match.id as id", "eventId", "organizers.id as organizerId", "username as organizerName"]);

        return result;
    }, 300)
}

async function getMatchById(id) {
    return await db("match")
        .join("organizers", "organizers.id", "match.organizer")
        .where({ "match.id" : id })
        .first(["match.id as id", "eventId", "organizers.id as organizer", "username as organizerName"]);
}

async function setMatchPolling(matchId, pollStart, pollEnd, statsCodes) {
    await db("match_settings")
        .insert({ matchId, pollStart, pollEnd, pollCurrent: pollStart, statsCodes })
        .onConflict(["matchId"])
        .merge();
    await cache.del(getCacheKey(matchId, "match_polling"));
}

async function updateMatchPolling(matchId, pollCurrent) {
    await db("match_settings")
        .where({ matchId })
        .update({ pollCurrent })
    await cache.del(getCacheKey(matchId, "match_polling"));
}

async function getMatchPolling(matchId) {
    return await cache.getOrSet(getCacheKey(matchId, "match_polling"), async () => {
        return await db("match_settings")
            .where({ matchId })
            .first(["pollStart", "pollEnd", "pollCurrent", "statsCodes"]);
    }, 300);
}

module.exports = {
    getMatchSettings,
    setMatchSettings,
    getOrganizerMatch,
    setOrganizerMatch,
    getMatchList,
    createMatch,
    setMatchTeam,
    getMatchTeams,
    getMatch,
    getMatchById,
    setMatchPolling,
    updateMatchPolling,
    getMatchPolling,
}