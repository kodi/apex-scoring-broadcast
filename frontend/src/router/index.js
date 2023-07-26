import Vue from 'vue'
import VueRouter from 'vue-router'
import Admin from "../pages/AdminPage";
import Broadcast from "../pages/BroadcastPage";
import Index from "../pages/Index";
import Tournament from "../pages/TournamentPage";
import Players from "../pages/PlayersPage";
import Player from "../pages/PlayerPage";

import Standings from "../views/tournament/Standings";
import Stats from "../views/tournament/Stats";
import Drops from "../views/tournament/Drops";

import Scoreboard from "../views/tournament/standings/Scoreboard";
import TeamStandings from "../views/tournament/standings/TeamStandings";
import PlayerStandings from "../views/tournament/standings/PlayerStandings";
import Feed from "../views/tournament/standings/Feed";

import StatsCumulativeCharts from "../views/tournament/stats/CumulativeCharts";
import StatsGameCharts from "../views/tournament/stats/GameCharts";
import StatsPointRatioCharts from "../views/tournament/stats/PointRatio";
import StatsPickRate from "../views/tournament/stats/PickRate";

import PlayerOverview from "../views/player/Overview";
import PlayerMatches from "../views/player/Matches";

Vue.use(VueRouter)

const routes = [
  {
    path: "/",
    name: "index",
    component: Index,
    props: true,
  },
  {
    path: "/broadcast/:organizer/:display",
    name: "broadcast",
    component: Broadcast,
    props: true,
  },
  {
    path: '/admin/:organizer?',
    name: 'admin',
    component: Admin,
    props: true,
  },
  {
    path: "/players",
    name: "players",
    component: Players,
    props: true,
  },
  {
    path: "/player/:id",
    name: "player",
    component: Player,
    props: true,
    redirect: { name: "player.overview" },
    children: [
      {
        path: "overview",
        name: "player.overview",
        component: PlayerOverview,
        props: true,
      },
      {
        path: "matches",
        name: "player.matches",
        component: PlayerMatches,
        props: true,
      }
    ]
  },
  {
    path: "/tournament/:organizer/:matchSlug/",
    name: "tournament",
    component: Tournament,
    props: true,
    redirect: { name: "tournament.standings", params: { game: "overall" } },
    children: [
      {
        path: "standings/:game?",
        name: "tournament.standings",
        component: Standings,
        props: true,
        redirect: { name: "tournament.standings.scoreboard" },
        children: [
          {
            path: "scoreboard",
            name: "tournament.standings.scoreboard",
            component: Scoreboard,
            props: true,
          },
          {
            path: "team-standings",
            name: "tournament.standings.team",
            component: TeamStandings,
            props: true,
          },
          {
            path: "player-standings",
            name: "tournament.standings.player",
            component: PlayerStandings,
            props: true,
          },
          {
            path: "feed",
            name: "tournament.standings.feed",
            component: Feed,
            props: true,
          }
        ]
      },
      {
        path: "stats",
        name: "tournament.stats",
        component: Stats,
        props: true,
        redirect: { name: "tournament.stats.point-ratio" },
        children: [
          {
            path: "charts",
            name: "tournament.stats.charts",
            component: StatsCumulativeCharts,
            props: true,
          },
          {
            path: "game-charts",
            name: "tournament.stats.game-charts",
            component: StatsGameCharts,
            props: true,
          },
          {
            path: "point-ratio",
            name: "tournament.stats.point-ratio",
            component: StatsPointRatioCharts,
            props: true,
          },
          {
            path: "pick-rate",
            name: "tournament.stats.pick-rate",
            component: StatsPickRate,
            props: true,
          }
        ]
      },
      {
        path: "drops/:map?",
        name: "tournament.drops",
        component: Drops,
        props: true,
      }
    ]
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router;
