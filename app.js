const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running in http://localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
  }
};
initializeDBAndServer();
const convertdbResponse = (dbResponse) => {
  return {
    stateId: dbResponse.state_id,
    stateName: dbResponse.state_name,
    population: dbResponse.population,
  };
};
app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state order by state_id;`;
  const statesArray = await db.all(getStatesQuery);
  const convertedstate = statesArray.map((eachState) =>
    convertdbResponse(eachState)
  );
  response.send(convertedstate);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state where state.state_id=${stateId};`;
  const getState = await db.get(getStateQuery);
  response.send(convertdbResponse(getState));
});

app.post("/districts/", async (request, response) => {
  const bookDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = bookDetails;
  const postDistrictQuery = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths) values(
        '${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const dbUpdate = await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

const convertDistrictDbResponse = (dbResponse) => {
  return {
    districtId: dbResponse.district_id,
    districtName: dbResponse.district_name,
    stateId: dbResponse.state_id,
    cases: dbResponse.cases,
    cured: dbResponse.cured,
    active: dbResponse.active,
    deaths: dbResponse.deaths,
  };
};
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `select * from district where district_id=${districtId};`;
  const getDistrict = await db.get(getDistrictQuery);
  response.send(convertDistrictDbResponse(getDistrict));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `delete from district where district_id=${districtId};`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const districtUpdateQuery = `
    update district set 
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths} where district_id=${districtId};
    `;
  await db.run(districtUpdateQuery);
  response.send("District Details Updated");
});

const convertStat = (dbResponse) => {
  return {
    totalCases: dbResponse["sum(cases)"],
    totalCured: dbResponse["sum(cured)"],
    totalActive: dbResponse["sum(active)"],
    totalDeaths: dbResponse["sum(deaths)"],
  };
};
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    select sum(cases),sum(cured) ,sum(active) ,sum(deaths) from district where state_id=${stateId};`;
  const statResponse = await db.get(getStateStatsQuery);
  response.send(convertStat(statResponse));
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `select state.state_name as stateName from state left join district on state.state_id=district.state_id where district.district_id=${districtId};`;
  const getStateResponse = await db.get(getStateNameQuery);
  response.send(getStateResponse);
});
module.exports = app;
