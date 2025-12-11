import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// === Настройка путей ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Инициализация приложения ===
const app = express();
app.use(cors());

// === Миддлвары ===
app.use(express.json());                // чтобы Express понимал JSON
app.use(express.static(__dirname));
console.log("📂 Serving static files from:", __dirname);
app.use('/acters/acter_img', express.static(path.join(__dirname, 'acters', 'acter_img')));

// Подключаемся к MongoDB
mongoose.connect("mongodb+srv://stomchik22_db_user:iSLOe2iT4ll080Zu@backclaster.mza6ywb.mongodb.net/?appName=BackClaster", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Схема серии
const episodeSchema = new mongoose.Schema({
  number: { type: Number, required: true },       // номер серии
  name: { type: String },                         // название серии
  videoUrl: { type: String, required: true },     // линк на видео
});

// Схема тайтлов
const titleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  poster: { type: String, required: true },
  description: { type: String },
  episodes: [episodeSchema], 
});

const Title = mongoose.model("Title", titleSchema);

// Эндпоинт для получения всех тайтлов
app.get("/api/titles", async (req, res) => {
  const titles = await Title.find();
  res.json(titles);
});

// Эндпоинт для добавления нового тайтла
app.post("/api/titles", async (req, res) => {
  try {
    const titles = await Title.find({}, "title poster description"); 
    res.json(titles);
  } catch (err) {
    console.error("Ошибка при получении тайтлов:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Получить ОДИН тайтл по id (для страницы watch)
app.get("/api/titles/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const title = await Title.findById(id);   // mongoose сам приведёт строку к ObjectId

    if (!title) {
      return res.status(404).json({ error: "Title not found" });
    }

    res.json(title);
  } catch (err) {
    console.error("Ошибка при получении тайтла:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Схема актёров
const actorSchema = new mongoose.Schema({
  name: String,        // ФИО или ник
  photo: String,       // URL изображения или путь к файлу
  profileUrl: String,  // ссылка на страницу актёра
});

const Actor = mongoose.model("Actor", actorSchema);

// Эндпоинт для получения всех актёров
app.get("/api/actors", async (req, res) => {
  const actors = await Actor.find();
  res.json(actors);
});

// Эндпоинт для карточки актёра
app.get("/api/actors/:id", async (req, res) => {
  try {
    const actor = await Actor.findById(req.params.id);
    if (!actor) return res.status(404).json({ message: "Актёр не найден" });
    res.json(actor);
  } catch (err) {
    res.status(500).json({ message: "Ошибка сервера", error: err.message });
  }
});

// /api/search?q=...
app.get("/api/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    if (!q || q.length < 2) {
      return res.json([]);
    }

    // Экранируем спецсимволы для RegExp
    const escapeRegExp = (s) =>
      s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(escapeRegExp(q), "i");

    const results = [];

    // 1) Тайтлы
    const titles = await Title.find({
      $or: [{ title: regex }, { description: regex }],
    }).limit(10);

    titles.forEach((t) => {
      results.push({
        type: "title",
        title: t.title,
        subtitle: "Тайтл",
        url: `/watch/watch.html?id=${t._id}`,
      });

      // 2) Серии внутри тайтла (если хранишь episodes в тайтле)
      if (Array.isArray(t.episodes)) {
        t.episodes.forEach((ep) => {
          const text = `${t.title} серия ${ep.number} ${ep.name || ""}`;
          if (regex.test(text)) {
            results.push({
              type: "episode",
              title: `${t.title} — серия ${ep.number}`,
              subtitle: ep.name || "Серия",
              // можно передавать номер серии в query-параметрах
              url: `/watch/watch.html?id=${t._id}&ep=${ep.number}`,
            });
          }
        });
      }
    });

    // 3) Актёры
    const actors = await Actor.find({
      name: regex, // или { $or: [{name: regex}, {nickname: regex}] }
    }).limit(10);

    actors.forEach((a) => {
      results.push({
        type: "actor",
        title: a.name,
        subtitle: "Актёр озвучки",
        // подставь сюда реальный путь к карточке актёра
        url: `/acters/acter_html/teamplate.html?id=${a._id}`,
      });
    });

    // Ограничим общее количество подсказок
    res.json(results.slice(0, 15));
  } catch (err) {
    console.error("Ошибка поиска:", err);
    res.status(500).json({ error: "Server error" });
  }
});


app.listen(3000, () => console.log("✅ Server started on http://localhost:3000. Попровка, мы уже на хосте!"));
