import supertest from "supertest";
import server from "../server.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { validUsers, validLogins, validAdmins, validAdminsLogins } from "../utils/validUsers.js";

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
    const response = await request.post("/users/register").send(validUsers[0]);
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
      password: "anothersupersafepassword",
    });
    expect(response.status).toBe(409);
    expect(response.body.error).toBeDefined();
    expect(response.body.available).toBeDefined();
  });

  it("should test that post /users/session endpoint is OK", async () => {
    const response = await request.post("/users/session").send(validLogins[0]);
    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it("should test that post /users/session endpoint returns 401 if bad credentials", async () => {
    const response = await request.post("/users/session").send({
      email: "janebond@gmail.com",
      password: "nothispassword",
    });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Credentials not accepted");
  });

  // post "/users/session/refresh" tests

  it("should test that post /users admin endpoint is OK", async () => {
    const newAdmin = await request.post("/users/register").send(validAdmins[0]);
    const { accessToken } = newAdmin.body;
    const response = await request
      .post("/users")
      .send(validUsers[1])
      .set({ Authorization: `Bearer ${accessToken}` });
    expect(response.status).toBe(201);
    expect(response.body._id).toBeDefined();
  });

  it("should test that post /users admin endpoint returns 401 to previous access token", async () => {
    const newAdmin = await request.post("/users/register").send(validAdmins[1]);
    const { accessToken } = newAdmin.body;
    await request.post("/users/session").send(validAdminsLogins[1]); // provides new access token
    const response = await request
      .post("/users")
      .send(validUsers[2])
      .set({ Authorization: `Bearer ${accessToken}` });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Credentials not accepted");
  });
});
