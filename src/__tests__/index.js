import supertest from "supertest";
import server from "../server.js";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const request = supertest(server);

describe("Testing the testing environment", () => {
  it("should test that true is true", () => {
    expect(true).toBe(true);
  });
});

describe("Testing the server", () => {
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

  it("should test that a /nonexistent endpoint is returning 404", async () => {
    const response = await request.get("/not-existing");
    expect(response.status).toBe(404);
  });

  const jamesBond = {
    first_name: "James",
    last_name: "Bond",
    username: "redoctober",
    email: "jamesbond@gmail.com",
    password: "jamesbond",
  };

  const jamesBondLogin = {
    email: "jamesbond@gmail.com",
    password: "jamesbond",
  };

  const badBondLogin = {
    email: "jamesbond@gmail.com",
    password: "notjamesbond",
  };
  
  const missMoneypenny = {
    first_name: "Jane",
    last_name: "Moneypenny",
    username: "secretary",
    email: "missmoneypenny@gmail.com",
    password: "missmoneypenny",
    admin: true,
  };
  
  const missMoneypennyLogin = {
    email: "missmoneypenny@gmail.com",
    password: "missmoneypenny",
  };

  const jasonBourne = {
    first_name: "Jason",
    last_name: "Bourne",
    username: "whatsmyidentity",
    email: "jasonbourne@gmail.com",
    password: "jasonbourne",
  };

  const jasonBourneLogin = {
    email: "jasonbourne@gmail.com",
    password: "jasonbourne",
  };

  it("should test that post /users/register endpoint is OK", async () => {
    const response = await request.post("/users/register").send(jamesBond);
    expect(response.status).toBe(201);
    expect(response.body._id).toBeDefined();
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it("should test that post /users/register endpoint returns 409 to username duplicate", async () => {
    const response = await request.post("/users/register").send({
      first_name: "Jack",
      last_name: "Ryan",
      username: "redoctober",
      email: "jackryan@gmail.com",
      password: "jackryan",
    });
    expect(response.status).toBe(409);
    expect(response.body.error).toBeDefined();
    expect(response.body.available).toBeDefined();
  });

  it("should test that post /users/session endpoint is OK", async () => {
    const response = await request.post("/users/session").send(missMoneypenny);
    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it("should test that post /users/session endpoint returns 401 if bad credentials", async () => {
    const response = await request.post("/users/session").send(badBondLogin);
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Credentials not accepted");
  });

  // post "/users/session/refresh" tests

  it("should test that post /users admin endpoint is OK", async () => {
    const newLogin = await request.post("/users/session").send(missMoneypennyLogin);
    const { accessToken } = newLogin.body;
    const response = await request
      .post("/users")
      .send({
        first_name: "Felix",
        last_name: "Leiter",
        username: "luckyfelix",
        email: "felixleiter@gmail.com",
        password: "felixleiter",
      })
      .set({ Authorization: `Bearer ${accessToken}` });
    expect(response.status).toBe(201);
    expect(response.body._id).toBeDefined();
  });

  it("should test that post /users admin endpoint returns 409 if email duplicate", async () => {
    const newLogin = await request.post("/users/session").send(missMoneypennyLogin);
    const { accessToken } = newLogin.body;
    const response = await request
      .post("/users")
      .send({
        first_name: "Vesper",
        last_name: "Lynd",
        username: "notacar",
        email: "felixleiter@gmail.com", // duplicate
        password: "vesperlynd",
      })
      .set({ Authorization: `Bearer ${accessToken}` });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe("Email Exists");
  });

  it("should test that post /users/request/:id endpoint is OK", async () => {
    const newLogin = await request.post("/users/session").send(jamesBondLogin);
    const { accessToken } = newLogin.body;
    const newUser = await request.post("/users/register").send(jasonBourne);
    const { _id } = newUser.body;
    const response = await request
      .post(`/users/request/${_id}`)
      .set({ Authorization: `Bearer ${accessToken}` });
    expect(response.status).toBe(201);
    expect(response.body.requested).toBeDefined();
    expect(response.body.requested).toContain(_id);
  });

  it("should test that post /users/request/id endpoint returns 401 if bad credentials", async () => {
    const newLogin = await request.post("/users/session").send(jamesBondLogin);
    const { _id } = newLogin.body;
    const response = await request
      .post(`/users/request/${_id}`)
      .set({ Authorization: `Bearer NOT_AN_ACCESS_TOKEN` });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Credentials not accepted");
  });

  it("should test that post /users/request/id endpoint returns 404 if user not found", async () => {
    const newLogin = await request.post("/users/session").send(missMoneypennyLogin);
    const { accessToken } = newLogin.body;
    const _id = "M";
    const response = await request
      .post(`/users/request/${_id}`)
      .set({ Authorization: `Bearer ${accessToken}` });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe(`User ID ${_id} not found!`);
  });

  it("should test that post /users/request/id endpoint returns 409 if user requests own ID", async () => {
    const newLogin = await request.post("/users/session").send(missMoneypennyLogin);
    const { _id, accessToken } = newLogin.body;
    const response = await request
      .post(`/users/request/${_id}`)
      .set({ Authorization: `Bearer ${accessToken}` });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe(`User IDs cannot be a match!`);
  });

  it("should test that post /users/request/id endpoint returns 409 if duplicate request", async () => {
    const senderLogin = await request
      .post("/users/session")
      .send(missMoneypennyLogin);
    const sender_token = senderLogin.body.accessToken;
    const sendeeLogin = await request
      .post("/users/session")
      .send(jasonBourneLogin);
    const sendee_id = sendeeLogin.body._id;
    // const newUser = await request.post("/users/register").send({
    //   first_name: "Auric",
    //   last_name: "Goldfinger",
    //   username: "nemesis",
    //   email: "goldfinger@gmail.com",
    //   password: "goldfinger",
    // });
    // const auric_id = newUser.body;
    await request
      .post(`/users/request/${sendee_id}`)
      .set({ Authorization: `Bearer ${sender_token}` });
    const response = await request
      .post(`/users/request/${sendee_id}`)
      .set({ Authorization: `Bearer ${sender_token}` });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe(`Duplicated requests are forbidden!`);
  });

  it("should test that post /users/request/id endpoint returns 409 if ID already rejected", async () => {
    const senderLogin = await request
      .post("/users/session")
      .send(missMoneypennyLogin);
    const sender_id = senderLogin.body._id;
    const sender_token = senderLogin.body._id;
    const sendeeLogin = await request
      .post("/users/session")
      .send(jamesBondLogin);
    const sendee_id = sendeeLogin.body._id;
    const sendee_token = sendeeLogin.body._id;
    await request
      .post(`/users/request/${sendee_id}`)
      .set({ Authorization: `Bearer ${sender_token}` });
    await request
      .post(`/users/reject/${sender_id}`)
      .set({ Authorization: `Bearer ${sendee_token}` });
    const response = await request
      .post(`/users/request/${sendee_id}`)
      .set({ Authorization: `Bearer ${sender_token}` });
    expect(response.status).toBe(409);
  });

  //   it("should test that post /users/accept/id endpoint is OK", async() => {})

  //   it("should test that post /users/reject/id endpoint is OK", async() => {})
});
