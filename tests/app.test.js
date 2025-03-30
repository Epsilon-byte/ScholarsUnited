const request = require("supertest");
const { app, server } = require("../app/app.js");

describe("GET /", () => {
    afterAll(() => {
        server.close(); // Ensure the server is closed after tests
    });

    it("should return 200 OK for the login page", async () => {
        const res = await request(app).get("/login");
        expect(res.statusCode).toEqual(200);
    });
});
