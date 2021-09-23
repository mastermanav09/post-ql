const User = require("../models/user");
const Post = require("../models/post");
const bcrypt = require("bcryptjs");
const validator = require("validator/validator");
const jwt = require("jsonwebtoken");
const { clearImage } = require("../utils/file");
const io = require("../socket");
require("dotenv").config();

module.exports = {
  createUser: async function ({ userInput }, req) {
    const errors = [];

    userInput.email = validator.trim(userInput.email);
    userInput.password = validator.trim(userInput.password);

    if (!validator.isEmail(userInput.email)) {
      errors.push({ param: "email", message: "E-mail is invalid!" });
    }

    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({
        param: "password",
        message: "Password must be of 5 characters long!",
      });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid Input");
      error.data = errors;
      error.statusCode = 422;
      throw error;
    }

    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      const error = new Error("Validation failed. User already exists!");
      error.statusCode = 422;
      throw error;
    }

    const hashedPw = await bcrypt.hash(userInput.password, 12);

    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw,
    });

    const createdUser = await user.save();
    return {
      _id: createdUser._id.toString(),
      ...createdUser._doc,
    };
  },

  loginUser: async function ({ email, password }) {
    const loadedUser = await User.findOne({ email: email });

    if (!loadedUser) {
      const error = new Error("Authentication failed! User not found.");
      error.statusCode = 401;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, loadedUser.password);

    if (!isEqual) {
      const error = new Error("Invalid Password!");
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        userId: loadedUser._id.toString(),
        email: loadedUser.email,
      },
      process.env.JWT_PRIVATE_KEY,
      {
        expiresIn: "1h",
      }
    );

    return {
      userId: loadedUser._id.toString(),
      token: token,
    };
  },

  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated");
      error.statusCode = 401;
      throw error;
    }

    const errors = [];

    postInput.title = validator.trim(postInput.title);
    postInput.content = validator.trim(postInput.content);

    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ param: "title", message: "Title is Invalid!" });
    }

    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({
        param: "content",
        message: "Please describe your post in at least 5 characters.",
      });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid Input");
      error.data = errors;
      error.statusCode = 422;
      throw error;
    }

    const loadedUser = await User.findById(req.userId);
    if (!loadedUser) {
      const error = new Error("Invalid user");
      error.statusCode = 401;
      throw error;
    }

    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: loadedUser,
    });

    io.getIO().emit("posts", {
      action: "create",
      post: post,
    });

    const createdPost = await post.save();
    loadedUser.posts.push(createdPost);
    await loadedUser.save();

    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      creator: createdPost.creator,
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },

  getPosts: async function ({ page }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated");
      error.statusCode = 401;
      throw error;
    }

    if (!page) {
      page = 1; // Always start with the first page even if the page is not defined.
    }
    const postPerPage = 3;

    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * postPerPage)
      .limit(postPerPage)
      .populate("creator");

    return {
      posts: posts.map((post) => {
        return {
          ...post._doc,
          _id: post._id.toString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        };
      }),
      totalPosts: totalPosts,
    };
  },

  getPost: async function ({ postId }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated");
      error.statusCode = 401;
      throw error;
    }

    const post = await Post.findById(postId).populate("creator");

    if (!post) {
      const error = new Error("Post Not found");
      error.statusCode = 404;
      throw error;
    }

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },

  updatePost: async function ({ id, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated");
      error.statusCode = 401;
      throw error;
    }

    const post = await Post.findById(id).populate("creator");

    if (!post) {
      const error = new Error("Post Not found");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error("Action failed due to invalid authorization!");
      error.statusCode = 403;
      throw error;
    }

    const errors = [];

    postInput.title = validator.trim(postInput.title);
    postInput.content = validator.trim(postInput.content);

    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ param: "title", message: "Title is Invalid!" });
    }

    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({
        param: "content",
        message: "Please describe your post in at least 5 characters.",
      });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid Input");
      error.data = errors;
      error.statusCode = 422;
      throw error;
    }

    post.title = postInput.title;
    post.content = postInput.content;

    if (postInput.imageUrl !== "undefined") {
      // It will checked against text as it will be converted to text by multer if image is not there
      post.imageUrl = postInput.imageUrl;
    }

    const updatedPost = await post.save();

    io.getIO().emit("posts", {
      action: "update",
      post: updatedPost,
    });

    return {
      ...updatedPost._doc,
      id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
    };
  },

  deletePost: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated");
      error.statusCode = 401;
      throw error;
    }

    const post = await Post.findById(id);
    if (!post) {
      const error = new Error("Post Not found");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error("Action failed due to invalid authorization!");
      error.statusCode = 403;
      throw error;
    }

    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(id);

    const user = await User.findById(req.userId);
    user.posts.pull(id);

    await user.save();

    io.getIO().emit("posts", {
      action: "delete",
      postId: id,
    });

    return true;
  },

  user: async function (args, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated");
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("Fetching status failed!");
      error.message = 404;
      throw error;
    }

    return {
      ...user._doc,
      id: user._id.toString(),
    };
  },

  updateStatus: async function ({ status }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated");
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("Fetching status failed!");
      error.message = 404;
      throw error;
    }

    user.status = status;
    await user.save();

    return {
      ...user._doc,
      id: user._id.toString(),
    };
  },
};
