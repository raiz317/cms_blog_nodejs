// Load library dotenv di baris paling atas!
require('dotenv').config(); 

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs'); // Library untuk hash password
const jsonwebtoken = require('jsonwebtoken'); // Library untuk token JWT asli

const app = express();
// Mengambil PORT dari .env, jika tidak ada default ke 5000
const PORT = process.env.PORT || 5000; 

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, 'admin')));

// Mengambil MONGO_URI sepenuhnya dari .env
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Database terkoneksi"))
  .catch(err => console.error("Gagal koneksi database:", err));

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// MODEL USER
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
}));

// MODEL POST
const Post = mongoose.model('Post', { title: String, content: String, image: String });

// --- MIDDLEWARE VERIFIKASI TOKEN JWT ---
// Fungsi ini berguna untuk mengamankan endpoint create & delete post
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "Akses ditolak, token hilang" });

    try {
        // Memverifikasi token menggunakan JWT_SECRET dari .env
        const verified = jsonwebtoken.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(403).json({ message: "Token tidak valid atau kedaluwarsa" });
    }
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin/index.html'));
});

// --- LOGIKA REGISTER ---
app.post('/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // AMAN: Password di-hash (diacak) sebelum disimpan ke database
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User Created" });
    } catch (err) {
        res.status(400).json({ message: "Username sudah terdaftar" });
    }
});

// --- LOGIKA LOGIN ---
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
        return res.status(401).json({ message: "Username atau Password salah" });
    }

    // Bandingkan password input dengan password hash di DB
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
        return res.status(401).json({ message: "Username atau Password salah" });
    }

    // AMAN: Membuat token JWT asli menggunakan JWT_SECRET dari .env
    const token = jsonwebtoken.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
});

// AMAN: Ditambahkan middleware 'verifyToken' agar orang asing tidak bisa asal nembak API upload
app.post('/posts', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { title, content } = req.body;
        const newPost = new Post({
            title,
            content,
            image: req.file.filename
        });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (err) {
        res.status(500).json({ message: "Gagal upload" });
    }
});

app.get('/posts', async (req, res) => {
    const posts = await Post.find();
    res.json(posts);
});

// AMAN: Ditambahkan middleware 'verifyToken' agar orang asing tidak bisa asal hapus artikel
app.delete('/posts/:id', verifyToken, async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: "Terhapus" });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server jalan di port ${PORT}`);
});
