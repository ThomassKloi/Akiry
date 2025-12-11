console.log("✅ main.js загружен");
console.log("Текущий путь:", window.location.pathname);

//Функция для загрузки скрипта для отдельных страниц
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("/acters/acter.html")) {
    loadActors();
  } else if (path.includes("catalog.html")) {
    loadCatalog();
  } else if (path.includes("index.html") || path === "/") {
    initMainPage();
  } else if (path.includes("/watch/watch.html")) {
    loadWatchPage();
  }
});

// Загрузка страницы актёров
async function loadActors() { 
    /* код для актёров */ 
    const grid = document.getElementById("actorsGrid");
  if (!grid) {
    console.warn("❌ Контейнер для актёров не найден!");
    return;
  }

  try {
    const res = await fetch("/api/actors");
    const actors = await res.json();
    console.log("🎭 Получено актёров:", actors);

    grid.innerHTML = "";

    actors.forEach(actor => {
        const pageName = actor.name.toLowerCase(); // => "tomchik" или "marko"
      const card = document.createElement("div");
      card.className = "flex flex-col items-center text-center";

      card.innerHTML = `
        <img src="${actor.photo}" alt="${actor.name}"
             class="w-[324px] h-[401px] object-cover rounded-lg mb-4 shadow-lg">
        <h3 class="text-xl font-semibold mb-3 text-white">${actor.name}</h3>
        <a href="acter_html/teamplate.html?id=${actor._id}" class="bg-white text-black px-6 py-2 mb-4 rounded-full font-medium hover:scale-105 transition">
          Подробнее..
        </a>
      `;

      grid.appendChild(card);
    });

  } catch (err) {
    console.error("Ошибка загрузки актёров:", err);
    grid.innerHTML = `<p class="text-red-400 text-lg">Ошибка загрузки данных :(</p>`;
  }
}
 // Загрузка страницы каталога
async function loadCatalog() {
  const carousel = document.getElementById("carousel");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");

  let titles = [];
  let currentIndex = 0; // индекс тайтла, который в центре

  // --- 1. Загружаем тайтлы из бэка ---
  async function loadTitles() {
    const res = await fetch("/api/titles");
    titles = await res.json();
    if (!titles.length) return;
    renderCarousel(); // первый рендер без анимации
  }

  // --- 2. Рендерим РОВНО три постера: левый, центр, правый ---
  function renderCarousel() {
    carousel.innerHTML = "";

    if (!titles.length) return;

    for (let offset = -1; offset <= 1; offset++) {
      const realIndex = (currentIndex + offset + titles.length) % titles.length;
      const title = titles[realIndex];

      // внешний контейнер элемента
      const item = document.createElement("div");
      item.className =
        "flex justify-center items-center transition-all duration-500";

      // бокс, который управляет РАЗМЕРАМИ
      const box = document.createElement("div");

      if (offset === 0) {
        // центральный постер
        box.className =
          "w-[400px] h-[600px] flex justify-center items-center transition-all duration-500";
        item.style.opacity = "1";
      } else {
        // боковые постеры
        box.className =
          "w-[325px] h-[480px] flex justify-center items-center opacity-50 transition-all duration-500";
      }

      const img = document.createElement("img");
      img.src = title.poster;
      img.alt = title.title;
      img.className =
        "w-full h-full object-cover rounded-xl shadow-xl";

      box.appendChild(img);
      item.appendChild(box);
      carousel.appendChild(item);

      // клик по боковому постеру -> он становится центральным
      if (offset !== 0) {
        item.style.cursor = "pointer";
        item.addEventListener("click", () => {
          smoothChange(() => {
            currentIndex = realIndex;
            renderCarousel();
          });
        });
      }
    }
  }

  // --- 3. Плавный переход (fade) ---
  function smoothChange(changeFn) {
    // тушим карусель
    carousel.classList.add("opacity-0");

    // даём браузеру один «тик», чтобы применить класс
    setTimeout(() => {
      changeFn(); // меняем индексы и перерисовываем
      // включаем обратно
      carousel.classList.remove("opacity-0");
    }, 150);
  }

  // --- 4. Стрелки ---
  nextBtn.addEventListener("click", () => {
    if (!titles.length) return;
    smoothChange(() => {
      currentIndex = (currentIndex + 1) % titles.length;
      renderCarousel();
    });
  });

  prevBtn.addEventListener("click", () => {
    if (!titles.length) return;
    smoothChange(() => {
      currentIndex = (currentIndex - 1 + titles.length) % titles.length;
      renderCarousel();
    });
  });

  // Кнопка "Смотреть" – переходим на страницу просмотра
  if (watchBtn) {
    watchBtn.addEventListener("click", () => {
      if (!titles.length) return;

      const currentTitle = titles[currentIndex];
      if (!currentTitle || !currentTitle._id) return;

      // Путь до watch.html – подставь под свою структуру
      window.location.href = `/watch/watch.html?id=${currentTitle._id}`;
    });
  }

  // --- 5. Старт ---
  loadTitles();
}

// Загрузка главной страницы
function initMainPage() { 
    /* приветственный блок и т.д. */ 
}

// Загрузка страницы с сериями
async function loadWatchPage() {
  const params = new URLSearchParams(window.location.search);
  const epParam = params.get("ep");
  const id = params.get("id");
  const initialEpisodeNumber = epParam ? Number(epParam) : null;

  if (!id) return;

  try {
    const res = await fetch(`/api/titles/${id}`);
    const data = await res.json();

    // Заполняем блоки
    const titleNameEl = document.getElementById("titleName");
    const titleDescEl = document.getElementById("titleDescription");
    const titlePosterEl = document.getElementById("titlePoster");
    const episodesGrid = document.getElementById("episodesGrid");
    const player = document.getElementById("episodePlayer");
    const source = document.getElementById("episodeSource");

    titleNameEl.textContent = data.title;
    titleDescEl.textContent = data.description;
    titlePosterEl.src = data.poster;

    episodesGrid.innerHTML = "";

    if (!data.episodes || data.episodes.length === 0) {
      episodesGrid.innerHTML =
        '<p class="text-gray-400 col-span-4">Серии пока не добавлены.</p>';
      return;
    }

    // Функция для смены серии
    function setEpisode(ep, button) {
      source.src = ep.videoUrl;
      player.load();
      player.play().catch(() => {});

      // подсветка активной серии
      document
        .querySelectorAll(".episode-btn")
        .forEach((btn) =>
          btn.classList.remove("ring-2", "ring-white", "bg-white/20")
        );
      button.classList.add("ring-2", "ring-white", "bg-white/20");
    }

    // Рендерим сетку серий 4хn
    data.episodes.forEach((ep, index) => {
      const btn = document.createElement("button");
      btn.className =
        "episode-btn w-full h-[70px] bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 flex flex-col items-start justify-center text-left transition";

      btn.innerHTML = `
        <span class="text-xs uppercase tracking-wide text-gray-300">Серия ${ep.number}</span>
        <span class="text-sm md:text-base font-medium">${ep.name || ""}</span>
      `;

      btn.addEventListener("click", () => setEpisode(ep, btn));

      episodesGrid.appendChild(btn);

       // если в URL есть ep=..., включаем именно эту серию
      const epNumber = Number(ep.number); // на всякий случай приводим к числу

       const isInitialByParam =
        initialEpisodeNumber !== null && epNumber === initialEpisodeNumber;

      const isInitialDefault =
        initialEpisodeNumber === null && index === 0; // если ep не передан — первая серия

      if (isInitialByParam || isInitialDefault) {
        setEpisode(ep, btn);
      }
      });
    } catch (err) {
    console.error("Ошибка загрузки тайтла:", err);
  }
}

// === ЛОГИКА ПОИСКА ===
function setupSearch() {
  const input = document.getElementById("searchInput");
  const suggestions = document.getElementById("searchSuggestions");
  const container = document.getElementById("searchContainer");

  if (!input || !suggestions || !container) {
    console.warn("🔍 Элементы поиска не найдены окончательно");
    return;
  }

  console.log("✅ Поиск инициализирован");

  let timer = null;

  async function fetchSuggestions(query) {
    if (!query || query.length < 2) {
      suggestions.classList.add("hidden");
      suggestions.innerHTML = "";
      return;
    }

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );

      if (!res.ok) {
        console.error("Ошибка поиска:", res.status, await res.text());
        return;
      }

      const items = await res.json();
      renderSuggestions(items);
    } catch (err) {
      console.error("Ошибка запроса поиска:", err);
    }
  }

  function renderSuggestions(items) {
    suggestions.innerHTML = "";

    if (!items || !items.length) {
      suggestions.innerHTML =
        '<div class="px-4 py-2 text-gray-400">Ничего не найдено</div>';
      suggestions.classList.remove("hidden");
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className =
        "px-4 py-2 cursor-pointer hover:bg-white/10 transition " +
        "border-b border-white/5 last:border-b-0";

      row.innerHTML = `
        <div class="font-medium">${item.title}</div>
        <div class="text-xs text-gray-400">${item.subtitle || ""}</div>
      `;

      row.addEventListener("click", () => {
        window.location.href = item.url;
      });

      suggestions.appendChild(row);
    });

    suggestions.classList.remove("hidden");
  }

  input.addEventListener("input", () => {
    const value = input.value.trim();

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fetchSuggestions(value);
    }, 250);
  });

  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      suggestions.classList.add("hidden");
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      suggestions.classList.add("hidden");
      input.blur();
    }
  });
}

// Ждём появления элементов поиска в DOM
function initSearchWhenReady() {
  let attempts = 0;
  const maxAttempts = 30; // 30 * 100мс = 3 секунды ожидания

  function tryInit() {
    const hasAll =
      document.getElementById("searchInput") &&
      document.getElementById("searchSuggestions") &&
      document.getElementById("searchContainer");

    if (hasAll) {
      setupSearch();
      return;
    }

    attempts++;
    console.log("🔍 Элементы поиска не найдены, попытка", attempts);

    if (attempts < maxAttempts) {
      setTimeout(tryInit, 100);
    } else {
      console.warn("🔍 Не удалось найти элементы поиска после ожидания");
    }
  }

  tryInit();
}

document.addEventListener("DOMContentLoaded", () => {
  initSearchWhenReady();
});

// если ты бросаешь кастомное событие nav-loaded после подгрузки шапки — это тоже подстраховка
document.addEventListener("nav-loaded", () => {
  initSearchWhenReady();
});
