const { db } = require("../connectors/db");
const { createPage } = require("../utils/pagnation");
const { DEFAULT_PAGE_COUNT } = require("../config/const");
let { SCORE_SUMS, getOrFn } = require("../utils/utils");
SCORE_SUMS = SCORE_SUMS.filter(i => i != "score");

async function listPlayers(start = 0, count = DEFAULT_PAGE_COUNT, search = "") {
    let players = await db("player_names")
        .select(db.raw("string_agg(name, '\n') as names, \"playerId\" as id, count(*) OVER() AS total"))
        .groupBy("playerId")
        .whereRaw("LOWER(name) LIKE LOWER('%' || ? ||'%')", [search])
        .offset(start)
        .limit(count)

    let searchCount = getOrFn(() => players[0].total, 0);

    players = players.map(player => ({ id: player.id, names: player.names.split("\n") }))
    return createPage(searchCount, start, count, players);
}

async function getPlayer(playerId) {
    const names = await db("player_names").select("name").where({ playerId });
    const sums = await db("players")
        .sum(SCORE_SUMS.reduce((a, v) => ({ ...a, [v]: v }), {}))
        .count("* as totalGames")
        .leftJoin("player_game_stats as pgs", "players.playerId", "pgs.playerId")
        .where({ 'players.id': playerId })
        .first()
    // .toSQL().sql
    const characters = await db("players")
        .select("characterName as character").count("*")
        .leftJoin("player_game_stats as pgs", "players.playerId", "pgs.playerId")
        .groupBy("characterName")
        .where({ 'players.id': playerId })

    return {
        names: names.map(v => v.name),
        sums,
        characters: characters.sort((a, b) => b.count - a.count),
    }
}


async function getMatches(playerId, start = 0, count = DEFAULT_PAGE_COUNT) {
    const matches = await db("player_matches")
        .select(db.raw("*, count(*) OVER() AS total"))
        .where({ playerId })
        .offset(start)
        .limit(count);

    let searchCount = getOrFn(() => matches[0].total, 0);
    return createPage(searchCount, start, count, matches);
}




module.exports = {
    listPlayers,
    getPlayer,
    getMatches,
}
