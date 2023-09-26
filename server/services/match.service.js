const cache = require("./cache.service");
const { db } = require("../connectors/db");

function getCacheKey(value, option) {
    return `MATCH-SETTING:${value}-${option}`;
}

async function resetMatchListCache(organizer) {
    await cache.del(getCacheKey(organizer.username, "match_list_" + true))
    await cache.del(getCacheKey(organizer.username, "match_list_" + false))
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

async function getMatchList(organizerName, archived = false) {
    return await cache.getOrSet(getCacheKey(organizerName, "match_list_" + archived), async () => {
        let query = db("match")
            .join("organizers", "organizers.id", "match.organizer")
            .where({ username: organizerName });
            
        if (!archived)
            query.andWhere("archived", '<>', true)

        let result = query.orderBy("match.id", "desc")
            .select(["match.id as id", "eventId", "archived"]);
        
        return await result;
    }, 300)
}

async function createMatch(organizer, eventId) {
    let id = await db("match").insert({ organizer: organizer.id, eventId }, ["id"]);
    await setOrganizerMatch(organizer.username, id[0].id);
    await resetMatchListCache(organizer);
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

async function archiveMatch(organizer, matchId, archived = true) {
    await db("match")
        .where({ id: matchId })
        .update({ archived });
    let selected = await getOrganizerMatch(organizer.username);

    console.log(selected, matchId);
    if (selected == matchId) {
        await setOrganizerMatch(organizer.username, null);
    }
    await resetMatchListCache(organizer);
}

async function cloneMatch(organizer, eventId, matchId) {
    let newMatch = await createMatch(organizer, eventId);
    let settings = await getMatchSettings(matchId);
    await setMatchSettings(newMatch, settings);

    let teams = await getMatchTeams(matchId);
    teams.forEach(team => setMatchTeam(newMatch, team.teamId, team.name));
    return newMatch;
}

async function cloneDataAndReset(organizer, eventId, matchId) {
    let newMatch = await cloneMatch(organizer, eventId, matchId);

    await db.transaction(async trx => {
        await trx("game").where({ matchId }).update({ matchId: newMatch });
        await trx("drops").where({ matchId }).update({ matchId: newMatch });
        await trx("player_game_stats").where({ matchId }).update({ matchId: newMatch });
        await trx("team_game_stats").where({ matchId }).update({ matchId: newMatch });
    });

    console.log("neMatch", newMatch);

    await archiveMatch(organizer, newMatch);
}

async function updateEventId(organizer, matchId, eventId) {
    await db("match").update({ eventId }).where({ id: matchId });
    await resetMatchListCache(organizer);

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
    archiveMatch,
    cloneMatch,
    cloneDataAndReset,
    updateEventId
}
