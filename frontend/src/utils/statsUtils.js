const _ = require("lodash");

const displayOptions = {
    mode: ["team", "player"],
    display: {
        team: {
            statscode: [
                "score",
                "kills",
                "damageDealt",
                "knockdowns",
                "assists",
                "survivalTime",
                "headshots",
                "hits",
                "shots",
                "respawnsGiven",
                "revivesGiven",
                "accuracy",
            ],
            livedata: [
                "score",
                "kills",
                "damageDealt",
                "knockdowns",
                "assists",
                "survivalTime",
                "respawnsGiven",
                "revivesGiven",
                "damageTaken",
                "grenadesThrown",
                "tacticalsUsed",
                "ultimatesUsed",
            ],
        },
        player: {
            statscode: [
                "score",
                "kills",
                "characterName",
                "damageDealt",
                "knockdowns",
                "assists",
                "survivalTime",
                "headshots",
                "hits",
                "shots",
                "respawnsGiven",
                "revivesGiven",
                "accuracy",
            ],
            livedata: [
                "score",
                "kills",
                "characterName",
                "damageDealt",
                "knockdowns",
                "assists",
                "survivalTime",
                "respawnsGiven",
                "revivesGiven",
                "damageTaken",
                "grenadesThrown",
                "tacticalsUsed",
                "ultimatesUsed",
            ],
        }
    },
    game: ["overall", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
}

const invertedStats = ["position", "bestPlacement"]
const statDisplayMapping = {
    "bestPlacement": "Best Placement",
    "survivalTime": "Time",
    "bestGame": "Best Game",
    "damageDealt": "Damage",
    "damageTaken": "Damage Taken*",
    "bestKills": "Best Kills",
    "revivesGiven": "Revives",
    "respawnsGiven": "Respawns",
    "characterName": "Legend",
    "knockdowns": "Downs",
    "grenadesThrown": "Grenades",
    "tacticalsUsed": "Tacts",
    "ultimatesUsed": "Ults",
    "teamPlacement": "Placement",
}

const statsDisplayMappingShort = {
    "damageDealt": "DMG",
    "damageTaken": "DMG Tkn",
    "revivesGiven": "Rvs",
    "respawnsGiven": "Rspns",
    "characterName": "Lgnd",
    "grenadesThrown": "Grnds",
    "headshots": "HS",
    "knockdowns": "Dwns",
}

const mapMap = {
    "mp_rr_canyonlands_hu": "Kings Canyon (Season 14)",
    "mp_rr_tropic_island_mu1": "Storm Point (Season 13)",
    "mp_rr_tropic_island_mu1_storm": "Storm Point (Season 18)",
    "mp_rr_desertlands_mu3": "Worlds Edge (Season 10)",
    "mp_rr_desertlands_mu4": "Worlds Edge (Season 16)",
    "mp_rr_olympus_mu2": "Olympus (Season 12)",
    "mp_rr_divided_moon": "Broken Moon (Season 15)",
    "mp_rr_desertlands_hu": "Worlds Edge (Season 17)",
}

const mapMapShort = {
    "mp_rr_canyonlands_hu": "Kings Canyon",
    "mp_rr_tropic_island_mu1": "Storm Point",
    "mp_rr_tropic_island_mu1_storm": "Storm Point",
    "mp_rr_desertlands_mu3": "Worlds Edge",
    "mp_rr_desertlands_mu4": "Worlds Edge",
    "mp_rr_olympus_mu2": "Olympus",
    "mp_rr_divided_moon": "Broken Moon",
    "mp_rr_desertlands_hu": "Worlds Edge",
}

function sortScores(scores, sortKey) {
    if (sortKey == "score") {
        sortKey = scores[0]?.position ? "position" : "score"
    }

    scores = scores.sort((a, b) => {
        if (invertedStats.includes(sortKey)) {
            if (a[sortKey] == "") return 1;
            if (b[sortKey] == "") return -1;

            return a[sortKey] - b[sortKey];
        } else {
            return b[sortKey] - a[sortKey];
        }
    });
    return scores;
}

function getStatsByMode(teams, mode) {
    if (mode == "team") {
        return teams.map(team => ({ teamId: team.teamId, ...team.overall_stats }));
    } else {
        let result = _(teams)
            .map(team => [...team.player_stats])
            .flatten()
            .groupBy("playerId")
            .map(player => player.reduce((val, cur) => {
                // player["score"] = (player["score"] ?? 0) + teams[player.teamId].score

                Object.keys(cur).forEach(key => {

                    if (!val[key]) {
                        val[key] = cur[key]
                    } else if (key != "playerId" && !isNaN(cur[key])) {
                        val[key] += cur[key];
                    } else if (key == "characters") {
                        val[key] = (val[key] ?? []);
                        val[key].push(...cur[key]);
                        val[key] = _.uniq(val[key]);
                    } else {
                        val[key] = cur[key];
                    }
                })
                return val;
            }, {}))
            .flatten()
            .value();

        return result;
    }
}

function getPlayersByTeam(teams, teamId) {
    return (_.find(teams, stat => stat.teamId == teamId) || { player_stats: [] }).player_stats;
}

function getCharactersByTeam(teams, teamId) {
    return _(getPlayersByTeam(teams, teamId).map(player => player.characters || player.characterName)).zip().flattenDeep().uniq().value();
}

function getDisplayName(name) {
    return statDisplayMapping[name] || name;
}

function getDisplayNameShort(name) {
    return statsDisplayMappingShort[name] ?? statDisplayMapping[name] ?? name;
}

function getMapName(mapid) {
    return mapMap[mapid] || mapid;
}

function getMapNameShort(mapid) {
    return mapMapShort[mapid] || mapid;
}

function getStatsDisplayOptions(mode, overall = true, type = "statscode+livedata") {
    let options = { ...displayOptions.display[mode] };

    if (type.includes("+")) {
        options = _.uniq(Object.values(options).flat());
    } else {
        options = options[type];
    }

    if (overall && options.includes("characterName")) {
        options = options.filter(o => o != "characterName");
        options.splice(2, 0, "characters");
    }

    if (overall && mode == "team") {
        options.push("bestGame", "bestPlacement", "bestKills");
    }

    return options;
}

module.exports = {
    invertedStats,
    statDisplayMapping,
    displayOptions,
    getDisplayNameShort,
    sortScores,
    getDisplayName,
    getStatsByMode,
    getPlayersByTeam,
    getCharactersByTeam,
    getMapName,
    getMapNameShort,
    getStatsDisplayOptions,
}
