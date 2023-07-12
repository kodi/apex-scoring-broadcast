module.exports = {
    mapConfigs: {
        mp_rr_tropic_island_mu1: require("./maps/mp_rr_tropic_island_mu1.json"),
        mp_rr_desertlands_hu: require("./maps/mp_rr_desertlands_hu.json"),
        mp_rr_canyonlands_hu: require("./maps/mp_rr_canyonlands_hu.json"),

    },
    maps: {
        "worlds-edge": "mp_rr_desertlands_hu",
        "storm-point": "mp_rr_tropic_island_mu1",
        // "olympus": "mp_rr_olympus_mu2",
        // "broken-moon": "mp_rr_divided_moon",
        "kings-canyon": "mp_rr_canyonlands_hu",
    }
}