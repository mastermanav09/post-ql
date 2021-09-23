const expect = require("chai").expect;
const should = require("chai").should();
const mongoose = require("mongoose");
const User = require("../models/user");
// const validate = require("express-validator");
const feedControllers = require("../controllers/feed");
// const sinon = require("sinon");

describe("Feed-Middleware", function () {
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
          _id: "5c0f66b979af55031b34728a",
        });

        return user.save();
      })
      .then(() => {
        done();
      })
      .catch(done);
  });

  it("should add a created post to the posts of the user and of course in the database also.", function (done) {
    const req = {
      userId: "5c0f66b979af55031b34728a",

      body: {
        title: "A test",
        content: "Test is running",
      },

      file: {
        path: "abc",
      },
    };

    const res = {
      statusCode: 500,
      message: "",
      post: null,
      creator: null,

      status: function (code) {
        this.statusCode = code;
        return this;
      },

      json: function (data) {
        this.message = data.message;
        this.post = data.post;
        this.creator = data.creator;
      },
    };

    feedControllers
      .createPost(req, res, () => {})
      .then((savedUser) => {
        expect(savedUser).to.have.property("posts");
        expect(savedUser.posts).to.have.length(1);
        expect(res).to.have.property("statusCode", 201);
        expect(res.message).to.be.equal("Post created successfully!");
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
