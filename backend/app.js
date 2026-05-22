// Load library dotenv di baris paling atas!
require('dotenv').config(); 

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jsonwebtoken = require('jsonwebtoken'); // Untuk verifikasi token post

const app = express();
const PORT = process.env.PORT || 5000; 

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, 'admin')));

// MENGHUBUNGKAN ROUTER AUTH TERPISAH
const authRouter = require('./routes/auth'); 
app.use('/auth', authRouter); // Jalur akses otomatis menjadi /auth/register dan /auth/login

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

// MODEL POST
const Post = mongoose.model('Post', { title: String, content: String, image: String });

// --- MIDDLEWARE VERIFIKASI TOKEN JWT ---
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "Akses ditolak, token hilang" });

    try {
        const secretKey = process.env.JWT_SECRET || "secret";
        const verified = jsonwebtoken.verify(token, secretKey);
        req.user = verified;
        next();
    } catch (err) {
        res.status(403).json({ message: "Token tidak valid atau kedaluwarsa" });
    }
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin/index.html'));
});

// --- API POSTS ---
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
