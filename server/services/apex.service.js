const axios = require("axios");
const _ = require("lodash");
let { getOr, SCORE_ARRAY, SCORE_SUMS } = require("../utils/utils");

module.exports = function Apex(config) {
    console.log("Using ", config.statsUrl, " as Respawn API")

    async function getStatsFromCode(statsCode) {
        try {
            let stats = await getStatsFromEA(statsCode);
            if (stats.matches) {
                stats = stats.matches.sort((a, b) => b.match_start - a.match_start);
                return stats;
            }
            return [];
        } catch (err) {
            throw err;
        }
    }

    async function getMatchFromCode(statsCode, startTime) {
        let stats = await getStatsFromCode(statsCode);
        let stat;
        if (startTime)
            stat = stats.find(({ match_start }) => match_start == startTime);
        else
            stat = stats[0];
        return stat;
    }

    function mergeStats(stat1, stat2) {
        let result = {
            ...stat2,
            ...stat1,
            player_results: stat2.player_results.map(player => ({ ...player, ...stat1.player_results.find(p => p.nidHash == player.nidHash) })),
        }
        return result;
    }

    function generateOverallStats(stats) {
        stats = stats.map(stat => _.keyBy(stat.teams, "teamId"));

        let overall = [];
        let teams = _(stats).map(m => Object.keys(m)).flatten().uniq().value();

        teams.forEach(key => {
            let teamStats = {
                teamId: parseInt(key, 10),
                overall_stats: {
                    position: 20,
                    score: 0,
                    bestGame: 0,
                    bestPlacement: 20,
                    bestKills: 0,
                    id: key,
                },
                player_stats: {}
            };
            SCORE_SUMS.forEach(key => teamStats.overall_stats[key] = 0);
            stats.forEach(stat => {
                if (stat[key]) {
                    let t = stat[key].overall_stats;
                    let overall_stats = teamStats.overall_stats;
                    teamStats.name = t.name;
                    if (!teamStats.overall_stats.name)
                        teamStats.overall_stats.name = t.name;
                    overall_stats.bestGame = Math.max(overall_stats.bestGame, t.score);
                    overall_stats.bestPlacement = Math.min(overall_stats.bestPlacement, t.teamPlacement);
                    overall_stats.bestKills = Math.max(overall_stats.bestKills, t.kills);
                    SCORE_SUMS.forEach(key => overall_stats[key] += (t[key] || 0));
                    overall_stats.accuracy = Math.floor(100 * (overall_stats.hits / overall_stats.shots)) / 100;

                    let playerStats = stat[key].player_stats;
                    playerStats.forEach(p => {
                        let player = teamStats.player_stats[p.playerId] || {
                            name: "",
                            playerId: p.playerId,
                        };

                        player.name = p.name;
                        SCORE_SUMS.forEach(key => player[key] = (player[key] || 0) + p[key]);
                        player.accuracy = Math.floor(100 * (player.hits / player.shots)) / 100;
                        player.characters = player.characters || []
                        player.characters.push(p.characterName);
                        player.characters = _.uniq(player.characters.reverse());

                        teamStats.player_stats[p.playerId] = player;
                    });
                }

            })

            teamStats.player_stats = _.values(teamStats.player_stats);
            overall.push(teamStats);
        });

        overall = overall.sort((a, b) => {
            a = a.overall_stats;
            b = b.overall_stats;
            if (a.score != b.score) {
                return b.score - a.score;
            } else if (a.bestGame != b.bestGame) {
                return b.bestGame - a.bestGame;
            } else if (a.bestPlacement != b.bestPlacement) {
                return a.bestPlacement - b.bestPlacement;
            } else {
                return b.bestKills - a.bestKills;
            }
        });

        overall.forEach((obj, index) => obj.overall_stats.position = index + 1)

        return overall;
    }

    function generateGameReport(data, placementPoints = SCORE_ARRAY, killPoints = 1, ringKillPoints) {
        let teams = {};
        let playerData = data.player_results;
        playerData.forEach(player => {
            let teamId = "team" + player.teamNum;
            if (!teams[teamId]) {
                teams[teamId] = {
                    id: parseInt(teamId.replace("team", "")),
                    name: player.teamName,
                    overall_stats: {
                        teamPlacement: player.teamPlacement,
                        score: placementPoints[player.teamPlacement - 1] || 0
                    },
                    player_stats: []
                };
            }
            let team = teams[teamId];
            team.player_stats.push(player);
            SCORE_SUMS.forEach(key => team.overall_stats[key] = getOr(team.overall_stats[key], 0) + getOr(player[key], 0));
            if (ringKillPoints && player.killFeed) {
                player.killFeed.forEach(kill => {
                    team.overall_stats.score += parseInt(ringKillPoints["ring" + kill.ring.stage][kill.ring.state]);
                })
            } else {
                team.overall_stats.score += (player.kills * killPoints)
            }
            delete player.killFeed;

        });

        teams = _.values(teams).map(team => {
            return {
                name: team.name,
                id: team.id,
                overall_stats: team.overall_stats,
                player_stats: team.player_stats.map(player => {
                    return {
                        ...player,
                        name: player.playerName
                    }
                })
            }
        });
        teams = teams.sort((a, b) => {
            return a.overall_stats.teamPlacement - b.overall_stats.teamPlacement;
        })

        delete data.player_results;
        return { ...data, teams };
    }

    async function getStatsFromEA(apexCode) {
        console.log("Getting status code", apexCode);
        let stats = await axios(config['statsUrl'] + apexCode);

        return stats.data;
    }

    return {
        getStatsFromCode,
        generateOverallStats,
        generateGameReport,
        getMatchFromCode,
        mergeStats,
    }
}
