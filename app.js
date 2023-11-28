const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Is Running");
    });
  } catch (e) {
    console.log(`error ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const playerSnakeToCamel = (newObject) => {
  newPlayer = {
    playerId: newObject.player_id,
    playerName: newObject.player_name,
  };
  return newPlayer;
};

const matchSnakeToCamel = (newMatch) => {
  return {
    matchId: newMatch.match_id,
    match: newMatch.match,
    year: newMatch.year,
  };
};

const reportSnakeToCamel = (report) => {
  return {
    playerId: report.player_id,
    playerName: report.player_name,
    totalScore: report.total_score,
    totalFours: report.total_fours,
    totalSixes: report.total_sixes,
  };
};

//Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const playersList = `
    SELECT *
    FROM player_details
    ORDER BY player_id;`;
  const getPlayers = await db.all(playersList);
  const playersResult = getPlayers.map((eachPlayer) => {
    return playerSnakeToCamel(eachPlayer);
  });
  response.send(playersResult);
});

//Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId};`;
  const newPlayer = await db.get(playerDetails);
  const playerResult = playerSnakeToCamel(newPlayer);
  response.send(playerResult);
});

//Update Specific player Details
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  console.log(playerName);
  const updatePlayerDetails = `
    UPDATE 
    player_details
    SET
        player_name = '${playerName}'
    WHERE 
        player_id = ${playerId};`;
  await db.run(updatePlayerDetails);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetails = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};`;
  const getMatch = await db.get(matchDetails);
  const matchResult = matchSnakeToCamel(getMatch);
  response.send(matchResult);
});

//Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchDetails = `
    SELECT match_details.match_id,
        match_details.match,
        match_details.year
    FROM match_details JOIN player_match_score
        ON match_details.match_id = player_match_score.match_id
    WHERE 
        player_match_score.player_id = ${playerId};`;
  const matchList = await db.all(getMatchDetails);
  const matchResult = matchList.map((eachMatch) => {
    return matchSnakeToCamel(eachMatch);
  });
  response.send(matchResult);
});

//Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerDetails = `
    SELECT player_details.player_id,
        player_details.player_name
    FROM player_details JOIN player_match_score
        ON player_details.player_id = player_match_score.player_id
    WHERE 
        player_match_score.match_id = ${matchId};`;
  const playersList = await db.all(getPlayerDetails);
  const playerResult = playersList.map((eachPlayer) => {
    return playerSnakeToCamel(eachPlayer);
  });
  response.send(playerResult);
});

//Get a Report For a Specific Player
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = `
    SELECT  player_details.player_id,
            player_details.player_name,
            SUM(player_match_score.score) AS total_score,
            SUM(player_match_score.fours) AS total_fours,
            SUM(player_match_score.sixes) AS total_sixes
    FROM player_details JOIN player_match_score
        ON player_details.player_id = player_match_score.player_id
    WHERE 
        player_details.player_id = ${playerId}
    ;`;

  const playerReport = await db.get(playerDetails);
  const resultReport = reportSnakeToCamel(playerReport);
  response.send(resultReport);
});

module.exports = app;
