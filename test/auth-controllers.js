const expect = require("chai").expect;
const should = require("chai").should();
const sinon = require("sinon");
const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/user");
const authControllers = require("../controllers/auth");

describe("Auth Controllers - Login", function () {
  before(function (done) {
    mongoose
      .connect(process.env.MONGO_URL, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      })
      .then((result) => {
        const user = new User({
          email: "test@test.com",
          password: "tester",
          name: "Test",
          posts: [],
          _id: "5c0f66b979af55031b34728a", // hard-coded random ID
        });

        return user.save();
      })
      .then(() => {
        done();
      })
      .catch(done);
  });

  it("should throw an error with status code 500 if accessing the database fails", function (done) {
    sinon.stub(User, "findOne");
    User.findOne.throws(); // throws() --> using this will lead to throw an error

    const req = {
      body: {
        email: "test@test.com",
        password: "abc",
      },
    };
    authControllers
      .login(req, {}, () => {})
      .then((result) => {
        expect(result).to.be.an("error");
        expect(result).to.have.property("statusCode", 500); // if code is 400, then this line of code will create an error(expextation unfullfiled) hence, promise will be rejected

        done(); // done() is used in aync requests/ function calls and it has to be called at the end. (Not invoking this might lead to a done() error)
      })
      .catch(done);

    User.findOne.restore();
  });

  it("should send a response containing the valid user status for an existing user.", function (done) {
    const req = {
      userId: "5c0f66b979af55031b34728a",
    };

    const res = {
      statusCode: 500,
      userStatus: null,

      status: function (code) {
        this.statusCode = code;
        return this; // status() fn return this response object again so that we can call json() fn as we were able to chain them
      },

      json: function (data) {
        this.userStatus = data.status;
      },
    };

    authControllers
      .getUserStatus(req, res, () => {})
      .then(() => {
        expect(res.statusCode).to.be.equal(200);
        expect(res.userStatus).to.be.equal("I am new!");
        done();
      })
      .catch(done);
  });

  after(function (done) {
    User.deleteMany({})
      .then(() => {
        return mongoose.disconnect();
      })
      .then(() => {
        done();
      });
  });
});
