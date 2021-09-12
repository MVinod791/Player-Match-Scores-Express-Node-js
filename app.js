const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, (request, response) => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};
initializeDbAndServer();

const convertDbObjectToResponseObj = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT *
        FROM player_details
        ORDER BY player_id;
    `;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertDbObjectToResponseObj(eachPlayer))
  );
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
        SELECT *
        FROM player_details
        WHERE player_id=${playerId};
    `;
  const player = await db.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObj(player));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE player_details
    SET player_name='${playerName}'
    WHERE player_id=${playerId};
  `;
  const updatePlayer = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});
module.exports = app;

//API 4
const convertMatchObjToResponseObj = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`;
  const matchArray = await db.get(getMatchDetailsQuery);
  response.send(convertMatchObjToResponseObj(matchArray));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchDetailsQuery = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id=${playerId}`;
  const matchArray = await db.all(getMatchDetailsQuery);
  response.send(
    matchArray.map((eachMatch) => convertMatchObjToResponseObj(eachMatch))
  );
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_match_score NATURAL JOIN player_details
    WHERE match_id=${matchId};`;
  const playerArray = await db.all(getPlayerQuery);
  response.send(
    playerArray.map((eachPlayer) => convertDbObjectToResponseObj(eachPlayer))
  );
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerFullDetailsQuery = `
        SELECT player_id as playerId,
                player_name as playerName,
                SUM(score) as totalScore,
                SUM(fours) as totalFours,
                SUM(sixes) as totalSixes
        FROM player_match_score NATURAL JOIN player_details
        WHERE player_id=${playerId};`;
  const playerMatchDetails = await db.get(getPlayerFullDetailsQuery);
  response.send(playerMatchDetails);
});
