const expect = require("chai").expect;
const should = require("chai").should();
const authMiddleware = require("../middleware/is-auth");
const jwt = require("jsonwebtoken");
const sinon = require("sinon");

// Unit tests
/*Unit testing is a testing method by which individual units of source code are tested to determine if they are ready to use, whereas Integration testing checks integration between software modules. ... Unit Testing is executed by the developer, whereas Integration Testing is performed by the testing team
 */

describe("Auth Middleware", function () {
  it("should throw an error if user is not authenticated", function () {
    const req = {
      get: function (headerName) {
        return null;
      },
    };

    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw("Not authenticated.");
  });

  it("should throw an error if the authorization header is only of one string!", function () {
    const req = {
      get: function (headerName) {
        return "xyz";
      },
    };

    // expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  });

  it("should yield a userId after decoding the token.", function () {
    const req = {
      get: function (headerName) {
        return "Bearer manav";
      },
    };

    // first argument will be the actual object which has the method and second is that method (name in string).
    sinon.stub(jwt, "verify");
    jwt.verify.returns({ userId: "abc" });

    authMiddleware(req, {}, () => {});
    expect(req).to.have.property("userId");
    jwt.verify.restore();
  });

  it("should yield a userId of value abc after decoding the token.", function () {
    const req = {
      get: function (headerName) {
        return "Bearer manav";
      },
    };

    // first argument will be the actual object which has the method and second is that method (name in string).
    sinon.stub(jwt, "verify");
    jwt.verify.returns({ userId: "abc" });

    authMiddleware(req, {}, () => {});
    expect(req).to.have.property("userId", "abc"); // well if you know the value.
    expect(jwt.verify.called).to.be.true;
    jwt.verify.restore();
  });

  it("should throw an error if the token is not verified or is manipulated!", function () {
    const req = {
      get: function (headerName) {
        return "Bearer manav";
      },
    };

    // expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  });
});
