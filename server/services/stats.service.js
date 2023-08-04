const { db } = require("../connectors/db");
const _ = require("lodash");
const matchService = require("./match.service");
function assembleStatsDocuments(games, teams, players, matchTeams) {
    let teamsByGame = _(teams).groupBy("gameId").value();
    let playersByGame = _(players).groupBy("gameId").value();

    games.forEach(game => {
        game.teams = teamsByGame[game.id].map(team => {
            team.name = matchTeams.find(t => t.teamId == team.teamId)?.name ?? team.name;
            return {
                teamId: team.teamId,
                name: team.name,
                overall_stats: team,
                player_stats: playersByGame[game.id].filter(player => player.teamId == team.teamId).map(player => ({ ...player, score: team.score }))
            }
        });
        // game.players = game.teams.map(team => team.player_stats).flat();
    });
    return games.sort((a, b) => a.id - b.id);
}

async function getStats(matchId, game) {
    let where = game == "overall" ? { matchId } : { matchId, game };
    try {
        let games = await db("game")
            .where(where)
            .select("*");

        let teams = await db("team_game_stats").whereIn("gameId", games.map(game => game.id))
        let players = await db("player_game_stats")
            .select(db.raw("player_game_stats.*, players.id as \"playerId\""))
            .join("players", "players.playerId", "=", "player_game_stats.playerId")
            .whereIn("gameId", games.map(game => game.id));

        let matchTeams = await matchService.getMatchTeams(games[0]?.matchId);

        return assembleStatsDocuments(games, teams, players, matchTeams);
    } catch (err) {
        console.error(err);
    }
}

async function deleteStats(matchId, game) {
    try {
        await db.transaction(async trx => {
            let previousGame = await trx("game").
                where({ matchId, game })
                .first("id");

            if (previousGame) {
                console.log("Deleting game " + previousGame.id);
                await trx("game")
                    .where({ id: previousGame.id })
                    .del();

                await trx("team_game_stats")
                    .where({ gameId: previousGame.id })
                    .del();

                await trx("player_game_stats")
                    .where({ gameId: previousGame.id })
                    .del();
            }
        })
    } catch (err) {
        console.error("Error deleting stats", err);
        throw err;
    }
}

async function writeStats(matchId, game, data, source) {
    try {
        let gameId = undefined;
        await db.transaction(async trx => {
            await deleteStats(matchId, game);

            let gameResult = await trx("game").insert({
                game,
                matchId,
                match_start: data.match_start,
                mid: data.mid,
                map_name: data.map_name,
                aim_assist_allowed: data.aim_assist_allowed,
                source,
            }, ["id"])


            gameId = gameResult[0].id;

            let teamStats = data.teams.map(team => {
                return {
                    ...team.overall_stats,
                    teamId: team.id,
                    gameId: gameId,
                    name: team.name,
                    matchId,
                }
            });

            let playerStats = data.teams.map(team =>
                team.player_stats.map(player => {
                    let playerData = {
                        ...player,
                        teamId: team.id,
                        playerId: player.nidHash,
                        gameId,
                        matchId
                    }
                    delete playerData.nidHash;
                    delete playerData.playerName;
                    delete playerData.teamNum;

                    return playerData;
                })
            ).flat();

            await trx("team_game_stats").insert(teamStats);
            await trx("player_game_stats").insert(playerStats);

            await Promise.all(playerStats.map(p => trx("players").insert({ playerId: p.playerId }).onConflict().ignore()))

        });
        return gameId;
    } catch (err) {
        console.error("Failed to insert game into db", err);
        throw err;
    }
}

async function editScore(gameId, teamId, score) {
    await db("team_game_stats").update({ score }).where({ gameId, teamId });
}

async function editKills(gameId, teamId, kills) {
    await db("team_game_stats").update({ kills }).where({ gameId, teamId });
}

async function getGame(gameId) {
    return db("game").first("*").where({ id: gameId });
}

async function getGameList(matchId) {
    try {
        let result = await db("game")
            .orderBy("game", "asc")
            .where({ matchId })
            .select("*");
        return result;
    } catch (err) {
        console.error(err)
        return 0;
    }
}

async function getLatest() {
    try {
        let matches = await db("match")
            .join("organizers", "organizers.id", "match.organizer")
            .orderBy("match.id", "desc")
            .limit(30)
            .select(["organizers.id as organizerId", "organizers.username as username", "match.id as matchId", "match.eventId as eventId"]);

        if (matches) {
            let stats = await Promise.all(matches.map(match => new Promise(async (res) => {
                let stats = await getStats(match.matchId, "overall");
                res({ ...match, stats })
            })));
            return stats.filter(match => match.stats.length > 0);
        } else {
            return [];
        }

    } catch (err) {
        console.log(err);
        return undefined;
    }
}

async function writeLiveData(gameId, data, organizer, client) {
    let timestamp = data[0].timestamp;
    data = JSON.stringify(data);
    await db("livedata").insert({ gameId, data, timestamp, organizer, client });
}

async function setLiveDataGame(liveId, gameId) {
    await db("livedata").update({ gameId }).where({ id: liveId });
}

async function hasLiveData(matchId, game) {
    if (!isNaN(game)) {
        let result = await db("game").first("*").where({ matchId, game });
        if (result && result.source.includes("livedata")) {
            return result.id;
        }
    }
}

async function getLiveDataById(liveDataId) {
    let data = await db("livedata")
        .first("*")
        .where({ id: liveDataId });
    return JSON.parse(data.data);
}

async function getLiveData(gameId) {
    let data = await db("livedata")
        .first("*")
        .where({ gameId });
    return JSON.parse(data.data);
}

async function getUnclaimedLiveData(organizer) {
    let data = await db("livedata")
        .select(["id", "timestamp", "client"])
        .where({ organizer })
        .whereNull("gameId");
    return data;
}

async function getLatestedGame(matchId) {
    let game = await db("game")
        .where({ matchId })
        .orderBy("game", "desc")
        .first();
    
    return game ?? { game: 0 };
}

module.exports = {
    writeStats,
    getStats,
    getGameList,
    deleteStats,
    getLatest,
    writeLiveData,
    hasLiveData,
    getLiveData,
    setLiveDataGame,
    getUnclaimedLiveData,
    getLiveDataById,
    editScore,
    editKills,
    getGame,
    getLatestedGame,
}