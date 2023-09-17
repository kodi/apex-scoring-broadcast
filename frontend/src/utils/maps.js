module.exports = {
    mapConfigs: {
        mp_rr_tropic_island_mu1: require("./maps/mp_rr_tropic_island_mu1.json"),
        mp_rr_tropic_island_mu1_storm: require("./maps/mp_rr_tropic_island_mu1_storm.json"),
        mp_rr_tropic_island_mu1_storm_lc: require("./maps/mp_rr_tropic_island_mu1_storm_lc.json"),
        mp_rr_desertlands_hu: require("./maps/mp_rr_desertlands_hu.json"),
        mp_rr_desertlands_hu_lc: require("./maps/mp_rr_desertlands_hu_lc.json"),
        mp_rr_canyonlands_hu: require("./maps/mp_rr_canyonlands_hu.json"),
        mp_rr_olympus_mu2: require("./maps/mp_rr_olympus_mu2.json"),
        mp_rr_divided_moon: require("./maps/mp_rr_divided_moon.json"),
    },
    maps: {
        "worlds-edge": "mp_rr_desertlands_hu",
        "worlds-edge-lc": "mp_rr_desertlands_hu_lc",
        "storm-point": "mp_rr_tropic_island_mu1_storm",
        "storm-point-lc": "mp_rr_tropic_island_mu1_storm_lc",
        "olympus": "mp_rr_olympus_mu2",
        "broken-moon": "mp_rr_divided_moon",
        "kings-canyon": "mp_rr_canyonlands_hu",
    }
}