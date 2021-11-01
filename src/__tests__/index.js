import supertest from "supertest";
import server from "../server.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  jamesBond,
  badBondLogin,
  missMoneypenny,
  jasonBourne,
  jasonBourneLogin,
  felixLeiter,
  auricGoldfinger,
  vesperLynd,
  jackRyan,
  austinPowers,
  natashaRomanova,
  nikitaMears,
  johnWick,
  doctorNo,
  jaws,
  bryanMills,
  ethanHunt,
  aliciaHuberman,
  xeniaOnatopp,
  alecTrevelyan,
  newFeature,
} from "../utils/constants.js";

dotenv.config();

const request = supertest(server);

describe("💪 Testing the testing environment", () => {
  it("should test that true is true", () => {
    expect(true).toBe(true);
  });
});

describe("💪 Testing the server", () => {
  beforeAll((done) => {
    mongoose.connect(process.env.MONGO_TEST).then(() => {
      console.log("Connected to Atlas");
      done();
    });
  });

  afterAll((done) => {
    mongoose.connection.dropDatabase().then(() => {
      console.log("Test DB dropped");
      mongoose.connection.close().then(() => {
        done();
      });
    });
  });

  it("should test that get /test endpoint is OK", async () => {
    const response = await request.get("/test");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Test success");
  });

  it("should test that a non-existent endpoint is returning 404", async () => {
    const response = await request.get("/non-existent");
    expect(response.status).toBe(404);
  });
});

describe("💪 Testing basic user endpoints", () => {
  beforeAll((done) => {
    mongoose.connect(process.env.MONGO_TEST).then(() => {
      console.log("Connected to Atlas");
      done();
    });
  });

  afterAll((done) => {
    mongoose.connection.dropDatabase().then(() => {
      console.log("Test DB dropped");
      mongoose.connection.close().then(() => {
        done();
      });
    });
  });

  it("should test that post /users/register endpoint is OK (BOND)", async () => {
    const response = await request.post("/users/register").send(jamesBond);
    expect(response.status).toBe(201);
    expect(response.body._id).toBeDefined();
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it("should test that post /users/register admin endpoint is OK (MONEYPENNY)", async () => {
    const response = await request.post("/users/register").send(missMoneypenny);
    expect(response.status).toBe(201);
    expect(response.body._id).toBeDefined();
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.admin).toBeTruthy();
  });

  it("should test that post /users/register endpoint returns 409 if username duplicate", async () => {
    const username = jamesBond.username;
    const response = await request.post("/users/register").send({
      first_name: "Jack",
      last_name: "Ryan",
      username,
      email: "jackryan@gmail.com",
      password: "jackryan",
    });
    expect(response.status).toBe(409);
    expect(response.body.message).toBe("USERNAME NOT AVAILABLE");
    expect(response.body.available).toBeDefined();
  });

  it("should test that post /users/session endpoint is OK (BOURNE)", async () => {
    await request.post("/users/register").send(jasonBourne);
    const response = await request
      .post("/users/session")
      .send(jasonBourneLogin);
    expect(response.status).toBe(200);
    expect(response.body._id).toBeDefined();
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it("should test that post /users/session endpoint returns 401 if bad credentials", async () => {
    const response = await request.post("/users/session").send(badBondLogin);
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("CREDENTIALS NOT ACCEPTED");
  });

  // post "/users/session/refresh" tests

  it("should test that post /users admin endpoint is OK (FELIX)", async () => {
    const felix = await request.post("/users/register").send(felixLeiter);
    const felix_token = felix.body.accessToken;
    const response = await request
      .post("/users")
      .send(jackRyan)
      .set({ Authorization: `Bearer ${felix_token}` });
    expect(response.status).toBe(201);
    expect(response.body._id).toBeDefined();
  });

  it("should test that post /users admin endpoint returns 409 if email duplicate (VESPER)", async () => {
    const email = jamesBond.email;
    const vesper = await request.post("/users/register").send(vesperLynd);
    const vesper_token = vesper.body.accessToken;
    const response = await request
      .post("/users")
      .send({
        first_name: "Mister",
        last_name: "Goldfinger",
        username: "goldfinger",
        email,
        password: "nemesis",
      })
      .set({ Authorization: `Bearer ${vesper_token}` });
    expect(response.status).toBe(409);
    expect(response.body.message).toBe("EMAIL NOT AVAILABLE");
  });

  // if there is more time for testing, implement:-
  // it("should test that get /users/me endpoint is OK", async () => {});
  // it("should test that get /users endpoint is OK", async () => {});
  // it("should test that get /users/:id admin endpoint is OK", async () => {});
  // it("should test that put /users/me endpoint is OK", async () => {});
  // it("should test that put /users/:id admin endpoint is OK", async () => {});
  // it("should test that put /users/me/avatar endpoint is OK", async () => {});
  // it("should test that put /users/:id/avatar admin endpoint is OK", async () => {});
  // it("should test that put /users/:id admin endpoint is OK", async () => {});
  // it("should test that delete /users/session endpoint is OK", async () => {});
  // it("should test that delete /users/me endpoint is OK", async () => {});
  // it("should test that delete /users/:id admin endpoint is OK", async () => {});
});

describe("💪 Testing advanced user endpoints", () => {
  beforeAll((done) => {
    mongoose.connect(process.env.MONGO_TEST).then(() => {
      console.log("Connected to Atlas");
      done();
    });
  });

  afterAll((done) => {
    mongoose.connection.dropDatabase().then(() => {
      console.log("Test DB dropped");
      mongoose.connection.close().then(() => {
        done();
      });
    });
  });

  it("should test that post /users/request/:id endpoint is OK and that it returns 409 if duplicated or already rejected", async () => {
    const joe = await request.post("/users/register").send(austinPowers);
    const joe_id = joe.body._id;
    const joe_token = joe.body.accessToken;
    const jane = await request.post("/users/register").send(natashaRomanova);
    const jane_id = jane.body._id;
    const jane_token = jane.body.accessToken;
    const firstResponse = await request
      .post(`/users/request/${joe_id}`)
      .set({ Authorization: `Bearer ${jane_token}` });
    expect(firstResponse.status).toBe(201);
    expect(firstResponse.body.requested).toBeDefined();
    expect(firstResponse.body.requested).toContain(joe_id);
    const secondResponse = await request
      .post(`/users/request/${joe_id}`)
      .set({ Authorization: `Bearer ${jane_token}` });
    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.message).toBe(
      "DUPLICATE REQUESTS ARE NOT ALLOWED"
    );
    await request
      .post(`/users/reject/${jane_id}`)
      .set({ Authorization: `Bearer ${joe_token}` });
    const thirdResponse = await request
      .post(`/users/request/${joe_id}`)
      .set({ Authorization: `Bearer ${jane_token}` });
    expect(thirdResponse.status).toBe(409);
    expect(thirdResponse.body.message).toBe(
      "REJECTED USERS CANNOT MAKE REQUEST"
    );
  });

  it("should test that post /users/request/id endpoint returns 401 if bad credentials", async () => {
    const badToken = "notAnAccessToken";
    const john = await request.post("/users/register").send(johnWick);
    const john_id = john.body._id;
    const response = await request
      .post(`/users/request/${john_id}`)
      .set({ Authorization: `Bearer ${badToken}` });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Credentials not accepted");
  });

  it("should test that post /users/request/id endpoint returns 404 if user not found", async () => {
    const _id = "M";
    const janeB = await request.post("/users/register").send(nikitaMears);
    const janeB_token = janeB.body.accessToken;
    const response = await request
      .post(`/users/request/${_id}`)
      .set({ Authorization: `Bearer ${janeB_token}` });
    expect(response.status).toBe(404);
    expect(response.body.message).toBe(`USER ${_id} NOT FOUND`);
  });

  it("should test that post /users/request/id endpoint returns 409 if user requests own ID", async () => {
    const mrGoldfinger = await request
      .post("/users/register")
      .send(auricGoldfinger);
    const { _id, accessToken } = mrGoldfinger.body;
    const response = await request
      .post(`/users/request/${_id}`)
      .set({ Authorization: `Bearer ${accessToken}` });
    expect(response.status).toBe(409);
    expect(response.body.message).toBe(`USERS IDS CANNOT MATCH`);
  });

  it("should test that post /users/reject/id endpoint is OK and that it returns 409 if ID not awaited", async () => {
    const drNo = await request.post("/users/register").send(doctorNo);
    const drNo_id = drNo.body._id;
    const drNo_token = drNo.body.accessToken;
    const trevelyan = await request.post("/users/register").send(alecTrevelyan);
    const trevelyan_id = trevelyan.body._id;
    const trevelyan_token = trevelyan.body.accessToken;
    await request
      .post(`/users/request/${drNo_id}`)
      .set({ Authorization: `Bearer ${trevelyan_token}` });
    const firstResponse = await request
      .post(`/users/reject/${trevelyan_id}`)
      .set({ Authorization: `Bearer ${drNo_token}` });
    expect(firstResponse.status).toBe(201);
    expect(firstResponse.body.response_awaited).toHaveLength(0);
    const secondResponse = await request
      .post(`/users/reject/${trevelyan_id}`)
      .set({ Authorization: `Bearer ${drNo_token}` });
    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.message).toBe(`USER ID MUST BE AWAITED`);
  });

  it("should test that post /users/accept/id endpoint is OK and that it returns 409 if ID already accepted", async () => {
    const henchman = await request.post("/users/register").send(jaws);
    const henchman_id = henchman.body._id;
    const henchman_token = henchman.body.accessToken;
    const henchwoman = await request.post("/users/register").send(xeniaOnatopp);
    const henchwoman_id = henchwoman.body._id;
    const henchwoman_token = henchwoman.body.accessToken;
    await request
      .post(`/users/request/${henchwoman_id}`)
      .set({ Authorization: `Bearer ${henchman_token}` });
    const firstResponse = await request
      .post(`/users/accept/${henchman_id}`)
      .set({ Authorization: `Bearer ${henchwoman_token}` });
    expect(firstResponse.status).toBe(201);
    expect(firstResponse.body.accepted).toContain(henchman_id);
    const secondResponse = await request
      .post(`/users/accept/${henchman_id}`)
      .set({ Authorization: `Bearer ${henchwoman_token}` });
    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.message).toBe(`USER ID MUST EXIST IN AWAITED`);
  });
});

// if there is more time for testing, implement:-
describe("💪 Testing app-features endpoints", () => {
  beforeAll((done) => {
    mongoose.connect(process.env.MONGO_TEST).then(() => {
      console.log("Connected to Atlas");
      done();
    });
  });

  afterAll((done) => {
    mongoose.connection.dropDatabase().then(() => {
      console.log("Test DB dropped");
      mongoose.connection.close().then(() => {
        done();
      });
    });
  });

  it("should test that get /features endpoint is OK", async () => {
    const response = await request.get("/features");
    expect(response.body.links).toBeDefined();
    expect(response.body.total).toBeDefined();
    expect(response.body.features).toBeDefined();
    expect(response.body.pageTotal).toBeDefined();
  });

  it("should test that post /features admin endpoint is OK", async () => {
    const mills = await request.post("/users/register").send(bryanMills);
    const { accessToken } = mills.body;
    const response = await request
      .post("/features")
      .send(newFeature)
      .set({ Authorization: `Bearer ${accessToken}` });
    expect(response.status).toBe(201);
    expect(response.body._id).toBeDefined();
  });

  it("should test that put /features admin endpoint returns updated", async () => {
    const huberman = await request.post("/users/register").send(aliciaHuberman);
    const { accessToken } = huberman.body;
    const feature = await request
      .post("/features")
      .send(newFeature)
      .set({ Authorization: `Bearer ${accessToken}` });
    const { _id } = feature.body;
    const month = "February";
    const response = await request
      .put(`/features/${_id}`)
      .send({ month })
      .set({ Authorization: `Bearer ${accessToken}` });
    expect(response.status).toBe(200);
    expect(response.body.month).toBe(month);
  });

  it("should test that delete /features admin endpoint is OK", async () => {
    const ethan = await request.post("/users/register").send(ethanHunt);
    const { accessToken } = ethan.body;
    const feature = await request
      .post("/features")
      .send(newFeature)
      .set({ Authorization: `Bearer ${accessToken}` });
    const { _id } = feature.body;
    const response = await request
      .delete(`/features/${_id}`)
      .set({ Authorization: `Bearer ${accessToken}` });
    expect(response.status).toBe(204);
  });
});

// if there is more time for testing, implement:-
// describe("💪 Testing tasks endpoints", () => {
//   beforeAll((done) => {
//     mongoose.connect(process.env.MONGO_TEST).then(() => {
//       console.log("Connected to Atlas");
//       done();
//     });
//   });

//   afterAll((done) => {
//     mongoose.connection.dropDatabase().then(() => {
//       console.log("Test DB dropped");
//       mongoose.connection.close().then(() => {
//         done();
//       });
//     });
//   });
// });

// if there is more time for testing, implement:-
// describe("💪 Testing challenges endpoints", () => {
//   beforeAll((done) => {
//     mongoose.connect(process.env.MONGO_TEST).then(() => {
//       console.log("Connected to Atlas");
//       done();
//     });
//   });

//   afterAll((done) => {
//     mongoose.connection.dropDatabase().then(() => {
//       console.log("Test DB dropped");
//       mongoose.connection.close().then(() => {
//         done();
//       });
//     });
//   });
// });

// if there is more time for testing, implement:-
// describe("💪 Testing achievements endpoints", () => {
//   beforeAll((done) => {
//     mongoose.connect(process.env.MONGO_TEST).then(() => {
//       console.log("Connected to Atlas");
//       done();
//     });
//   });

//   afterAll((done) => {
//     mongoose.connection.dropDatabase().then(() => {
//       console.log("Test DB dropped");
//       mongoose.connection.close().then(() => {
//         done();
//       });
//     });
//   });
// });
