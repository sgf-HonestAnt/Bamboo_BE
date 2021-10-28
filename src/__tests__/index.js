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

  it("should test that post /users/register endpoint is OK", async () => {
    const response = await request.post("/users/register").send({
      first_name: "Jane",
      last_name: "Bond",
      username: "janebond007",
      email: "janebond@gmail.com",
      password: "janebond",
    });
    expect(response.status).toBe(201);
    expect(response.body._id).toBeDefined();
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it("should test that post /users/register endpoint returns 409 to username duplicate", async () => {
    const response = await request.post("/users/register").send({
      first_name: "Jane",
      last_name: "Doe",
      username: "janebond007", // duplicate username
      email: "janedoe@gmail.com",
      password: "janedoe",
    });
    expect(response.status).toBe(409);
    expect(response.body.error).toBeDefined();
    expect(response.body.available).toBeDefined();
  });

  it("should test that post /users/session endpoint is OK", async () => {
    const response = await request.post("/users/session").send({
      email: "janebond@gmail.com",
      password: "janebond",
    });
    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it("should test that post /users/session endpoint returns 401 if bad credentials", async () => {
    const response = await request.post("/users/session").send({
      email: "janebond@gmail.com",
      password: "notjanebond",
    });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Credentials not accepted");
  });

  // post "/users/session/refresh" tests

  it("should test that post /users admin endpoint is OK", async () => {
    const newAdmin = await request.post("/users/register").send({
      first_name: "James",
      last_name: "Bond",
      username: "jamesbond007",
      email: "jamesbond@gmail.com",
      password: "jamesbond",
      admin: true,
    });
    const { accessToken } = newAdmin.body;
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
    const newAdmin = await request.post("/users/register").send({
      first_name: "Jane",
      last_name: "Moneypenny",
      username: "secretary",
      email: "missmoneypenny@gmail.com",
      password: "missmoneypenny",
      admin: true,
    });
    const { accessToken } = newAdmin.body;
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
    const newLogin = await request.post("/users/session").send({
      email: "jamesbond@gmail.com",
      password: "jamesbond",
    });
    const { accessToken } = newLogin.body;
    const newUser = await request.post("/users/register").send({
      first_name: "Jason",
      last_name: "Bourne",
      username: "whatsmyidentity",
      email: "jasonbourne@gmail.com",
      password: "jasonbourne",
    });
    const { _id } = newUser.body;
    const response = await request
      .post(`/users/request/${_id}`)
      .set({ Authorization: `Bearer ${accessToken}` });
    expect(response.status).toBe(201);
    expect(response.body.requested).toBeDefined();
    expect(response.body.requested).toContain(_id);
  });

  it("should test that post /users/request/id endpoint returns 401 if bad credentials", async () => {
    const newUser = await request.post("/users/register").send({
      first_name: "Sydney",
      last_name: "Bristow",
      username: "alias",
      email: "syndeybristow@gmail.com",
      password: "syndeybristow",
    });
    const { _id } = newUser.body;
    const response = await request
      .post(`/users/request/${_id}`)
      .set({ Authorization: `Bearer notanaccesstoken` });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Credentials not accepted");
  });

  //   it("should test that post /users/request/id endpoint returns 409 if user requests own ID", async() => {})

  //   it("should test that post /users/request/id endpoint returns 409 if duplicate request", async() => {})

  //   it("should test that post /users/request/id endpoint returns 409 if ID already rejected", async() => {})

  //   it("should test that post /users/accept/id endpoint is OK", async() => {})

  //   it("should test that post /users/reject/id endpoint is OK", async() => {})
});
