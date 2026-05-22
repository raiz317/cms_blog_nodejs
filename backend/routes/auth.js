const router = require("express").Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Ambil model User yang sudah terdaftar di mongoose atau buat baru jika belum ada
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
}));

// ENDPOINT REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username,
      password: hash
    });
    res.status(201).json({ message: "User Created", user: { _id: user._id, username: user.username } });
  } catch (err) {
    res.status(400).json({ message: "Username sudah terdaftar atau data tidak valid" });
  }
});

// ENDPOINT LOGIN
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(401).json({ message: "Username atau Password salah" });

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.status(401).json({ message: "Username atau Password salah" });

    // Gunakan JWT_SECRET dari .env agar aman, fallback ke string jika kosong
    const secretKey = process.env.JWT_SECRET || "secret";
    const token = jwt.sign({ _id: user._id }, secretKey, { expiresIn: '1d' });
    
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
});

module.exports = router;
