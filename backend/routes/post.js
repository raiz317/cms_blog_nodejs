const router = require("express").Router();
const Post = require("../models/Post");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  }
});

const upload = multer({ storage });

// CREATE
router.post("/", upload.single("image"), async (req, res) => {
  const post = await Post.create({
    title: req.body.title,
    content: req.body.content,
    image: req.file.filename
  });
  res.json(post);
});

// READ
router.get("/", async (req, res) => {
  const posts = await Post.find();
  res.json(posts);
});

// UPDATE
router.put("/:id", async (req, res) => {
  const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(post);
});

// DELETE
router.delete("/:id", async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.send("Deleted");
});

module.exports = router;