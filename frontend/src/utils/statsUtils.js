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
    "mp_rr_tropic_island_mu1_storm_lc": "Storm Point (Season 18, Limited Contest)",
    "mp_rr_tropic_island_mu1_storm": "Storm Point (Season 18)",
    "mp_rr_desertlands_mu3": "Worlds Edge (Season 10)",
    "mp_rr_desertlands_mu4": "Worlds Edge (Season 16)",
    "mp_rr_olympus_mu2": "Olympus (Season 12)",
    "mp_rr_divided_moon": "Broken Moon (Season 15)",
    "mp_rr_desertlands_hu": "Worlds Edge (Season 17)",
    "mp_rr_desertlands_hu_lc": "Worlds Edge (Season 17, Limited Contest)",
}

const mapMapShort = {
    "mp_rr_canyonlands_hu": "Kings Canyon",
    "mp_rr_tropic_island_mu1": "Storm Point",
    "mp_rr_tropic_island_mu1_storm_lc": "Storm Point",
    "mp_rr_tropic_island_mu1_storm": "Storm Point",
    "mp_rr_desertlands_mu3": "Worlds Edge",
    "mp_rr_desertlands_mu4": "Worlds Edge",
    "mp_rr_olympus_mu2": "Olympus",
    "mp_rr_divided_moon": "Broken Moon",
    "mp_rr_desertlands_hu": "Worlds Edge",
    "mp_rr_desertlands_hu_lc": "Worlds Edge",
}

const weaponMap = {
    'mp_weapon_dragon_lmg': "Rampage",
    'mp_weapon_semipistol': "P2020",
    'mp_weapon_thermite_grenade': "Thermite",
    'mp_weapon_energy_ar': "Havoc",
    'mp_weapon_doubletake': "TripleTake",
    'mp_weapon_vinson': "Flatline",
    'mp_weapon_car': "Car",
    'mp_weapon_lmg': "Spitfire",
    'mp_weapon_shotgun': "EVA-8",
    'mp_weapon_grenade_emp': "Arcstar",
    'mp_weapon_nemesis': "Nemesis",
    'mp_weapon_r97': "R-99",
    'mp_weapon_dmr': "Longbow",
    'mp_weapon_wingman': "Wingman",
    'mp_weapon_volt_smg': "Volt",
    'mp_weapon_autopistol': "RE-45",
    'mp_weapon_rspn101': "R-301",
    'mp_weapon_esaw': "Devotion",
    'mp_weapon_3030': "30-30",
    'mp_weapon_defender': "Chage_Rifle",
    'mp_weapon_mastiff': "Mastiff",
    'mp_weapon_pdw': "Prowler",
    'mp_weapon_shotgun_pistol': "Mozambique",
    'mp_weapon_g2': "G7Scout",
    'mp_weapon_energy_shotgun': "Peacekeeper",
    'mp_weapon_sniper': "Kraber",
    'mp_weapon_bow': "Bowcek",
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

function getWeaponName(weapon) {
    return weaponMap[weapon] ?? weapon;
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
    getWeaponName,
}
