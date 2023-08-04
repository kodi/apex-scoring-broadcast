const SCORE_ARRAY = [12, 9, 7, 5, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
const SCORE_SUMS = ["kills", "revivesGiven", "headshots", "assists", "survivalTime", "respawnsGiven", "damageDealt", "hits", "knockdowns", "shots", "grenadesThrown", "ultimatesUsed", "tacticalsUsed", "damageTaken", "score"];
const _ = require("lodash");

const defaultChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function randomString(length, chars = defaultChars) {
    return new Array(length).fill("").map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join();
}

function getOr(value, or) {
    return value || or;
}

function getOrFn(fn, or) {
    try {
        let val = fn();
        return getOr(val, or);
    } catch (err) {
        return or;
    }
}



function statsToCsv(data, team = true, full = false) {
    if (team) {
        let csv = !full ? "team,score,kills\n" : `team,score,${SCORE_SUMS.join(",")}\n`;
        data.teams.forEach(team => {
            if (full) {
                csv += `${team.name},${team.overall_stats.score},${SCORE_SUMS.map(score => team.overall_stats[score]).join(",")}\n`
            } else {
                csv += `${team.name},${team.overall_stats.score},${team.overall_stats.kills}\n`
            }
        })
        return csv;
    }
}

module.exports = {
    randomString,
    getOr,
    getOrFn,
    statsToCsv,
    SCORE_ARRAY,
    SCORE_SUMS,
}