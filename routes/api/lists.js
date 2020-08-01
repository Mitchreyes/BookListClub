const express = require("express");
const axios = require("axios");
const config = require("config");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const checkObjectId = require("../../middleware/checkObjectId");

const List = require("../../models/List");
const User = require("../../models/User");

// @route    POST api/lists
// @desc     Create a list
// @access   Private
router.post(
  "/",
  [auth, [check("name", "Name is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const newList = new List({
        name: req.body.name,
        user: req.user.id,
      });

      const list = await newList.save();

      res.json(list);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    PUT api/list/:id/:book_id
// @desc     Add book to list
// @access   Private
router.post(
  "/:id/:book_id",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const list = await List.findById(req.params.id);

      const newBook = {
        title: req.body.title,
        name: user.username,
        user: req.user.id,
      };

      list.books.unshift(newBook);

      await list.save();

      res.json(list.comments);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

// @route    GET api/list/me
// @desc     Get current users lists
// @access   Private
router.get("/me", auth, async (req, res) => {
  try {
    const list = await List.find({
      user: req.user.id,
    }).populate("user", ["username"]);

    if (!list) {
      return res.status(400).json({ msg: "There are no lists for this user" });
    }

    res.json(list);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route    GET api/lists
// @desc     Get all lists
// @access   Public
router.get("/", async (req, res) => {
  try {
    const lists = await List.find().sort({ date: -1 });
    res.json(lists);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

// @route    GET api/list/:id
// @desc     Get list by ID
// @access   Public
router.get("/:id", async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ msg: "List not found" });
    }

    res.json(list);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(404).json({ msg: "List not found" });
    }
    return res.status(500).send("Server Error");
  }
});

// @route    GET api/list/user/:user_id
// @desc     Get lists by user ID
// @access   Public
router.get(
  "/user/:user_id",
  checkObjectId("user_id"),
  async ({ params: { user_id } }, res) => {
    try {
      const list = await List.find({
        user: user_id,
      }).populate("user", ["username"]);

      if (!list) return res.status(400).json({ msg: "Lists not found" });

      return res.json(list);
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ msg: "Server error" });
    }
  }
);

// @route    DELETE api/lists/:id
// @desc     Delete a list
// @access   Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    // Check if list exists
    if (!list) {
      return res.status(404).json({ msg: "List not found" });
    }

    // Check on user authorization
    if (list.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await list.remove();

    res.json({ msg: "List removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(404).json({ msg: "List not found" });
    }
    return res.status(500).send("Server Error");
  }
});

// @route    PUT api/lists/like/:id
// @desc     Like a list
// @access   Private
router.put("/like/:id", auth, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    // Check if the list has already been liked
    if (list.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: "List already liked" });
    }

    list.likes.unshift({ user: req.user.id });

    await list.save();

    return res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route    PUT api/list/unlike/:id
// @desc     Unlike a list that has been liked
// @access   Private
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    // Check if the list has already been liked
    if (
      list.likes.some((like) => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: "List has not yet been liked" });
    }

    // Get remove index
    const removeIndex = list.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    list.likes.splice(removeIndex, 1);

    await list.save();

    return res.json(list.likes);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

// @route    POST api/list/comment/:id
// @desc     Comment on a list
// @access   Private
router.post(
  "/comment/:id",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const list = await List.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.username,
        user: req.user.id,
      };

      list.comments.unshift(newComment);

      await list.save();

      res.json(list.comments);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

// @route    DELETE api/list/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    // Pull out comment
    const comment = list.comments.find(
      (comment) => comment.id === req.params.comment_id
    );
    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }
    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    list.comments = list.comments.filter(
      ({ id }) => id !== req.params.comment_id
    );

    await list.save();

    return res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

module.exports = router;
