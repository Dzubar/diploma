// Глобальные переменные
let canvas, ctx;
let isDrawing = false;
let currentModule = null;
let currentExercise = null;
let currentExerciseIndex = 0;
let moduleExercises = [];
let startTime = null;
let exerciseCompleted = false;
let targetZone = null; // Зона для проверки попадания
let stats = {
  totalExercises: 0,
  successfulExercises: 0,
  totalTime: 0
};

// Ключи хранилища и текущий пользователь
const STORAGE_KEYS = {
  USER_NAME: "logoped_userName",
  USER_ID: "logoped_userId"
};
let currentUser = null;

// Переменные для модуля 2 (Дорожки)
let pathPoints = []; // Точки центральной траектории
let userPath = []; // Путь пользователя
let exitCount = 0; // Количество выходов за границы
let isOutOfBounds = false; // Флаг выхода за границы
let finishZone = null; // Зона финиша

// Переменные для упражнений с подзадачами (Модуль 3)
let currentSubTask = 0; // Текущая подзадача
let totalSubTasks = 0; // Всего подзадач
let completedSubTasks = []; // Массив завершенных подзадач (какие линии реально провел пользователь)

// Переменные для Модуля 6 (Графические диктанты)
let gridSize = 25; // Размер клетки в пикселях (уменьшен для больших фигур)
let gridStartX = 0; // Начальная позиция по X
let gridStartY = 0; // Начальная позиция по Y
let currentGridX = 0; // Текущая позиция по X в сетке
let currentGridY = 0; // Текущая позиция по Y в сетке
let userSequence = []; // Последовательность шагов пользователя
let targetSequence = []; // Целевая последовательность
let gridPath = []; // Путь пользователя в координатах canvas

// Переменные для Модуля 5 (Зрительно-моторное соотнесение)
let gridCellSize = 35; // Размер клетки в пикселях
let gridOffsetX = 0; // Смещение сетки по X
let gridOffsetY = 0; // Смещение сетки по Y
let mirrorTreeSegments = []; // Массив сегментов елочки (левый образец)
let mirrorTreeTargets = []; // Массив целевых сегментов (правая сторона, зеркальное отражение)
let completedSegments = []; // Индексы завершенных сегментов
let treePathTolerance = 20; // Допуск для попадания в траекторию (в пикселях)
let userDrawnPoints = []; // Точки, нарисованные пользователем
let segmentStartPoints = []; // Отслеживание прохождения через начальную точку каждого сегмента
let segmentEndPoints = []; // Отслеживание прохождения через конечную точку каждого сегмента
let pointTolerance = 25; // Допуск для попадания в контрольную точку (пиксели)
// Переменные для модуля "Найди и повтори" ($1 Recognizer)
let userFilterPath = [];

// Переменные для упражнения "Светофор"
let trafficLightState = "green"; // "green" или "red"
let trafficLightTimer = null;
let trafficViolations = 0; // Количество нарушений (движение на красный)
let lastTrafficCheckPos = null;
let lastRedPos = null;
const RED_TOLERANCE = 12;

// Переменные для упражнения Верный маршрут
let starRouteItems = []; // Массив фигур {type: 'star'|'trap', x, y, r}
let starRouteCollected = 0; // Количество собранных звезд

// Переменные для pattern-dots (Узор по точкам)
let patternPoints = []; // Координаты точек сетки
let patternReference = []; // Эталонный узор (массив пар индексов)
let userConnections = []; // Соединения, которые провел пользователь
let activePoint = null; // Активная точка при рисовании
let tempLine = null; // Временная линия при перемещении
let dotGridSize = 5; // Размер сетки (5x5)
let dotRadius = 8; // Радиус точки в пикселях
let dotTolerance = 15; // Допуск для попадания в точку (пиксели)
let patternStartPoint = null; // Индекс стартовой точки (выделяется синим)
let startZoneReached = false; // Фиксация прохождения стартовой зоны
let redStartTime = 0; // Фиксация времени включения красного для задержки реакции

// Переменные для упражнения "Инверсия"
let currentInversionTask = null; // Текущее задание { display: 'up', target: 'down' }
let inversionStartPos = null; // Точка, где пользователь начал касание

// ================= START: [Переменные и конфиг "Переключатель"] =================
let switcherCircles = [];
let switcherCurrentIdx = 0;
let switcherConnections = 0;
let switcherLocked = false;
let switcherCurrentStyle = 0;
const SWITCHER_STYLES = [
  { color: "#4fc3f7", width: 5, dash: [] }, // Обычная линия
  { color: "#ff9800", width: 5, dash: [12, 6] }, // Пунктир
  { color: "#4caf50", width: 6, dash: [5, 5] } // Частый пунктир
];
// ================= END: [Переменные и конфиг "Переключатель"] =================

// Версия файла для отладки
const FILE_VERSION = "1.8.2b Переключатель";

function logVersion() {
  console.log(`📄 script.js version: ${FILE_VERSION}`);
  console.log(` Build: ${new Date().toLocaleDateString()}`);
}

// Инициализация пользователя (первый вход / повторный)
function initUser() {
  const savedName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
  const savedId = localStorage.getItem(STORAGE_KEYS.USER_ID);

  if (!savedName || !savedId) {
    // Первый вход: запрашиваем имя
    let name = prompt("👋 Добро пожаловать! Пожалуйста, введите ваше имя:");
    if (!name || !name.trim()) name = "Гость";

    currentUser = {
      name: name.trim(),
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
    localStorage.setItem(STORAGE_KEYS.USER_NAME, currentUser.name);
    localStorage.setItem(STORAGE_KEYS.USER_ID, currentUser.id);
  } else {
    // Повторный вход: восстанавливаем из хранилища
    currentUser = { name: savedName, id: savedId };
  }
  updateUserNameUI();
}

// Обновление отображения имени в интерфейсе
function updateUserNameUI() {
  const tag = document.getElementById("user-name-tag");
  if (tag && currentUser) {
    tag.textContent = `👤 ${currentUser.name}`;
  }
}

// Выход и полная очистка данных
function logoutAndClearData() {
  if (
    confirm(
      "⚠️ Вы уверены? Все данные, включая статистику и имя, будут удалены."
    )
  ) {
    localStorage.clear(); // Удаляет ВСЕ ключи этого домена
    location.reload(); // Перезагружает страницу для сброса состояния
  }
}

// Загрузка статистики из localStorage
function loadStats() {
  const saved = localStorage.getItem("graphomotorStats");
  if (saved) {
    stats = JSON.parse(saved);
  }
}

// Сохранение статистики
function saveStats() {
  localStorage.setItem("graphomotorStats", JSON.stringify(stats));
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  loadStats();
  initUser(); //ДОБАВЛЕНО: инициализация пользователя
  logVersion(); // ← ДОБАВЛЕНО: вывод версии при загрузке
  // Не инициализируем canvas сразу, только когда он понадобится
});

// Навигация
function showMainMenu() {
  hideAllScreens();
  document.querySelector(".main-menu").classList.remove("hidden");
  // Скрываем все элементы управления
  const regularControls = document.querySelector(".controls");
  const gridControls = document.getElementById("grid-controls");
  if (regularControls) regularControls.classList.remove("hidden");
  if (gridControls) gridControls.classList.add("hidden");
  // Разрешаем скролл в меню
  document.body.style.overflow = "auto";
  // ИСПРАВЛЕНИЕ ОШИБКИ 3: Сбрасываем зеленый фон при выходе в главное меню
  document.body.style.backgroundColor = "";
}

function showExercises() {
  hideAllScreens();
  document.getElementById("exercises-menu").classList.remove("hidden");
  // Скрываем все элементы управления
  const regularControls = document.querySelector(".controls");
  const gridControls = document.getElementById("grid-controls");
  if (regularControls) regularControls.classList.remove("hidden");
  if (gridControls) gridControls.classList.add("hidden");
  // Разрешаем скролл в меню выбора упражнений
  document.body.style.overflow = "auto";
}

function showResults() {
  hideAllScreens();
  document.getElementById("results-screen").classList.remove("hidden");
  updateResultsDisplay();
  // Разрешаем скролл на экране результатов
  document.body.style.overflow = "auto";
}

function showInfo() {
  hideAllScreens();
  document.getElementById("info-screen").classList.remove("hidden");
  // Разрешаем скролл на экране информации
  document.body.style.overflow = "auto";
}

function hideAllScreens() {
  document.querySelector(".main-menu").classList.add("hidden");
  document.getElementById("exercises-menu").classList.add("hidden");
  document.getElementById("exercise-screen").classList.add("hidden");
  document.getElementById("results-screen").classList.add("hidden");
  document.getElementById("info-screen").classList.add("hidden");
}

// Начать занятие (автоматический набор упражнений)
// Начать занятие (случайный набор из 8 упражнений)
function startLesson() {
  const lessonExercises = [];

  // Проходим по всем 8 модулям (от 1 до 8)
  for (let i = 1; i <= 8; i++) {
    // Получаем все упражнения этого модуля
    const exercises = getModuleExercises(i);

    // Если упражнения есть, выбираем случайное
    if (exercises && exercises.length > 0) {
      const randomIndex = Math.floor(Math.random() * exercises.length);
      lessonExercises.push(exercises[randomIndex]);
    }
  }

  // Устанавливаем глобальные переменные для "смешанного" занятия
  currentModule = 0; // 0 означает, что это не конкретный модуль, а микс
  moduleExercises = lessonExercises;
  currentExerciseIndex = 0;

  // Инициализация экрана упражнения (аналогично loadModule)
  hideAllScreens();
  document.getElementById("exercise-screen").classList.remove("hidden");

  // Небольшая задержка для корректного отображения canvas
  setTimeout(() => {
    if (!canvas) {
      initCanvas();
    } else {
      resizeCanvas();
    }

    currentExercise = moduleExercises[currentExerciseIndex];
    displayExercise(currentExercise);
    startTime = Date.now();
  }, 100);
}

// Загрузка модуля
function loadModule(moduleNum) {
  currentModule = moduleNum;
  currentExerciseIndex = 0;
  moduleExercises = getModuleExercises(moduleNum);

  // ИСПРАВЛЕНИЕ ОШИБКИ 3: Зеленый фон для Модуля 6
  if (moduleNum === 6) {
    document.body.style.backgroundColor = "#f0fff0";
  } else {
    document.body.style.backgroundColor = "";
  }

  hideAllScreens();
  document.getElementById("exercise-screen").classList.remove("hidden");

  // Небольшая задержка для корректного отображения canvas
  setTimeout(() => {
    // Инициализируем canvas после показа экрана
    if (!canvas) {
      initCanvas();
    } else {
      // Пересчитываем размеры с учетом позиции кнопок
      resizeCanvas();
    }

    currentExercise = moduleExercises[currentExerciseIndex];
    // === Блок генерации для Модуль 7
    if (currentExercise.type === "forbidden-color") {
      const islands = generateForbiddenColorIslands(); // Генерируем случайные
      currentExercise.blueIslands = islands.blueIslands;
      currentExercise.yellowIslands = islands.yellowIslands;
      currentExercise.forbiddenColor = { r: 255, g: 235, b: 59 };
    }
    // ===========================
    displayExercise(currentExercise);

    startTime = Date.now();
  }, 100); // Увеличена задержка до 100ms для надежности
}

// Получение упражнений модуля
function getModuleExercises(moduleNum) {
  const modules = {
    1: [
      {
        title: "Поставь точку в центре",
        type: "point-center",
        instruction: "Коснись центра экрана"
      },
      {
        title: "Поставь точку вверху",
        type: "point-top",
        instruction: "Коснись верхней части экрана"
      },
      {
        title: "Поставь точку внизу",
        type: "point-bottom",
        instruction: "Коснись нижней части экрана"
      },
      {
        title: "Поставь точку слева",
        type: "point-left",
        instruction: "Коснись левой части экрана"
      },
      {
        title: "Поставь точку справа",
        type: "point-right",
        instruction: "Коснись правой части экрана"
      }
    ],
    2: [
      {
        title: "Проведи по прямой дорожке",
        type: "path-straight",
        instruction: "Веди пальцем по дорожке слева направо"
      },
      {
        title: "Поднимись по столбику",
        type: "path-vertical",
        instruction: "Веди пальцем снизу вверх"
      },
      {
        title: "Перепрыгни через кочки",
        type: "path-zigzag",
        instruction: "Веди пальцем по зигзагу"
      },
      {
        title: "Проплыви по волнам",
        type: "path-wave",
        instruction: "Веди пальцем по волнистой линии"
      },
      {
        title: "Закрути улитку",
        type: "path-spiral",
        instruction: "Веди пальцем по спирали от центра"
      }
    ],
    3: [
      {
        title: "Прямые линии",
        type: "path-lines",
        instruction: "Обведи все прямые линии сверху вниз",
        subTasks: 5
      },
      {
        title: "Наклонные линии",
        type: "path-diagonal",
        instruction: "Обведи все наклонные линии",
        subTasks: 8
      },
      {
        title: "Круги",
        type: "path-circles",
        instruction: "Обведи все круги по контуру",
        subTasks: 6
      },
      {
        title: "Дуги",
        type: "path-arcs",
        instruction: "Обведи все дуги плавным движением",
        subTasks: 5
      },
      {
        title: "Пружинка",
        type: "path-loops",
        instruction: "Обведи волнистые линии слева направо",
        subTasks: 3
      }
    ],
    4: [
      {
        title: "Ритмичный заборчик",
        type: "rhythmic-fence",
        instruction: "Веди пальцем по зигзагу, чередуя высоту зубьев"
      },
      {
        title: "Волна и утес",
        type: "wave-cliff",
        instruction: "Чередуй плавные волны и резкие углы"
      },
      {
        title: "Ритмическая спираль",
        type: "rhythmic-spiral",
        instruction:
          "Веди пальцем по спирали, чередуя большие и маленькие петли"
      },
      {
        title: "Зубчатая стена",
        type: "meander-wall",
        instruction:
          "Веди пальцем по ступенькам, строго по горизонтали и вертикали"
      },
      {
        title: "Комбинированная цепь",
        type: "combined-chain",
        instruction: "Финальный тест: круги, углы и прямые линии в одной цепи"
      }
    ],
    5: [
      {
        title: "Нарисуй фигуру",
        type: "gesture-shape",
        instruction:
          "Посмотри на фигуру слева и нарисуй такую же справа одним движением",
        targetShape: "circle" // будет заменено при генерации
      },
      {
        title: "Рисуем Ромб",
        type: "pattern-dots",
        instruction: "Соедини точки, чтобы получился ромб",
        gridSize: 5,
        startPoint: 2, // Начинаем с верхней точки
        points: [
          // Сетка 5x5 (стандартная)
          { x: 0.1, y: 0.1 },
          { x: 0.3, y: 0.1 },
          { x: 0.5, y: 0.1 },
          { x: 0.7, y: 0.1 },
          { x: 0.9, y: 0.1 },
          { x: 0.1, y: 0.3 },
          { x: 0.3, y: 0.3 },
          { x: 0.5, y: 0.3 },
          { x: 0.7, y: 0.3 },
          { x: 0.9, y: 0.3 },
          { x: 0.1, y: 0.5 },
          { x: 0.3, y: 0.5 },
          { x: 0.5, y: 0.5 },
          { x: 0.7, y: 0.5 },
          { x: 0.9, y: 0.5 },
          { x: 0.1, y: 0.7 },
          { x: 0.3, y: 0.7 },
          { x: 0.5, y: 0.7 },
          { x: 0.7, y: 0.7 },
          { x: 0.9, y: 0.7 },
          { x: 0.1, y: 0.9 },
          { x: 0.3, y: 0.9 },
          { x: 0.5, y: 0.9 },
          { x: 0.7, y: 0.9 },
          { x: 0.9, y: 0.9 }
        ],
        pattern: [
          [2, 8],
          [8, 14],
          [14, 18],
          [18, 22],
          [22, 16],
          [16, 10],
          [10, 6],
          [6, 2]
        ]
      },
      {
        title: "Узор по точкам",
        type: "pattern-dots",
        instruction: "Начни с синей точки и повтори узор",
        gridSize: 5,
        startPoint: 20,
        points: [
          // Сетка 5x5 (25 точек)
          { x: 0.1, y: 0.1 },
          { x: 0.3, y: 0.1 },
          { x: 0.5, y: 0.1 },
          { x: 0.7, y: 0.1 },
          { x: 0.9, y: 0.1 },
          { x: 0.1, y: 0.3 },
          { x: 0.3, y: 0.3 },
          { x: 0.5, y: 0.3 },
          { x: 0.7, y: 0.3 },
          { x: 0.9, y: 0.3 },
          { x: 0.1, y: 0.5 },
          { x: 0.3, y: 0.5 },
          { x: 0.5, y: 0.5 },
          { x: 0.7, y: 0.5 },
          { x: 0.9, y: 0.5 },
          { x: 0.1, y: 0.7 },
          { x: 0.3, y: 0.7 },
          { x: 0.5, y: 0.7 },
          { x: 0.7, y: 0.7 },
          { x: 0.9, y: 0.7 },
          { x: 0.1, y: 0.9 },
          { x: 0.3, y: 0.9 },
          { x: 0.5, y: 0.9 },
          { x: 0.7, y: 0.9 },
          { x: 0.9, y: 0.9 }
        ],
        pattern: [
          // Равнобедренный треугольник (8 сегментов)
          [20, 11], // Левая грань (часть 1)
          [11, 2], // Левая грань (часть 2)
          [2, 13], // Правая грань (часть 1)
          [13, 24], // Правая грань (часть 2)
          [24, 23], // Основание (часть 1)
          [23, 22], // Основание (часть 2)
          [22, 21], // Основание (часть 3)
          [21, 20] // Основание (часть 4)
        ]
      },
      {
        title: "Рисуем Домик",
        type: "pattern-dots",
        instruction: "Начни с синей точки и построй домик",
        gridSize: 5,
        startPoint: 20, // Начинаем с левого нижнего угла
        points: [
          // Сетка 5×5 (стандартная)
          { x: 0.1, y: 0.1 },
          { x: 0.3, y: 0.1 },
          { x: 0.5, y: 0.1 },
          { x: 0.7, y: 0.1 },
          { x: 0.9, y: 0.1 },
          { x: 0.1, y: 0.3 },
          { x: 0.3, y: 0.3 },
          { x: 0.5, y: 0.3 },
          { x: 0.7, y: 0.3 },
          { x: 0.9, y: 0.3 },
          { x: 0.1, y: 0.5 },
          { x: 0.3, y: 0.5 },
          { x: 0.5, y: 0.5 },
          { x: 0.7, y: 0.5 },
          { x: 0.9, y: 0.5 },
          { x: 0.1, y: 0.7 },
          { x: 0.3, y: 0.7 },
          { x: 0.5, y: 0.7 },
          { x: 0.7, y: 0.7 },
          { x: 0.9, y: 0.7 },
          { x: 0.1, y: 0.9 },
          { x: 0.3, y: 0.9 },
          { x: 0.5, y: 0.9 },
          { x: 0.7, y: 0.9 },
          { x: 0.9, y: 0.9 }
        ],
        pattern: [
          [20, 10],
          [10, 14],
          [14, 24],
          [24, 20],
          [10, 2],
          [2, 14]
        ]
      },
      {
        title: "Волнистая дорожка",
        type: "sine-corridor",
        instruction: "Веди линию вниз между линиями, повторяя волну"
      }
    ],
    6: [
      {
        title: "Квадратное окошко",
        type: "grid-square",
        instruction: "Проведи: 2 клетки вправо, 2 вниз, 2 влево, 2 вверх",
        sequence: ["right", "right", "down", "down", "left", "left", "up", "up"]
      },
      {
        title: "Лесенка-гора",
        type: "grid-mountain",
        instruction:
          "Построй гору! Повтори 4 раза: (1 вправо, 1 вверх). А потом 4 раза: (1 вправо, 1 вниз)",
        sequence: [
          "right",
          "up",
          "right",
          "up",
          "right",
          "up",
          "right",
          "up",
          "right",
          "down",
          "right",
          "down",
          "right",
          "down",
          "right",
          "down"
        ]
      },
      {
        title: "Цифровая змейка",
        type: "grid-snake",
        instruction:
          "Нарисуй змейку: 1 вправо, 1 вверх, 2 вправо, 1 вниз, 1 вправо, 2 вверх, 1 вправо, 2 вниз",
        sequence: [
          "right",
          "up",
          "right",
          "right",
          "down",
          "right",
          "up",
          "up",
          "right",
          "down",
          "down"
        ]
      },
      {
        title: "Волшебный цилиндр",
        type: "grid-snake",
        instruction:
          "Нарисуй шляпу фокусника: 1 вправо, 3 вверх, 2 вправо, 3 вниз, 1 вправо, 1 вниз, 4 влево, 1 вверх",
        sequence: [
          "right",
          "up",
          "up",
          "up",
          "right",
          "right",
          "down",
          "down",
          "down",
          "right",
          "down",
          "left",
          "left",
          "left",
          "left",
          "up"
        ]
      },
      {
        title: "Подарок",
        type: "grid-heart",
        instruction:
          "Давай нарисуем красивое сердечко! Внимательно слушай и точно выполняй каждый шаг: начни с 2 шагов вправо, затем 1 шаг вниз, снова 2 шага вправо, потом 1 шаг вверх, ещё 2 шага вправо, 1 шаг вниз, 1 шаг вправо и 3 шага вниз. Теперь важная часть - повторяй трижды такую связку: 1 шаг влево и 1 шаг вниз. После этого сделай 2 шага влево. Теперь снова повторяй трижды: 1 шаг вверх и 1 шаг влево. Завершаем сердечко: 3 шага вверх, 1 шаг вправо и 1 шаг вверх для замыкания контура.",
        sequence: [
          "right",
          "right",
          "down",
          "right",
          "right",
          "up",
          "right",
          "right",
          "down",
          "right",
          "down",
          "down",
          "down",
          "left",
          "down",
          "left",
          "down",
          "left",
          "down",
          "left",
          "left",
          "up",
          "left",
          "up",
          "left",
          "up",
          "left",
          "up",
          "up",
          "up",
          "right",
          "up"
        ]
      }
    ],
    7: [
      {
        title: "Инверсия",
        type: "inversion",
        instruction: "Внимание! Рисуй в ПРОТИВОПОЛОЖНУЮ сторону от стрелки"
      },
      {
        title: "Светофор",
        type: "traffic-light",
        instruction:
          "Веди линию только когда зелёный свет! Когда красный — остановись"
      },
      /*{
        title: "Найди ошибку",
        type: "find-error",
        instruction: "Найди неправильный элемент"
      },
      {
        title: "Сравни узоры",
        type: "compare",
        instruction: "Выбери правильный узор"
      },*/
      {
        title: "Запретный цвет",
        type: "forbidden-color",
        instruction: "Соедини все синие островки, но НЕ касайся жёлтых!",
        blueIslands: [
          {
            x: 100,
            y: 150,
            r: 25
          },
          {
            x: 300,
            y: 250,
            r: 25
          },
          {
            x: 200,
            y: 400,
            r: 25
          }
        ],
        yellowIslands: [
          {
            x: 150,
            y: 200,
            r: 30
          },
          {
            x: 250,
            y: 350,
            r: 30
          }
        ],
        forbiddenColor: {
          r: 255,
          g: 235,
          b: 59
        }
      },
      {
        title: "Верный маршрут",
        type: "star-route",
        instruction: "Соедини все звёздочки, но не трогай ловушки!"
      },
      // ================= START: [Конфиг "Переключатель"] =================
      {
        title: "Переключатель",
        type: "switcher",
        instruction:
          "Соединяй кружки по 2 штуки. Когда линия остановится — нажми кнопку на поле!"
      }
      // ================= END: [Конфиг "Переключатель"] =================
    ]
  };

  return modules[moduleNum] || modules[1];
}

// Переход к следующему упражнению
function nextExercise() {
  if (exerciseCompleted) {
    stats.successfulExercises++;
    stats.totalTime += Date.now() - startTime;
  }
  stats.totalExercises++;
  saveStats();

  currentExerciseIndex++;

  if (currentExerciseIndex >= moduleExercises.length) {
    // Модуль завершен - автоматически переходим к экрану выбора модулей
    showExercises();
  } else {
    currentExercise = moduleExercises[currentExerciseIndex];
    displayExercise(currentExercise);
    startTime = Date.now();
  }
}

// Выход из упражнения
function exitExercise() {
  // Скрываем все элементы управления
  const regularControls = document.querySelector(".controls");
  const gridControls = document.getElementById("grid-controls");
  regularControls.classList.remove("hidden");
  gridControls.classList.add("hidden");

  showExercises();
  // Разрешаем скролл при выходе из упражнения
  document.body.style.overflow = "auto";
}

// Обновление отображения результатов
function updateResultsDisplay() {
  // Безопасное получение данных
  const total = stats.totalExercises || 0;
  const successful = stats.successfulExercises || 0;
  const totalTimeMs = stats.totalTime || 0; // Всегда в миллисекундах

  // Расчёт метрик с защитой от деления на 0
  const accuracy = total > 0 ? Math.round((successful / total) * 100) : 0;
  const avgTimeSec =
    successful > 0 ? Math.round(totalTimeMs / successful / 1000) : 0;

  // Обновление DOM с проверкой существования элементов
  const totalEl = document.getElementById("total-exercises");
  if (totalEl) totalEl.textContent = total;

  const rateEl = document.getElementById("success-rate"); // ✅ Исправленный ID
  if (rateEl) rateEl.textContent = accuracy + "%";

  const timeEl = document.getElementById("avg-time"); // ✅ Исправленный ID
  if (timeEl) timeEl.textContent = avgTimeSec + " сек";

  // Прогресс-бар (если есть в вёрстке)
  const progressEl = document.getElementById("progress-fill");
  if (progressEl) progressEl.style.width = accuracy + "%";
}

// Сброс статистики
function resetStats() {
  stats = {
    totalExercises: 0,
    successfulExercises: 0,
    totalTime: 0
  };
  saveStats();
  updateResultsDisplay();
}

// Отображение упражнения
function displayExercise(exercise) {
  if (!exercise) {
    console.error("No exercise provided!");
    return;
  }

  // ✅ ДОБАВЛЕН СБРОС СОСТОЯНИЯ РИСОВАНИЯ
  isDrawing = false;
  userFilterPath = [];

  console.log("Displaying exercise:", exercise.title, exercise.type);

  // ============================================
  // ОТКЛЮЧЕНИЕ РИСОВАНИЯ ДЛЯ ГРАФИЧЕСКИХ ДИКТАНТОВ
  // ============================================
  if (canvas) {
    if (exercise.type && exercise.type.startsWith("grid-")) {
      // Для диктантов (Модуль 6) отключаем реакцию на касания
      canvas.style.pointerEvents = "none";
    } else {
      // Для остальных упражнений включаем рисование
      canvas.style.pointerEvents = "auto";
    }
  }
  // ============================================

  // Блокируем скролл во время выполнения упражнения
  document.body.style.overflow = "hidden";

  document.getElementById("exercise-title").textContent = exercise.title;
  document.getElementById("instruction").textContent = exercise.instruction;
  document.getElementById("feedback").classList.add("hidden");

  exerciseCompleted = false;
  targetZone = null;

  // ================= START: [Видимость кнопки Переключателя] =================
  const switchBtn = document.getElementById("switch-btn");
  if (currentExercise && currentExercise.type === "switcher") {
    switchBtn.classList.remove("hidden");
    switchBtn.classList.add("visible");
    switchBtn.style.display = "block";
    switchBtn.disabled = true;
  } else {
    switchBtn.classList.add("hidden");
    switchBtn.classList.remove("visible");
    switchBtn.style.display = "none";
    switchBtn.disabled = true;
  }
  // ================= END: [Видимость кнопки Переключателя] =================

  // Очищаем таймер светофора
  if (trafficLightTimer) {
    clearTimeout(trafficLightTimer);
    trafficLightTimer = null;
  }
  trafficLightState = "green";
  trafficViolations = 0;
  lastTrafficCheckPos = null;
  startZoneReached = false;
  redStartTime = 0;

  // Сброс переменных для Верный маршрут
  starRouteItems = [];
  starRouteCollected = 0;

  // Сброс переменных для модуля 2
  pathPoints = [];
  userPath = [];
  exitCount = 0;
  isOutOfBounds = false;
  finishZone = null;

  // ================= START: [Сброс "Переключатель"] =================
  if (currentExercise && currentExercise.type === "switcher") {
    switcherCircles = [];
    switcherCurrentIdx = 0;
    switcherConnections = 0;
    switcherLocked = false;
    switcherCurrentStyle = 0;
    const btn = document.getElementById("switch-btn");
    if (btn) btn.disabled = true; // Кнопка всегда видна, но неактивна
  }
  // ================= END: [Сброс "Переключатель"] =================

  // Сброс для упражнения "Инверсия"
  currentInversionTask = null;
  inversionStartPos = null;

  // Сброс переменных для подзадач
  currentSubTask = 0;
  totalSubTasks = exercise.subTasks || 0;
  completedSubTasks = []; // Пустой массив - никто ничего не провел

  // Сброс переменных для Модуля 6 (Графические диктанты)
  userSequence = [];
  targetSequence = exercise.sequence || [];
  gridPath = [];
  currentGridX = 0;
  currentGridY = 0;

  // Сброс переменных для Модуля 5 (Зрительно-моторное соотнесение)
  mirrorTreeSegments = [];
  mirrorTreeTargets = [];
  completedSegments = [];
  userDrawnPoints = [];
  segmentStartPoints = [];
  segmentEndPoints = [];
  if (exercise.segments) {
    // Копируем левый образец (видимый)
    mirrorTreeSegments = JSON.parse(JSON.stringify(exercise.segments));

    // Создаем зеркальные отражения для правой стороны с сохранением isCompleted и subTaskIndex
    mirrorTreeTargets = exercise.segments.map((seg) => ({
      x1: -seg.x1, // Зеркальное отражение относительно x=0
      y1: seg.y1,
      x2: -seg.x2,
      y2: seg.y2,
      isCompleted: false, // Все сегменты начинаются как невыполненные
      subTaskIndex: seg.subTaskIndex // Сохраняем индекс подзадачи
    }));
  }

  // Сброс для упражнения с распознаванием Найди и повтори
  if (exercise.type === "gesture-shape") {
    currentExercise.shapes = generateGestureShapes();
    // Случайно выбираем, какую именно фигуру нужно нарисовать
    const targetIdx = Math.floor(Math.random() * 3);
    currentExercise.targetShape = currentExercise.shapes[targetIdx].type;

    const shapeName = SHAPE_NAMES_RU[currentExercise.targetShape];
    const emoji = SHAPE_EMOJI[currentExercise.targetShape];

    // ✅ ИСПОЛЬЗУЕМ innerHTML для применения стилей
    const instructionEl = document.getElementById("instruction");
    instructionEl.innerHTML = `Найди <span style="font-size:1.4em; vertical-align:middle;">${emoji}</span> <span style="font-weight:bold; color:#06111a;">"${shapeName}"</span> и нарисуй его справа одним движением`;
  }

  // Сброс переменных для pattern-dots (Узор по точкам)
  patternPoints = [];
  patternReference = [];
  userConnections = [];
  activePoint = null;
  tempLine = null;
  patternStartPoint = null;
  if (exercise.points && exercise.pattern) {
    patternPoints = JSON.parse(JSON.stringify(exercise.points));
    patternReference = JSON.parse(JSON.stringify(exercise.pattern));
    patternStartPoint = exercise.startPoint || null;
  }

  // Показываем/скрываем соответствующие элементы управления
  const regularControls = document.querySelector(".controls");
  const gridControls = document.getElementById("grid-controls");

  if (exercise.type && exercise.type.startsWith("grid-")) {
    // Модуль 6: показываем кнопки-стрелки, скрываем обычные кнопки
    regularControls.classList.add("hidden");
    gridControls.classList.remove("hidden");

    // Управляем видимостью кнопки "Дальше" при инициализации
    // Проверяем тип упражнения, а не номер модуля (важно для смешанных занятий!)
    if (exercise.type && exercise.type.startsWith("grid-")) {
      // Для графических диктантов кнопка "Дальше" всегда видна
      document.getElementById("next-level-btn").classList.remove("hidden");
    } else {
      // В других модулях скрываем кнопку "Дальше" при инициализации
      document.getElementById("next-level-btn").classList.add("hidden");
    }

    // Обновляем счетчик шагов
    document.getElementById("current-step").textContent = "0";
    document.getElementById("total-steps").textContent =
      targetSequence.length.toString();
  } else {
    // Другие модули: показываем обычные кнопки, скрываем стрелки
    regularControls.classList.remove("hidden");
    gridControls.classList.add("hidden");
  }

  if (canvas && ctx) {
    setTimeout(() => {
      resizeCanvas();
      clearCanvas();
      // Генерируем случайные островки ПЕРЕД отрисовкой для "Запретного цвета"
      if (currentExercise && currentExercise.type === "forbidden-color") {
        generateForbiddenColorIslands();
      }
      drawExerciseTemplate(currentExercise);
    }, 50);
  } else {
    console.error("Canvas not initialized!");
  }
}

// Инициализация canvas
function initCanvas() {
  canvas = document.getElementById("canvas");
  if (!canvas) {
    console.error("Canvas element not found!");
    return;
  }

  ctx = canvas.getContext("2d");
  resizeCanvas();

  // Удаляем старые обработчики, если они есть
  canvas.removeEventListener("touchstart", handleCanvasTouch);
  canvas.removeEventListener("mousedown", handleCanvasClick);
  canvas.removeEventListener("touchmove", draw);
  canvas.removeEventListener("touchend", stopDrawing);
  canvas.removeEventListener("mousemove", draw);
  canvas.removeEventListener("mouseup", stopDrawing);

  // События для точечных упражнений (клик/тап)
  canvas.addEventListener("touchstart", handleCanvasTouch);
  canvas.addEventListener("mousedown", handleCanvasClick);

  // События для рисования (для других модулей)
  canvas.addEventListener("touchmove", draw);
  canvas.addEventListener("touchend", stopDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);

  // Удаляем старый обработчик resize, если есть
  window.removeEventListener("resize", resizeCanvas);
  window.addEventListener("resize", resizeCanvas);

  console.log("Canvas initialized:", canvas.width, "x", canvas.height);
}

function resizeCanvas() {
  if (!canvas) return;

  // Получаем контейнер canvas
  const container = canvas.parentElement;
  if (!container) return;

  // Получаем блок с кнопками управления
  const controlsBlock = document.querySelector(".controls");
  if (!controlsBlock) return;

  // Получаем позиции элементов
  const containerRect = container.getBoundingClientRect();
  const controlsRect = controlsBlock.getBoundingClientRect();

  // Безопасный отступ между canvas и кнопками (15px)
  const safeMargin = 15;

  // Вычисляем доступную высоту: от верха контейнера до верха кнопок минус безопасный отступ
  const availableHeight = controlsRect.top - containerRect.top - safeMargin;

  // Устанавливаем размеры canvas
  // Ширина - по контейнеру
  canvas.width = Math.floor(containerRect.width);

  // Высота - максимально доступная до кнопок
  canvas.height = Math.floor(Math.max(availableHeight, 200)); // Минимум 200px для безопасности

  console.log(
    "Canvas resized:",
    canvas.width,
    "x",
    canvas.height,
    "Available height:",
    availableHeight
  );

  // Перерисовываем шаблон после изменения размера
  if (currentExercise) {
    drawExerciseTemplate(currentExercise);
  }
}

// Очистка canvas
function clearCanvas() {
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Перерисовываем шаблон после очистки
    if (currentExercise) {
      drawExerciseTemplate(currentExercise);
    }
  }
}

// Показать подсказку
function showHint() {
  const feedback = document.getElementById("feedback");
  feedback.textContent =
    "💡 Веди пальцем медленно и аккуратно по пунктирной линии";
  feedback.className = "feedback";
  feedback.classList.remove("hidden");

  setTimeout(() => {
    feedback.classList.add("hidden");
  }, 3000);
}

// Обработка касания/клика на canvas
function handleCanvasTouch(e) {
  e.preventDefault();

  if (exerciseCompleted) return;

  const pos = getPosition(e);

  // Модуль 1: Точечные упражнения
  if (currentExercise && currentExercise.type.startsWith("point-")) {
    checkPointPlacement(pos);
  }
  // Модуль 2 и 3: Дорожки
  else if (currentExercise && currentExercise.type.startsWith("path-")) {
    startDrawingPath(e);
  }
  // Модуль 4: Серийность движений (используют механизм дорожек)
  else if (
    currentExercise &&
    (currentExercise.type === "rhythmic-fence" ||
      currentExercise.type === "wave-cliff" ||
      currentExercise.type === "rhythmic-spiral" ||
      currentExercise.type === "meander-wall" ||
      currentExercise.type === "combined-chain")
  ) {
    startDrawingPath(e);
  }
  // Модуль 5: Зрительно-моторное соотнесение
  else if (currentExercise && currentExercise.type === "mirror-tree") {
    startDrawingMirrorTree(e);
  }
  // Модуль 5: Найди и повтори
  else if (currentExercise && currentExercise.type === "gesture-shape") {
    startDrawingGesture(e);
  }
  //  Волнистая дорожка
  else if (currentExercise && currentExercise.type === "sine-corridor") {
    startDrawingSineCorridor(e);
  }
  // Модуль 7: Светофор
  else if (currentExercise && currentExercise.type === "traffic-light") {
    startDrawingTrafficLight(e);
  }
  // Модуль 7: Инверсия
  else if (currentExercise && currentExercise.type === "inversion") {
    startDrawingInversion(e);
  }
  // Модуль 7: Верный маршрут
  else if (currentExercise && currentExercise.type === "star-route") {
    startDrawingStarRoute(e);
  }
  // ================= START: [Касание "Переключатель"] =================
  else if (currentExercise && currentExercise.type === "switcher") {
    startDrawingSwitcher(e);
  }
  // ================= END: [Касание "Переключатель"] =================
  // Модуль 7: Запретный цвет
  else if (currentExercise && currentExercise.type === "forbidden-color") {
    startDrawingForbiddenColor(e);
  } else {
    startDrawing(e);
  }
}

function handleCanvasClick(e) {
  e.preventDefault();

  if (exerciseCompleted) return;

  const pos = getPosition(e);

  // Модуль 1: Точечные упражнения
  if (currentExercise && currentExercise.type.startsWith("point-")) {
    checkPointPlacement(pos);
  }
  // Модуль 2 и 3: Дорожки
  else if (currentExercise && currentExercise.type.startsWith("path-")) {
    startDrawingPath(e);
  }
  // Модуль 4: Серийность движений (используют механизм дорожек)
  else if (
    currentExercise &&
    (currentExercise.type === "rhythmic-fence" ||
      currentExercise.type === "wave-cliff" ||
      currentExercise.type === "rhythmic-spiral" ||
      currentExercise.type === "meander-wall" ||
      currentExercise.type === "combined-chain")
  ) {
    startDrawingPath(e);
  }
  // Модуль 5: Зрительно-моторное соотнесение
  else if (currentExercise && currentExercise.type === "mirror-tree") {
    startDrawingMirrorTree(e);
  }
  // ✅ ДОБАВЛЕННЫЙ БЛОК ДЛЯ НАЙДИ И ПОВТОРИ
  else if (currentExercise && currentExercise.type === "gesture-shape") {
    startDrawingGesture(e);
  }
  //  Волнистая дорожка
  else if (currentExercise && currentExercise.type === "sine-corridor") {
    startDrawingSineCorridor(e);
  }
  // Модуль 7: Светофор
  else if (currentExercise && currentExercise.type === "traffic-light") {
    startDrawingTrafficLight(e);
  }
  // Модуль 7: Инверсия
  else if (currentExercise && currentExercise.type === "inversion") {
    startDrawingInversion(e);
  }
  // Модуль 7: Верный маршрут
  else if (currentExercise && currentExercise.type === "star-route") {
    startDrawingStarRoute(e);
  }

  // ================= START: [Касание "Переключатель"] =================
  else if (currentExercise && currentExercise.type === "switcher") {
    startDrawingSwitcher(e);
  }
  // ================= END: [Касание "Переключатель"] =================

  // Модуль 7: Запретный цвет
  else if (currentExercise && currentExercise.type === "forbidden-color") {
    startDrawingForbiddenColor(e);
  } else {
    startDrawing(e);
  }
}

// Проверка размещения точки
function checkPointPlacement(pos) {
  if (!targetZone) return;

  const distance = Math.sqrt(
    Math.pow(pos.x - targetZone.x, 2) + Math.pow(pos.y - targetZone.y, 2)
  );

  if (distance <= targetZone.radius) {
    // Успех!
    drawSuccessPoint(pos);
    showSuccessFeedback();
    exerciseCompleted = true;

    // Автоматически переходим к следующему через 1.5 секунды
    setTimeout(() => {
      nextExercise();
    }, 1500);
  } else {
    // Промах
    drawErrorPoint(pos);
    showErrorFeedback();

    // Убираем красную точку через 1 секунду
    setTimeout(() => {
      clearCanvas();
      drawExerciseTemplate(currentExercise);
    }, 1000);
  }
}

// Рисование успешной точки
function drawSuccessPoint(pos) {
  // Зеленая точка
  ctx.fillStyle = "#4caf50";
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
  ctx.fill();

  // Белый центр
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
  ctx.fill();

  // Анимация успеха - круги расходятся
  animateSuccess(pos);
}

// Рисование ошибочной точки
function drawErrorPoint(pos) {
  // Красная точка
  ctx.fillStyle = "#ff5252";
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
  ctx.fill();

  // Крестик
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(pos.x - 6, pos.y - 6);
  ctx.lineTo(pos.x + 6, pos.y + 6);
  ctx.moveTo(pos.x + 6, pos.y - 6);
  ctx.lineTo(pos.x - 6, pos.y + 6);
  ctx.stroke();
}

// Анимация успеха
function animateSuccess(pos) {
  let radius = 20;
  let opacity = 1;

  const animate = () => {
    if (opacity <= 0) return;

    // Сохраняем текущее состояние
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Рисуем расходящийся круг
    ctx.strokeStyle = `rgba(76, 175, 80, ${opacity})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    radius += 3;
    opacity -= 0.05;

    if (opacity > 0) {
      requestAnimationFrame(animate);
    }
  };

  animate();
}

// Показ обратной связи об успехе
function showSuccessFeedback() {
  const feedback = document.getElementById("feedback");
  feedback.textContent = "✓ Отлично! Точно в цель!";
  feedback.className = "feedback";
  feedback.classList.remove("hidden");
}

// Показ обратной связи об ошибке
function showErrorFeedback() {
  const feedback = document.getElementById("feedback");
  feedback.textContent = "↻ Попробуй еще раз, ближе к середине";
  feedback.className = "feedback error";
  feedback.classList.remove("hidden");

  setTimeout(() => {
    feedback.classList.add("hidden");
  }, 2000);
}

// Рисование
function startDrawing(e) {
  e.preventDefault();

  // Модуль 5: Узор по точкам
  if (currentExercise && currentExercise.type === "pattern-dots") {
    isDrawing = true;
    startDrawingPatternDots(e);
    return;
  }

  isDrawing = true;
  const pos = getPosition(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
  if (!isDrawing) return;
  e.preventDefault();

  const pos = getPosition(e);

  // Модуль 5: Зрительно-моторное соотнесение
  if (currentExercise && currentExercise.type === "mirror-tree") {
    drawMirrorTreeWithCheck(pos);
    return;
  }

  // Модуль 5: Узор по точкам
  if (currentExercise && currentExercise.type === "pattern-dots") {
    drawPatternDotsWithCheck(pos);
    return;
  }

  // Модуль: Распознавание фигур
  if (currentExercise && currentExercise.type === "gesture-shape") {
    drawGestureWithCheck(pos);
    return;
  }

  //  Обработка волнистой дорожки
  if (currentExercise && currentExercise.type === "sine-corridor") {
    drawSineCorridorWithCheck(pos);
    return;
  }

  // Модуль 7: Запретный цвет
  if (currentExercise && currentExercise.type === "forbidden-color") {
    drawForbiddenColorWithCheck(pos);
    return;
  }
  // === НОВОЕ: Волнистая дорожка ===
  else if (currentExercise && currentExercise.type === "sine-corridor") {
    drawSineCorridorWithCheck(pos);
    return;
  }
  // Модуль 2, 3 и 4: Проверка границ дорожки
  if (
    currentExercise &&
    (currentExercise.type.startsWith("path-") ||
      currentExercise.type === "rhythmic-fence" ||
      currentExercise.type === "wave-cliff" ||
      currentExercise.type === "rhythmic-spiral" ||
      currentExercise.type === "meander-wall" ||
      currentExercise.type === "combined-chain")
  ) {
    drawPathWithCheck(pos);
    return;
  }

  // Модуль 7: Инверсия
  else if (currentExercise && currentExercise.type === "inversion") {
    userPath.push(pos); // Записываем точку пути
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#4fc3f7";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.stroke();
    return;
  }

  // Для светофора — рисуем линию только если зелёный
  if (currentExercise && currentExercise.type === "traffic-light") {
    // Мгновенная проверка финиша при движении
    if (isDrawing && !exerciseCompleted) {
      const lastPos = userPath[userPath.length - 1];
      if (lastPos && lastPos.y <= 60) {
        completeTrafficLight();
        return;
      }
    }
    if (trafficLightState === "green") {
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#4fc3f7";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.stroke();
      userPath.push(pos);
    } else {
      checkTrafficLightViolation(pos);
    }
    return;
  }

  // Модуль 7: Верный маршрут
  if (currentExercise && currentExercise.type === "star-route") {
    drawStarRouteWithCheck(pos);
    return;
  }

  // ================= START: [Рисование "Переключатель"] =================
  if (currentExercise && currentExercise.type === "switcher") {
    drawSwitcherWithCheck(pos);
    return;
  }
  // ================= END: [Рисование "Переключатель"] =================

  // Обычное рисование для других модулей
  ctx.lineTo(pos.x, pos.y);
  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

function stopDrawing(e) {
  if (!isDrawing) return;
  e.preventDefault();
  isDrawing = false;
  ctx.closePath();

  // Модуль 5: Узор по точкам
  if (currentExercise && currentExercise.type === "pattern-dots") {
    stopDrawingPatternDots(e);
    return;
  }

  // Модуль 5: Найди и повтори
  if (currentExercise && currentExercise.type === "gesture-shape") {
    isDrawing = false;
    ctx.closePath();

    // ✅ ПРОВЕРКА ТОЛЬКО ПОСЛЕ ОТПУСКАНИЯ ПАЛЬЦА/МЫШИ
    if (userFilterPath.length >= 15) {
      checkGestureCompletion();
    } else {
      showFeedback(
        "⚠️ Фигура слишком короткая. Рисуйте одним движением!",
        "error"
      );
      setTimeout(() => {
        clearCanvas();
        drawExerciseTemplate(currentExercise);
        userFilterPath = [];
      }, 1500);
    }
    return;
  }

  // Модуль 7: Запретный цвет
  if (currentExercise && currentExercise.type === "forbidden-color") {
    isDrawing = false;
    ctx.closePath();
    return;
  }
  // Модуль 7: Верный маршрут
  if (currentExercise && currentExercise.type === "star-route") {
    checkStarRouteFinish();
    return;
  }

  // Модуль 2, 3 и 4: Проверка достижения финиша
  if (
    currentExercise &&
    (currentExercise.type.startsWith("path-") ||
      currentExercise.type === "rhythmic-fence" ||
      currentExercise.type === "wave-cliff" ||
      currentExercise.type === "rhythmic-spiral" ||
      currentExercise.type === "meander-wall" ||
      currentExercise.type === "combined-chain")
  ) {
    checkPathFinish();
  }

  // === ПРОВЕРКА ФИНИША ДЛЯ ВОЛНИСТОЙ ДОРОЖКИ ===
  if (currentExercise && currentExercise.type === "sine-corridor") {
    const lastPos = userPath[userPath.length - 1];
    if (lastPos && lastPos.y >= currentExercise.finishY) {
      completeSineCorridor();
    }
    return;
  }

  // Модуль 7: Инверсия — проверка при отпускании пальца
  if (currentExercise && currentExercise.type === "inversion") {
    checkInversionResult();
    return; // Прерываем выполнение, чтобы не сработала стандартная логика
  }
  // Модуль 7: Светофор — проверка финиша
  if (currentExercise && currentExercise.type === "traffic-light") {
    const lastPos = userPath[userPath.length - 1];
    if (lastPos && lastPos.y <= 60) {
      // Финиш вверху!
      completeTrafficLight();
    }
    return;
  }

  // Модуль 5: Активация сегментов происходит в реальном времени в drawMirrorTreeWithCheck()
  // Здесь больше ничего не нужно делать
}

/*
function getPosition(e) {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches ? e.touches[0] : e;
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  };
}
*/

function getPosition(e) {
  const rect = canvas.getBoundingClientRect();

  // Для touchend используем changedTouches, для touchmove/start — touches, для мыши — само событие
  const touch = e.changedTouches
    ? e.changedTouches[0]
    : e.touches
      ? e.touches[0]
      : e;

  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  };
}
// ============================================
// МОДУЛЬ 5: ЗРИТЕЛЬНО-МОТОРНОЕ СООТНЕСЕНИЕ
// ============================================

// Начало рисования зеркальной елочки
function startDrawingMirrorTree(e) {
  e.preventDefault();

  if (exerciseCompleted) return;

  const pos = getPosition(e);

  // Вычисляем центральную ось (x=0 в координатах сегментов)
  const gridCols = Math.floor(canvas.width / gridCellSize);
  const centerGridX = gridCols / 2;
  const centerPixelX = gridOffsetX + centerGridX * gridCellSize;

  // Проверяем, находимся ли мы в правой половине холста (целевая область)
  if (pos.x < centerPixelX) {
    return; // Рисование только справа
  }

  // Начинаем рисование
  isDrawing = true;
  userDrawnPoints = [pos]; // Сбрасываем для каждого нового штриха

  // Сбрасываем отслеживание контрольных точек для нового штриха
  segmentStartPoints = new Array(mirrorTreeTargets.length).fill(false);
  segmentEndPoints = new Array(mirrorTreeTargets.length).fill(false);

  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

// Рисование с проверкой попадания в целевые сегменты
function drawMirrorTreeWithCheck(pos) {
  if (!isDrawing) return;

  userDrawnPoints.push(pos);

  // Вычисляем центральную ось
  const gridCols = Math.floor(canvas.width / gridCellSize);
  const centerGridX = gridCols / 2;
  const centerPixelX = gridOffsetX + centerGridX * gridCellSize;

  // Проверяем, находимся ли мы в правой половине холста
  if (pos.x < centerPixelX) {
    showMirrorTreeError("Рисуй только справа!");
    isDrawing = false;
    ctx.closePath();
    return;
  }

  // Проверяем попадание в целевые сегменты
  let isOnSegment = false;

  for (let i = 0; i < mirrorTreeTargets.length; i++) {
    const seg = mirrorTreeTargets[i];

    // Пропускаем уже завершенные сегменты
    if (seg.isCompleted) continue;

    // Пропускаем сегменты, не принадлежащие текущему этапу
    if (seg.subTaskIndex !== currentSubTask) continue;

    // Преобразуем координаты сегмента в пиксели
    const x1 = centerPixelX + seg.x1 * gridCellSize;
    const y1 = gridOffsetY + seg.y1 * gridCellSize;
    const x2 = centerPixelX + seg.x2 * gridCellSize;
    const y2 = gridOffsetY + seg.y2 * gridCellSize;

    // Проверяем расстояние до линии сегмента
    const distance = distanceToSegment(pos, seg, centerPixelX);

    if (distance <= treePathTolerance) {
      isOnSegment = true;

      // Проверяем, прошли ли мы через начальную точку
      const distToStart = Math.sqrt(
        Math.pow(pos.x - x1, 2) + Math.pow(pos.y - y1, 2)
      );
      if (distToStart <= pointTolerance) {
        segmentStartPoints[i] = true;
      }

      // Проверяем, прошли ли мы через конечную точку
      const distToEnd = Math.sqrt(
        Math.pow(pos.x - x2, 2) + Math.pow(pos.y - y2, 2)
      );
      if (distToEnd <= pointTolerance) {
        segmentEndPoints[i] = true;
      }

      // Если прошли через обе точки - сегмент завершен
      if (segmentStartPoints[i] && segmentEndPoints[i]) {
        if (!seg.isCompleted) {
          seg.isCompleted = true;

          // Перерисовываем холст с новым активированным сегментом
          clearCanvas();
          drawMirrorTreeTemplate();

          // Проверяем, завершен ли текущий этап
          checkMirrorSubTaskCompletion();
        }
      }
    }
  }

  // Рисуем линию обратной связи
  if (isOnSegment) {
    ctx.strokeStyle = "#2196f3";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  } else {
    ctx.strokeStyle = "#ff5252";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}

function checkMirrorSubTaskCompletion() {
  // Проверяем, выполнены ли все сегменты текущего этапа
  const currentSubTaskSegments = mirrorTreeTargets.filter(
    (seg) => seg.subTaskIndex === currentSubTask
  );
  const allSubTaskCompleted = currentSubTaskSegments.every(
    (seg) => seg.isCompleted
  );

  if (allSubTaskCompleted) {
    // Увеличиваем номер текущего этапа
    currentSubTask++;

    // Если это не последний этап - показываем промежуточную похвалу
    if (currentSubTask < totalSubTasks) {
      showMirrorFeedback("Молодец, продолжай!");
    } else {
      // Если это был последний этап - завершаем упражнение
      completeMirrorTree();
    }
  }
}

// Вычисление расстояния от точки до сегмента
function distanceToSegment(point, segment, centerPixelX) {
  // Преобразуем координаты сегмента в пиксели
  // centerPixelX - позиция зеленой оси (x=0 в координатах сегментов)
  const x1 = centerPixelX + segment.x1 * gridCellSize;
  const y1 = gridOffsetY + segment.y1 * gridCellSize;
  const x2 = centerPixelX + segment.x2 * gridCellSize;
  const y2 = gridOffsetY + segment.y2 * gridCellSize;

  // Вычисляем расстояние от точки до линии
  const A = point.x - x1;
  const B = point.y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

// Проверка завершения сегментов
function checkMirrorTreeCompletion() {
  // Эта функция больше не используется, так как активация сегментов
  // происходит в реальном времени в drawMirrorTreeWithCheck()
  // Оставляем для совместимости, но логика перенесена в drawMirrorTreeWithCheck()
}

// Показ ошибки
function showMirrorTreeError(message) {
  const feedback = document.getElementById("feedback");
  feedback.textContent = "❌ " + message;
  feedback.className = "feedback error";
  feedback.classList.remove("hidden");

  vibrateDevice();

  setTimeout(() => {
    feedback.classList.add("hidden");
  }, 1500);
}

// Показ промежуточной похвалы
function showMirrorFeedback(message) {
  const feedback = document.getElementById("feedback");
  feedback.textContent = message;
  feedback.className = "feedback success";
  feedback.classList.remove("hidden");

  setTimeout(() => {
    feedback.classList.add("hidden");
  }, 1500);
}

// Завершение упражнения
function completeMirrorTree() {
  exerciseCompleted = true;
  isDrawing = false;

  const feedback = document.getElementById("feedback");
  feedback.textContent = "🎉 Ты нарисовал красивую елочку!";
  feedback.className = "feedback";
  feedback.classList.remove("hidden");

  // Показываем кнопку "Дальше"
  document.getElementById("next-level-btn").classList.remove("hidden");

  setTimeout(() => {
    nextExercise();
  }, 2000);
}

// Вибрация устройства
function vibrateDevice() {
  if ("vibrate" in navigator) {
    navigator.vibrate(50);
  }
}

// ============================================
// МОДУЛЬ 2: ДОРОЖКИ И ТРАЕКТОРИИ
// ============================================

// Начало рисования по дорожке
function startDrawingPath(e) {
  e.preventDefault();

  if (exerciseCompleted) return;

  const pos = getPosition(e);

  // Для упражнений с несколькими линиями - проверяем близость к любой стартовой точке
  if (totalSubTasks > 0) {
    let nearStart = false;

    if (currentExercise.type === "path-lines") {
      // Прямые линии - используем те же относительные координаты, что и в drawPathLines
      const linePositions = [0.15, 0.3, 0.45, 0.6, 0.85];
      const startY = canvas.height * 0.35;

      for (let i = 0; i < totalSubTasks; i++) {
        if (!completedSubTasks.includes(i)) {
          const lineX = canvas.width * linePositions[i];
          const distance = Math.sqrt(
            Math.pow(pos.x - lineX, 2) + Math.pow(pos.y - startY, 2)
          );

          if (distance <= 30) {
            nearStart = true;
            break;
          }
        }
      }
    } else if (currentExercise.type === "path-diagonal") {
      // Наклонные линии - используем те же относительные координаты, что и в drawPathDiagonal
      const linePositions = [0.2, 0.4, 0.6, 0.8];
      const topY = canvas.height * 0.4;
      const bottomY = canvas.height * 0.55;

      // Проверяем 4 линии сверху
      for (let i = 0; i < 4; i++) {
        if (!completedSubTasks.includes(i)) {
          const x1 = canvas.width * linePositions[i];
          const distance = Math.sqrt(
            Math.pow(pos.x - x1, 2) + Math.pow(pos.y - topY, 2)
          );

          if (distance <= 30) {
            nearStart = true;
            break;
          }
        }
      }

      // Проверяем 4 линии снизу
      if (!nearStart) {
        for (let i = 0; i < 4; i++) {
          if (!completedSubTasks.includes(i + 4)) {
            const x1 = canvas.width * linePositions[i];
            const distance = Math.sqrt(
              Math.pow(pos.x - x1, 2) + Math.pow(pos.y - bottomY, 2)
            );

            if (distance <= 30) {
              nearStart = true;
              break;
            }
          }
        }
      }
    } else if (currentExercise.type === "path-circles") {
      // Круги - 6 кругов (3 слева в столбик, 3 справа в столбик)
      const radius = Math.min(28, canvas.width * 0.055);
      const leftX = canvas.width * 0.28;
      const rightX = canvas.width * 0.72;
      const topY = canvas.height * 0.25;
      const middleY = canvas.height * 0.5;
      const bottomY = canvas.height * 0.75;

      const circlePositions = [
        { x: leftX, y: topY }, // 0: левый верхний
        { x: leftX, y: middleY }, // 1: левый средний
        { x: leftX, y: bottomY }, // 2: левый нижний
        { x: rightX, y: topY }, // 3: правый верхний
        { x: rightX, y: middleY }, // 4: правый средний
        { x: rightX, y: bottomY } // 5: правый нижний
      ];

      for (let i = 0; i < totalSubTasks; i++) {
        if (!completedSubTasks.includes(i)) {
          const cx = circlePositions[i].x;
          const cy = circlePositions[i].y;
          const distance = Math.sqrt(
            Math.pow(pos.x - cx, 2) + Math.pow(pos.y - (cy - radius), 2)
          );

          if (distance <= 30) {
            nearStart = true;
            break;
          }
        }
      }
    } else if (currentExercise.type === "path-arcs") {
      // Дуги - 5 дуг по центру, смотрящих вниз
      const radius = Math.min(32, canvas.width * 0.065);
      const centerX = canvas.width * 0.5;
      const topY1 = canvas.height * 0.18;
      const topY2 = canvas.height * 0.33;
      const topY3 = canvas.height * 0.5;
      const topY4 = canvas.height * 0.67;
      const topY5 = canvas.height * 0.82;

      // Проверяем 5 дуг (стартовая точка слева)
      const yPositions = [topY1, topY2, topY3, topY4, topY5];
      for (let i = 0; i < 5; i++) {
        if (!completedSubTasks.includes(i)) {
          const cy = yPositions[i];
          const startX_point = centerX - radius; // Слева
          const startY_point = cy;
          const distance = Math.sqrt(
            Math.pow(pos.x - startX_point, 2) +
              Math.pow(pos.y - startY_point, 2)
          );

          if (distance <= 30) {
            nearStart = true;
            break;
          }
        }
      }
    } else if (currentExercise.type === "path-loops") {
      // Пружинка - 3 волнистые линии в столбик
      const waveWidth = Math.min(200, canvas.width * 0.6);
      const startX = (canvas.width - waveWidth) / 2;
      const topY = canvas.height * 0.25;
      const middleY = canvas.height * 0.5;
      const bottomY = canvas.height * 0.75;
      const yPositions = [topY, middleY, bottomY];

      for (let i = 0; i < totalSubTasks; i++) {
        if (!completedSubTasks.includes(i)) {
          const centerY = yPositions[i];
          const distance = Math.sqrt(
            Math.pow(pos.x - startX, 2) + Math.pow(pos.y - centerY, 2)
          );

          if (distance <= 40) {
            // Увеличенная зона старта для мобильных
            nearStart = true;
            break;
          }
        }
      }
    }

    if (!nearStart) {
      return; // Не начинаем рисование, если далеко от стартовых точек
    }
  } else {
    // Для обычных упражнений - проверяем близость к единственной стартовой точке
    if (pathPoints.length > 0) {
      const startPoint = pathPoints[0];
      const distanceToStart = Math.sqrt(
        Math.pow(pos.x - startPoint.x, 2) + Math.pow(pos.y - startPoint.y, 2)
      );

      if (distanceToStart > 30) {
        return;
      }
    }
  }

  // Полное обнуление переменных состояния для чистой попытки
  // НО НЕ ТРОГАЕМ pathPoints - это шаблон траектории!
  isDrawing = true;
  userPath = [];
  exitCount = 0;
  isOutOfBounds = false;

  userPath.push(pos);

  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

// Рисование с проверкой границ
function drawPathWithCheck(pos) {
  userPath.push(pos);

  // Проверяем расстояние до центральной линии
  const distanceToPath = getDistanceToPath(pos);

  // Отладка: если pathPoints пустой, что-то не так
  if (pathPoints.length === 0) {
    console.error("pathPoints is empty! Cannot check boundaries.");
    return;
  }

  // Отладка для Модуля 4
  if (
    currentExercise &&
    (currentExercise.type === "rhythmic-fence" ||
      currentExercise.type === "wave-cliff" ||
      currentExercise.type === "rhythmic-spiral" ||
      currentExercise.type === "meander-wall" ||
      currentExercise.type === "combined-chain")
  ) {
    console.log("Module 4 check:", {
      exerciseType: currentExercise.type,
      distanceToPath: distanceToPath.toFixed(2),
      pathPointsCount: pathPoints.length,
      userPathCount: userPath.length
    });
  }

  // Проверка выхода за границы - увеличенная зона допуска для мобильных устройств
  let boundaryTolerance = 20; // По умолчанию

  // Для упражнения "Пружинка" делаем более мягкие границы
  if (currentExercise && currentExercise.type === "path-loops") {
    boundaryTolerance = 30; // Увеличенная зона допуска для волнистых линий
  }

  // Для упражнения "Спираль" (улитка) делаем еще более мягкие границы
  if (currentExercise && currentExercise.type === "path-spiral") {
    boundaryTolerance = 30; // Увеличенная зона допуска для спирали
  }

  // Для упражнений Модуля 4 (серийность движений) делаем разные границы
  if (
    currentExercise &&
    (currentExercise.type === "rhythmic-fence" ||
      currentExercise.type === "wave-cliff")
  ) {
    boundaryTolerance = 25; // Увеличенная зона допуска для сложных траекторий
  }

  // Для ритмической спирали - самая строгая проверка (самый сложный уровень)
  if (currentExercise && currentExercise.type === "rhythmic-spiral") {
    boundaryTolerance = 20; // Строгая зона допуска для спирали
  }

  // Для меандра (зубчатой стены) - строгая проверка углов
  if (currentExercise && currentExercise.type === "meander-wall") {
    boundaryTolerance = 22; // Строгая зона для прямых углов
  }

  // Для комбинированной цепи - самая строгая проверка (финальный уровень)
  if (currentExercise && currentExercise.type === "combined-chain") {
    boundaryTolerance = 25; // Одинаковая зона по всей длине
  }

  if (distanceToPath > boundaryTolerance) {
    // Вышли за границы - немедленно прерываем рисование
    if (!isOutOfBounds) {
      isOutOfBounds = true;
      exitCount++;
      vibrateDevice(); // Вибрация при выходе

      // Показываем ошибку
      const feedback = document.getElementById("feedback");
      feedback.textContent = "⚠️ Вышел за границы! Попробуй снова";
      feedback.className = "feedback error";
      feedback.classList.remove("hidden");

      // Рисуем красную линию в месте выхода
      ctx.strokeStyle = "#ff5252";
      ctx.lineTo(pos.x, pos.y);
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // Немедленно прерываем рисование
      isDrawing = false;
      ctx.closePath();

      // Через 1 секунду очищаем и заставляем проходить уровень заново
      setTimeout(() => {
        clearCanvas();
        drawExerciseTemplate(currentExercise);
        feedback.classList.add("hidden");
        // Полное обнуление состояния для новой попытки
        userPath = [];
        exitCount = 0;
        isOutOfBounds = false;
      }, 1000);
    }
    return;
  }

  // В пределах границ - рисуем зеленым
  ctx.strokeStyle = "#4caf50"; // Зеленый цвет

  ctx.lineTo(pos.x, pos.y);
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  // Проверяем достижение финиша в реальном времени
  if (totalSubTasks > 0) {
    // Для упражнений с несколькими линиями - проверяем все финишные зоны
    if (currentExercise.type === "path-lines") {
      // Прямые линии - используем те же относительные координаты, что и в drawPathLines
      const linePositions = [0.15, 0.3, 0.45, 0.6, 0.85];
      const lineLength = canvas.height * 0.3;
      const startY = canvas.height * 0.35;

      for (let i = 0; i < totalSubTasks; i++) {
        if (!completedSubTasks.includes(i)) {
          const lineX = canvas.width * linePositions[i];
          const finishY = startY + lineLength;
          const distanceToFinish = Math.sqrt(
            Math.pow(pos.x - lineX, 2) + Math.pow(pos.y - finishY, 2)
          );

          if (distanceToFinish <= 30) {
            completePathExercise();
            return;
          }
        }
      }
    } else if (currentExercise.type === "path-diagonal") {
      // Наклонные линии - используем те же относительные координаты, что и в drawPathDiagonal
      const linePositions = [0.2, 0.4, 0.6, 0.8];
      const lineLength = canvas.height * 0.1;
      const topY = canvas.height * 0.4;
      const bottomY = canvas.height * 0.55;
      const diagonalOffset = canvas.width * 0.05;

      // Проверяем 4 линии сверху (наклон вправо)
      for (let i = 0; i < 4; i++) {
        if (!completedSubTasks.includes(i)) {
          const x1 = canvas.width * linePositions[i];
          const x2 = x1 + diagonalOffset;
          const y2 = topY + lineLength;
          const distanceToFinish = Math.sqrt(
            Math.pow(pos.x - x2, 2) + Math.pow(pos.y - y2, 2)
          );

          if (distanceToFinish <= 30) {
            completePathExercise();
            return;
          }
        }
      }

      // Проверяем 4 линии снизу (наклон влево)
      for (let i = 0; i < 4; i++) {
        if (!completedSubTasks.includes(i + 4)) {
          const x1 = canvas.width * linePositions[i];
          const x2 = x1 - diagonalOffset;
          const y2 = bottomY + lineLength;
          const distanceToFinish = Math.sqrt(
            Math.pow(pos.x - x2, 2) + Math.pow(pos.y - y2, 2)
          );

          if (distanceToFinish <= 30) {
            completePathExercise();
            return;
          }
        }
      }
    } else if (currentExercise.type === "path-circles") {
      // Круги - проверяем возврат к стартовой точке (полный круг)
      const radius = Math.min(28, canvas.width * 0.055);
      const leftX = canvas.width * 0.28;
      const rightX = canvas.width * 0.72;
      const topY = canvas.height * 0.25;
      const middleY = canvas.height * 0.5;
      const bottomY = canvas.height * 0.75;

      const circlePositions = [
        { x: leftX, y: topY }, // 0: левый верхний
        { x: leftX, y: middleY }, // 1: левый средний
        { x: leftX, y: bottomY }, // 2: левый нижний
        { x: rightX, y: topY }, // 3: правый верхний
        { x: rightX, y: middleY }, // 4: правый средний
        { x: rightX, y: bottomY } // 5: правый нижний
      ];

      for (let i = 0; i < totalSubTasks; i++) {
        if (!completedSubTasks.includes(i)) {
          const cx = circlePositions[i].x;
          const cy = circlePositions[i].y;
          const startY = cy - radius;

          // Проверяем, вернулся ли пользователь к стартовой точке
          const distanceToStart = Math.sqrt(
            Math.pow(pos.x - cx, 2) + Math.pow(pos.y - startY, 2)
          );

          // Также проверяем, что пользователь прошел достаточно пути (хотя бы половину круга)
          if (distanceToStart <= 30 && userPath.length > 50) {
            completePathExercise();
            return;
          }
        }
      }
    } else if (currentExercise.type === "path-arcs") {
      // Дуги - 5 дуг по центру, смотрящих вниз
      const radius = Math.min(32, canvas.width * 0.065);
      const centerX = canvas.width * 0.5;
      const topY1 = canvas.height * 0.18;
      const topY2 = canvas.height * 0.33;
      const topY3 = canvas.height * 0.5;
      const topY4 = canvas.height * 0.67;
      const topY5 = canvas.height * 0.82;

      // Проверяем 5 дуг (финиш справа)
      const yPositions = [topY1, topY2, topY3, topY4, topY5];
      for (let i = 0; i < 5; i++) {
        if (!completedSubTasks.includes(i)) {
          const cy = yPositions[i];
          const endX_point = centerX + radius; // Справа
          const endY_point = cy;
          const distanceToFinish = Math.sqrt(
            Math.pow(pos.x - endX_point, 2) + Math.pow(pos.y - endY_point, 2)
          );

          if (distanceToFinish <= 30) {
            completePathExercise();
            return;
          }
        }
      }
    } else if (currentExercise.type === "path-loops") {
      // Пружинка - 3 волнистые линии в столбик
      const waveWidth = Math.min(200, canvas.width * 0.6);
      const waveHeight = Math.min(40, canvas.height * 0.08);
      const wavesPerLine = 2.5;
      const startX = (canvas.width - waveWidth) / 2;
      const topY = canvas.height * 0.25;
      const middleY = canvas.height * 0.5;
      const bottomY = canvas.height * 0.75;
      const yPositions = [topY, middleY, bottomY];

      for (let i = 0; i < totalSubTasks; i++) {
        if (!completedSubTasks.includes(i)) {
          const centerY = yPositions[i];
          const waveEndX = startX + waveWidth;

          // Финишная точка (справа)
          const finalAngle = wavesPerLine * Math.PI * 2;
          const endY = centerY + (Math.sin(finalAngle) * waveHeight) / 2;

          const distanceToFinish = Math.sqrt(
            Math.pow(pos.x - waveEndX, 2) + Math.pow(pos.y - endY, 2)
          );

          if (distanceToFinish <= 40) {
            // Увеличенная зона финиша для мобильных
            completePathExercise();
            return;
          }
        }
      }
    }
  } else if (finishZone) {
    // Для обычных упражнений - проверяем единственную финишную зону
    const distanceToFinish = Math.sqrt(
      Math.pow(pos.x - finishZone.x, 2) + Math.pow(pos.y - finishZone.y, 2)
    );

    if (distanceToFinish <= finishZone.radius) {
      completePathExercise();
    }
  }
}

// Вычисление расстояния от точки до ближайшей точки траектории
function getDistanceToPath(point) {
  if (pathPoints.length === 0) return 0;

  let minDistance = Infinity;

  for (let i = 0; i < pathPoints.length; i++) {
    const pathPoint = pathPoints[i];
    const distance = Math.sqrt(
      Math.pow(point.x - pathPoint.x, 2) + Math.pow(point.y - pathPoint.y, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
}

// Проверка достижения финиша
function checkPathFinish() {
  if (exerciseCompleted || !finishZone || userPath.length === 0) return;

  const lastPoint = userPath[userPath.length - 1];
  const distanceToFinish = Math.sqrt(
    Math.pow(lastPoint.x - finishZone.x, 2) +
      Math.pow(lastPoint.y - finishZone.y, 2)
  );

  if (distanceToFinish <= finishZone.radius) {
    completePathExercise();
  }
}
// Завершение упражнения с дорожкой
function completePathExercise() {
  if (exerciseCompleted) return;

  // ПРОВЕРКА ПРОХОЖДЕНИЯ: для спирали разрешаем несколько ошибок, для остальных - строго
  let allowedErrors = 0; // По умолчанию строгая проверка

  // Для упражнения "Спираль" (улитка) разрешаем до 3 выходов за границы
  if (currentExercise && currentExercise.type === "path-spiral") {
    allowedErrors = 3;
  }

  // Для Модуля 4 - строгая проверка (0 ошибок), как в Модуле 2
  // (не добавляем allowedErrors для rhythmic-fence, wave-cliff, rhythmic-spiral и meander-wall)

  if (exitCount <= allowedErrors) {
    // Для упражнений с несколькими линиями - определяем, какую линию завершили
    if (totalSubTasks > 0) {
      // Определяем, на какой линии пользователь закончил
      const lastPoint = userPath[userPath.length - 1];
      let completedLine = -1;
      let minDistance = Infinity;

      if (currentExercise.type === "path-lines") {
        // Прямые линии - используем те же относительные координаты, что и в drawPathLines
        const linePositions = [0.15, 0.3, 0.45, 0.6, 0.85];
        const lineLength = canvas.height * 0.3;
        const startY = canvas.height * 0.35;

        for (let i = 0; i < totalSubTasks; i++) {
          if (!completedSubTasks.includes(i)) {
            const lineX = canvas.width * linePositions[i];
            const finishY = startY + lineLength;
            const distance = Math.sqrt(
              Math.pow(lastPoint.x - lineX, 2) +
                Math.pow(lastPoint.y - finishY, 2)
            );

            if (distance < minDistance && distance <= 30) {
              minDistance = distance;
              completedLine = i;
            }
          }
        }
      } else if (currentExercise.type === "path-diagonal") {
        // Наклонные линии - используем те же относительные координаты, что и в drawPathDiagonal
        const linePositions = [0.2, 0.4, 0.6, 0.8];
        const lineLength = canvas.height * 0.1;
        const topY = canvas.height * 0.4;
        const bottomY = canvas.height * 0.55;
        const diagonalOffset = canvas.width * 0.05;

        // Проверяем 4 линии сверху (наклон вправо)
        for (let i = 0; i < 4; i++) {
          if (!completedSubTasks.includes(i)) {
            const x2 = canvas.width * linePositions[i] + diagonalOffset;
            const y2 = topY + lineLength;
            const distance = Math.sqrt(
              Math.pow(lastPoint.x - x2, 2) + Math.pow(lastPoint.y - y2, 2)
            );

            if (distance < minDistance && distance <= 30) {
              minDistance = distance;
              completedLine = i;
            }
          }
        }

        // Проверяем 4 линии снизу (наклон влево)
        for (let i = 0; i < 4; i++) {
          if (!completedSubTasks.includes(i + 4)) {
            const x2 = canvas.width * linePositions[i] - diagonalOffset;
            const y2 = bottomY + lineLength;
            const distance = Math.sqrt(
              Math.pow(lastPoint.x - x2, 2) + Math.pow(lastPoint.y - y2, 2)
            );

            if (distance < minDistance && distance <= 30) {
              minDistance = distance;
              completedLine = i + 4;
            }
          }
        }
      } else if (currentExercise.type === "path-circles") {
        // Круги
        const radius = Math.min(28, canvas.width * 0.055);
        const leftX = canvas.width * 0.28;
        const rightX = canvas.width * 0.72;
        const topY = canvas.height * 0.25;
        const middleY = canvas.height * 0.5;
        const bottomY = canvas.height * 0.75;

        const circlePositions = [
          { x: leftX, y: topY }, // 0: левый верхний
          { x: leftX, y: middleY }, // 1: левый средний
          { x: leftX, y: bottomY }, // 2: левый нижний
          { x: rightX, y: topY }, // 3: правый верхний
          { x: rightX, y: middleY }, // 4: правый средний
          { x: rightX, y: bottomY } // 5: правый нижний
        ];

        for (let i = 0; i < totalSubTasks; i++) {
          if (!completedSubTasks.includes(i)) {
            const cx = circlePositions[i].x;
            const cy = circlePositions[i].y;
            const startY = cy - radius;
            const distance = Math.sqrt(
              Math.pow(lastPoint.x - cx, 2) + Math.pow(lastPoint.y - startY, 2)
            );

            if (distance < minDistance && distance <= 30) {
              minDistance = distance;
              completedLine = i;
            }
          }
        }
      } else if (currentExercise.type === "path-arcs") {
        // Дуги - 5 дуг по центру, смотрящих вниз
        const radius = Math.min(32, canvas.width * 0.065);
        const centerX = canvas.width * 0.5;
        const topY1 = canvas.height * 0.18;
        const topY2 = canvas.height * 0.33;
        const topY3 = canvas.height * 0.5;
        const topY4 = canvas.height * 0.67;
        const topY5 = canvas.height * 0.82;

        // Проверяем 5 дуг (финиш справа)
        const yPositions = [topY1, topY2, topY3, topY4, topY5];
        for (let i = 0; i < 5; i++) {
          if (!completedSubTasks.includes(i)) {
            const cy = yPositions[i];
            const endX_point = centerX + radius;
            const endY_point = cy;
            const distance = Math.sqrt(
              Math.pow(lastPoint.x - endX_point, 2) +
                Math.pow(lastPoint.y - endY_point, 2)
            );

            if (distance < minDistance && distance <= 30) {
              minDistance = distance;
              completedLine = i;
            }
          }
        }
      } else if (currentExercise.type === "path-loops") {
        // Пружинка - 3 волнистые линии в столбик
        const waveWidth = Math.min(200, canvas.width * 0.6);
        const waveHeight = Math.min(40, canvas.height * 0.08);
        const wavesPerLine = 2.5;
        const startX = (canvas.width - waveWidth) / 2;
        const topY = canvas.height * 0.25;
        const middleY = canvas.height * 0.5;
        const bottomY = canvas.height * 0.75;
        const yPositions = [topY, middleY, bottomY];

        for (let i = 0; i < totalSubTasks; i++) {
          if (!completedSubTasks.includes(i)) {
            const centerY = yPositions[i];
            const waveEndX = startX + waveWidth;

            // Финишная точка (справа)
            const finalAngle = wavesPerLine * Math.PI * 2;
            const endY = centerY + (Math.sin(finalAngle) * waveHeight) / 2;

            const distance = Math.sqrt(
              Math.pow(lastPoint.x - waveEndX, 2) +
                Math.pow(lastPoint.y - endY, 2)
            );

            if (distance < minDistance && distance <= 40) {
              // Увеличенная зона для мобильных
              minDistance = distance;
              completedLine = i;
            }
          }
        }
      }

      if (completedLine !== -1) {
        // Отмечаем линию как завершенную
        completedSubTasks.push(completedLine);

        const feedback = document.getElementById("feedback");

        // Проверяем, все ли линии завершены
        if (completedSubTasks.length >= totalSubTasks) {
          // Все линии завершены - переход к следующему упражнению
          exerciseCompleted = true;
          isDrawing = false;

          feedback.textContent = `🎉 Идеально! Все ${totalSubTasks} линии выполнены!`;
          feedback.className = "feedback";
          feedback.classList.remove("hidden");

          // Автоматический переход к следующему упражнению
          setTimeout(() => {
            nextExercise();
          }, 1500);
        } else {
          // Еще есть незавершенные линии
          feedback.textContent = `✓ Отлично! Линия ${completedSubTasks.length} из ${totalSubTasks}. Проведи остальные!`;
          feedback.className = "feedback";
          feedback.classList.remove("hidden");

          // Через 1 секунду перерисовываем
          setTimeout(() => {
            clearCanvas();
            drawExerciseTemplate(currentExercise);
            feedback.classList.add("hidden");
            // Обнуляем состояние для новой линии
            userPath = [];
            exitCount = 0;
            isOutOfBounds = false;
          }, 1000);
        }
      }
    } else {
      // Обычное упражнение без подзадач
      exerciseCompleted = true;
      isDrawing = false;

      drawFinishMark();

      const feedback = document.getElementById("feedback");

      // Специальное сообщение для спирали с учетом допустимых ошибок
      if (currentExercise && currentExercise.type === "path-spiral") {
        if (exitCount === 0) {
          feedback.textContent = "🎉 Идеально! Переход к следующему уровню!";
        } else {
          feedback.textContent = `✅ Отлично! ${exitCount} касаний границ (до 3 разрешено)`;
        }
      } else {
        feedback.textContent = "🎉 Идеально! Переход к следующему уровню!";
      }

      feedback.className = "feedback";
      feedback.classList.remove("hidden");

      setTimeout(() => {
        nextExercise();
      }, 1500);
    }
  } else {
    // Если были ошибки - не засчитываем, заставляем пройти заново
    isDrawing = false;

    const feedback = document.getElementById("feedback");

    // Специальное сообщение об ошибке для спирали
    if (currentExercise && currentExercise.type === "path-spiral") {
      feedback.textContent = `⚠️ Слишком много касаний границ (${exitCount}/3). Попробуй аккуратнее!`;
    } else {
      feedback.textContent = "⚠️ Были выходы за границы. Попробуй еще раз!";
    }

    feedback.className = "feedback error";
    feedback.classList.remove("hidden");

    // Через 1.5 секунды очищаем и даем пройти уровень заново
    setTimeout(() => {
      clearCanvas();
      drawExerciseTemplate(currentExercise);
      feedback.classList.add("hidden");
      // Полное обнуление состояния
      userPath = [];
      exitCount = 0;
      isOutOfBounds = false;
    }, 1500);
  }
}

// Рисование финишной отметки
function drawFinishMark() {
  if (!finishZone) return;

  // Зеленый круг
  ctx.fillStyle = "#4caf50";
  ctx.beginPath();
  ctx.arc(finishZone.x, finishZone.y, 20, 0, Math.PI * 2);
  ctx.fill();

  // Белая галочка
  ctx.strokeStyle = "white";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(finishZone.x - 8, finishZone.y);
  ctx.lineTo(finishZone.x - 2, finishZone.y + 6);
  ctx.lineTo(finishZone.x + 8, finishZone.y - 6);
  ctx.stroke();
}

// Вибрация устройства
function vibrateDevice() {
  if ("vibrate" in navigator) {
    navigator.vibrate(50); // 50ms вибрация
  }
}
// Шаблоны упражнений
function drawExerciseTemplate(exercise) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  switch (exercise.type) {
    // Модуль 1: Точечные упражнения
    case "point-center":
      drawCenterTarget();
      break;
    case "point-top":
      drawTopTarget();
      break;
    case "point-bottom":
      drawBottomTarget();
      break;
    case "point-left":
      drawLeftTarget();
      break;
    case "point-right":
      drawRightTarget();
      break;

    // Модуль 2: Дорожки
    case "path-straight":
      drawStraightPath();
      break;
    case "path-vertical":
      drawVerticalPath();
      break;
    case "path-zigzag":
      drawZigzagPath();
      break;
    case "path-wave":
      drawWavePath();
      break;
    case "path-spiral":
      drawSpiralPath();
      break;

    // Модуль 3: Базовые элементы
    case "path-lines":
      drawPathLines();
      break;
    case "path-diagonal":
      drawPathDiagonal();
      break;
    case "path-circles":
      drawPathCircles();
      break;
    case "path-arcs":
      drawPathArcs();
      break;
    case "path-loops":
      drawPathLoops();
      break;
    // найди и повтори
    case "gesture-shape":
      drawGestureShapeTemplate();
      break;
    // Модуль 4: Серийность движений
    case "rhythmic-fence":
      drawRhythmicFence();
      break;
    case "wave-cliff":
      drawWaveCliff();
      break;
    case "rhythmic-spiral":
      drawRhythmicSpiral();
      break;
    case "meander-wall":
      drawMeanderWall();
      break;
    case "combined-chain":
      drawCombinedChain();
      break;

    // Модуль 5: Зрительно-моторное соотнесение
    case "mirror-tree":
      drawMirrorTreeTemplate();
      break;
    case "pattern-dots":
      drawPatternDots();
      break;

    // Модуль 6: Графические диктанты
    case "grid-square":
    case "grid-mountain":
    case "grid-snake":
    case "grid-heart":
    case "grid-triangle":
      drawGridTemplate();
      break;

    case "sine-corridor":
      drawSineCorridorTemplate();
      break;

    // Модуль 7: Светофор
    case "traffic-light":
      drawTrafficLightTemplate();
      break;
    // Модуль 7: Запретный цвет
    case "forbidden-color":
      drawForbiddenColorTemplate();
      break;
    // Модуль 7: Инверсия
    case "inversion":
      drawInversionTemplate();
      break;
    // Модуль 7 Верный маршрут
    case "star-route":
      drawStarRouteTemplate();
      break;
    // ================= START: [Case Переключателя] =================
    case "switcher":
      drawSwitcherTemplate();
      break;
    // ================= END: [Case Переключателя] =================

    // Другие модули
    case "line":
      drawLineGuide();
      break;
    case "path":
      drawPath();
      break;
    case "wave":
      drawWaveGuide();
      break;
    case "lines":
      drawLinesTemplate();
      break;
    case "ovals":
      drawOvalsTemplate();
      break;
    case "pattern":
      drawPatternTemplate();
      break;
    case "copy":
      drawCopyTemplate();
      break;
    case "grid":
      drawGrid();
      break;
    default:
      drawDefaultTemplate();
  }
}

function drawCenterTarget() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Устанавливаем целевую зону
  targetZone = { x: cx, y: cy, radius: 50 };

  // Рисуем концентрические круги
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 2;

  // Внешний круг
  ctx.beginPath();
  ctx.arc(cx, cy, 50, 0, Math.PI * 2);
  ctx.stroke();

  // Средний круг
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.stroke();

  // Внутренний круг
  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 15, 0, Math.PI * 2);
  ctx.stroke();

  // Центральная точка
  ctx.fillStyle = "#667eea";
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawTopTarget() {
  const cx = canvas.width / 2;
  const cy = canvas.height * 0.25; // Поднимаем выше - 25% от верха

  targetZone = { x: cx, y: cy, radius: 50 };

  // Стрелка вверх
  ctx.strokeStyle = "#667eea";
  ctx.fillStyle = "#667eea";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(cx, cy + 60);
  ctx.lineTo(cx, cy + 20);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy + 20);
  ctx.lineTo(cx - 15, cy + 35);
  ctx.lineTo(cx + 15, cy + 35);
  ctx.closePath();
  ctx.fill();

  // Целевой круг
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 50, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 15, 0, Math.PI * 2);
  ctx.stroke();
}

function drawBottomTarget() {
  const cx = canvas.width / 2;
  const cy = canvas.height * 0.75; // Опускаем ниже - 75% от верха

  targetZone = { x: cx, y: cy, radius: 50 };

  // Стрелка вниз
  ctx.strokeStyle = "#667eea";
  ctx.fillStyle = "#667eea";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(cx, cy - 60);
  ctx.lineTo(cx, cy - 20);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy - 20);
  ctx.lineTo(cx - 15, cy - 35);
  ctx.lineTo(cx + 15, cy - 35);
  ctx.closePath();
  ctx.fill();

  // Целевой круг
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 50, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 15, 0, Math.PI * 2);
  ctx.stroke();
}

function drawLeftTarget() {
  const cx = canvas.width * 0.25; // Сдвигаем ближе к краю - 25% от левого края
  const cy = canvas.height / 2;

  targetZone = { x: cx, y: cy, radius: 50 };

  // Стрелка влево
  ctx.strokeStyle = "#667eea";
  ctx.fillStyle = "#667eea";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(cx + 60, cy);
  ctx.lineTo(cx + 20, cy);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + 20, cy);
  ctx.lineTo(cx + 35, cy - 15);
  ctx.lineTo(cx + 35, cy + 15);
  ctx.closePath();
  ctx.fill();

  // Целевой круг
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 50, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 15, 0, Math.PI * 2);
  ctx.stroke();
}

function drawRightTarget() {
  const cx = canvas.width * 0.75; // Сдвигаем ближе к краю - 75% от левого края
  const cy = canvas.height / 2;

  targetZone = { x: cx, y: cy, radius: 50 };

  // Стрелка вправо
  ctx.strokeStyle = "#667eea";
  ctx.fillStyle = "#667eea";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(cx - 60, cy);
  ctx.lineTo(cx - 20, cy);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 20, cy);
  ctx.lineTo(cx - 35, cy - 15);
  ctx.lineTo(cx - 35, cy + 15);
  ctx.closePath();
  ctx.fill();

  // Целевой круг
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 50, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 15, 0, Math.PI * 2);
  ctx.stroke();
}

// ============================================
// МОДУЛЬ 2: ОТРИСОВКА ДОРОЖЕК
// ============================================

// Прямая горизонтальная дорожка - центрированная
function drawStraightPath() {
  // Центрированная прямая дорожка с увеличенными отступами
  const totalWidth = canvas.width * 0.7; // 70% от ширины экрана
  const startX = (canvas.width - totalWidth) / 2; // Центрируем
  const endX = startX + totalWidth;
  const y = canvas.height / 2;

  pathPoints = [];
  for (let x = startX; x <= endX; x += 5) {
    pathPoints.push({ x: x, y: y });
  }

  // Фон дорожки (широкая серая линия)
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = Math.min(35, canvas.width * 0.08); // Адаптивная толщина
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(endX, y);
  ctx.stroke();

  // Целевая траектория (пунктир)
  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(endX, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Стартовая точка
  ctx.fillStyle = "#4caf50";
  ctx.beginPath();
  ctx.arc(startX, y, 12, 0, Math.PI * 2);
  ctx.fill();

  // Финишная зона
  finishZone = { x: endX, y: y, radius: 30 };
  ctx.strokeStyle = "#ff9800";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(endX, y, 15, 0, Math.PI * 2);
  ctx.stroke();
}

// Вертикальная дорожка (столбик) - центрированная
function drawVerticalPath() {
  const x = canvas.width / 2; // Уже центрирована
  // Центрированная вертикальная дорожка с увеличенными отступами
  const totalHeight = canvas.height * 0.6; // 60% от высоты экрана
  const startY =
    canvas.height - (canvas.height - totalHeight) / 2 - totalHeight * 0.1; // Немного выше центра
  const endY = startY - totalHeight;

  pathPoints = [];
  for (let y = startY; y >= endY; y -= 5) {
    pathPoints.push({ x: x, y: y });
  }

  // Фон дорожки
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = Math.min(35, canvas.width * 0.08); // Адаптивная толщина
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, startY);
  ctx.lineTo(x, endY);
  ctx.stroke();

  // Целевая траектория
  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(x, startY);
  ctx.lineTo(x, endY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Стартовая точка
  ctx.fillStyle = "#4caf50";
  ctx.beginPath();
  ctx.arc(x, startY, 12, 0, Math.PI * 2);
  ctx.fill();

  // Финишная зона
  finishZone = { x: x, y: endY, radius: 30 };
  ctx.strokeStyle = "#ff9800";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, endY, 15, 0, Math.PI * 2);
  ctx.stroke();
}

// Зигзаг (кочки)
function drawZigzagPath() {
  // Центрированный зигзаг с увеличенными отступами
  const totalWidth = canvas.width * 0.7; // 70% от ширины экрана
  const startX = (canvas.width - totalWidth) / 2; // Центрируем
  const endX = startX + totalWidth;
  const centerY = canvas.height / 2;
  const amplitude = Math.min(50, canvas.height * 0.12); // Адаптивная амплитуда
  const segments = 4; // Уменьшено количество сегментов
  const segmentWidth = totalWidth / segments;

  pathPoints = [];

  // Стартовая Y-координата (первая точка зигзага)
  const startY = centerY - amplitude;

  // Генерируем все точки траектории
  for (let i = 0; i <= segments; i++) {
    const x1 = startX + i * segmentWidth;
    const y1 = i % 2 === 0 ? centerY - amplitude : centerY + amplitude;

    if (i < segments) {
      const x2 = startX + (i + 1) * segmentWidth;
      const y2 = (i + 1) % 2 === 0 ? centerY - amplitude : centerY + amplitude;

      // Интерполируем точки между вершинами зигзага
      const steps = Math.ceil(segmentWidth / 5);
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t;
        pathPoints.push({ x: px, y: py });
      }
    } else {
      // Добавляем последнюю точку
      pathPoints.push({ x: x1, y: y1 });
    }
  }

  // Рисуем фон дорожки
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = Math.min(35, canvas.width * 0.08); // Адаптивная толщина
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  ctx.moveTo(startX, startY);

  for (let i = 0; i <= segments; i++) {
    const x = startX + i * segmentWidth;
    const y = i % 2 === 0 ? centerY - amplitude : centerY + amplitude;
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Целевая траектория (пунктир)
  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  for (let i = 0; i <= segments; i++) {
    const x = startX + i * segmentWidth;
    const y = i % 2 === 0 ? centerY - amplitude : centerY + amplitude;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Стартовая точка (на первой вершине зигзага)
  ctx.fillStyle = "#4caf50";
  ctx.beginPath();
  ctx.arc(startX, startY, 12, 0, Math.PI * 2);
  ctx.fill();

  // Финишная зона (на последней вершине зигзага)
  const finalY = segments % 2 === 0 ? centerY - amplitude : centerY + amplitude;
  finishZone = { x: endX, y: finalY, radius: 30 };
  ctx.strokeStyle = "#ff9800";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(endX, finalY, 15, 0, Math.PI * 2);
  ctx.stroke();
}

// Волнистая дорожка - центрированная
function drawWavePath() {
  // Центрированная волнистая дорожка с увеличенными отступами
  const totalWidth = canvas.width * 0.7; // 70% от ширины экрана
  const startX = (canvas.width - totalWidth) / 2; // Центрируем
  const endX = startX + totalWidth;
  const centerY = canvas.height / 2;
  const amplitude = Math.min(35, canvas.height * 0.08); // Адаптивная амплитуда
  const frequency = 0.025; // Немного увеличена частота

  pathPoints = [];

  // Фон дорожки
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = Math.min(35, canvas.width * 0.08); // Адаптивная толщина
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(startX, centerY);

  for (let x = startX; x <= endX; x += 5) {
    const y = centerY + Math.sin((x - startX) * frequency) * amplitude;
    ctx.lineTo(x, y);
    pathPoints.push({ x: x, y: y });
  }
  ctx.stroke();

  // Целевая траектория
  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(startX, centerY);
  for (let x = startX; x <= endX; x += 5) {
    const y = centerY + Math.sin((x - startX) * frequency) * amplitude;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Стартовая точка
  ctx.fillStyle = "#4caf50";
  ctx.beginPath();
  ctx.arc(startX, centerY, 12, 0, Math.PI * 2);
  ctx.fill();

  // Финишная зона
  const finalY = centerY + Math.sin((endX - startX) * frequency) * amplitude;
  finishZone = { x: endX, y: finalY, radius: 30 };
  ctx.strokeStyle = "#ff9800";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(endX, finalY, 15, 0, Math.PI * 2);
  ctx.stroke();
}

// Спираль (улитка) - увеличенная для мобильных
function drawSpiralPath() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxRadius = Math.min(canvas.width, canvas.height) * 0.35 + 20; // Увеличен радиус
  const turns = 3;
  const steps = 200;

  pathPoints = [];

  // Генерируем точки спирали
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const radius = t * maxRadius;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    pathPoints.push({ x: x, y: y });
  }

  // Фон спирали (увеличенная толщина)
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 50; // Увеличена толщина с 40 до 60
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const radius = t * maxRadius;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // Целевая траектория
  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const radius = t * maxRadius;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Стартовая точка (в центре)
  ctx.fillStyle = "#4caf50";
  ctx.beginPath();
  ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
  ctx.fill();

  // Финишная зона (на конце спирали)
  const finalAngle = turns * Math.PI * 2;
  const finalX = centerX + Math.cos(finalAngle) * maxRadius;
  const finalY = centerY + Math.sin(finalAngle) * maxRadius;
  finishZone = { x: finalX, y: finalY, radius: 30 };
  ctx.strokeStyle = "#ff9800";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(finalX, finalY, 15, 0, Math.PI * 2);
  ctx.stroke();
}

// ============================================
// МОДУЛЬ 3: БАЗОВЫЕ ЭЛЕМЕНТЫ (ОБНОВЛЕННЫЕ)
// ============================================

// Прямые линии - 5 вертикальных линий на одном экране (адаптировано для мобильных)
function drawPathLines() {
  // Центрированное распределение 5 линий с увеличенными отступами
  const linePositions = [0.15, 0.3, 0.45, 0.6, 0.85]; // Более широкое распределение
  const lineLength = canvas.height * 0.3; // Уменьшенная длина линии - 30% от высоты экрана
  const startY = canvas.height * 0.35; // Спускаем ниже - 35% от верха (центрирование)
  const lineWidth = Math.min(25, canvas.width * 0.05); // Уменьшенная толщина линии

  pathPoints = [];

  // Генерируем точки траектории для ВСЕХ линий сразу
  for (let i = 0; i < 5; i++) {
    const x = canvas.width * linePositions[i];
    for (let y = startY; y <= startY + lineLength; y += 5) {
      pathPoints.push({ x: x, y: y });
    }
  }

  // Рисуем все 5 линий
  for (let i = 0; i < 5; i++) {
    const x = canvas.width * linePositions[i];
    const isCompleted = completedSubTasks.includes(i); // Завершенные линии

    // Фон линии (серая зона)
    if (isCompleted) {
      // Завершенные линии - зеленый фон
      ctx.strokeStyle = "#c8e6c9";
    } else {
      // Активные линии - обычный серый фон
      ctx.strokeStyle = "#e0e0e0";
    }
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, startY + lineLength);
    ctx.stroke();

    // Целевая траектория (пунктир)
    if (isCompleted) {
      ctx.strokeStyle = "#4caf50";
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = "#667eea";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
    }
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, startY + lineLength);
    ctx.stroke();
    ctx.setLineDash([]);

    // Стартовая точка
    const pointSize = Math.min(12, canvas.width * 0.025);
    if (isCompleted) {
      // Галочка на завершенных линиях
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(x, startY, pointSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - pointSize * 0.4, startY);
      ctx.lineTo(x - pointSize * 0.1, startY + pointSize * 0.3);
      ctx.lineTo(x + pointSize * 0.4, startY - pointSize * 0.3);
      ctx.stroke();
    } else {
      // Зеленая точка на активных линиях
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(x, startY, pointSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Финишная точка
    if (isCompleted) {
      // Зеленая галочка на завершенных линиях
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(x, startY + lineLength, pointSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - pointSize * 0.4, startY + lineLength);
      ctx.lineTo(x - pointSize * 0.1, startY + lineLength + pointSize * 0.3);
      ctx.lineTo(x + pointSize * 0.4, startY + lineLength - pointSize * 0.3);
      ctx.stroke();
    } else {
      // Оранжевый финиш на активных линиях
      ctx.strokeStyle = "#ff9800";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, startY + lineLength, pointSize, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// Наклонные линии - 4 линии вправо сверху + 4 линии влево снизу (адаптировано для мобильных)
function drawPathDiagonal() {
  // Центрированное распределение 4 линий в ряду с увеличенными отступами
  const linePositions = [0.2, 0.4, 0.6, 0.8]; // Более широкое распределение
  const lineLength = canvas.height * 0.1; // Уменьшенная длина линии - 10% от высоты экрана
  const topY = canvas.height * 0.4; // Верхние линии - 40% от верха (спускаем в центр)
  const bottomY = canvas.height * 0.55; // Нижние линии - 55% от верха (спускаем в центр)
  const diagonalOffset = canvas.width * 0.05; // Уменьшенное смещение по диагонали - 5% от ширины

  pathPoints = [];

  // Генерируем точки траектории для ВСЕХ линий сразу
  // 4 линии сверху (наклон вправо)
  for (let i = 0; i < 4; i++) {
    const x1 = canvas.width * linePositions[i];
    const y1 = topY;
    const x2 = x1 + diagonalOffset;
    const y2 = topY + lineLength;

    const steps = Math.ceil(lineLength / 5);
    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      pathPoints.push({ x: px, y: py });
    }
  }

  // 4 линии снизу (наклон влево)
  for (let i = 0; i < 4; i++) {
    const x1 = canvas.width * linePositions[i];
    const y1 = bottomY;
    const x2 = x1 - diagonalOffset;
    const y2 = bottomY + lineLength;

    const steps = Math.ceil(lineLength / 5);
    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      pathPoints.push({ x: px, y: py });
    }
  }

  // Адаптивная толщина линий и размер точек
  const lineWidth = Math.min(20, canvas.width * 0.04);
  const pointSize = Math.min(12, canvas.width * 0.025);

  // Рисуем все 8 линий
  // 4 линии сверху (наклон вправо)
  for (let i = 0; i < 4; i++) {
    const x1 = canvas.width * linePositions[i];
    const y1 = topY;
    const x2 = x1 + diagonalOffset;
    const y2 = topY + lineLength;
    const isCompleted = completedSubTasks.includes(i);

    // Фон линии
    ctx.strokeStyle = isCompleted ? "#c8e6c9" : "#e0e0e0";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Целевая траектория
    ctx.strokeStyle = isCompleted ? "#4caf50" : "#667eea";
    ctx.lineWidth = 3;
    ctx.setLineDash(isCompleted ? [] : [10, 5]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Стартовая точка
    if (isCompleted) {
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(x1, y1, pointSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1 - pointSize * 0.4, y1);
      ctx.lineTo(x1 - pointSize * 0.1, y1 + pointSize * 0.3);
      ctx.lineTo(x1 + pointSize * 0.4, y1 - pointSize * 0.3);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(x1, y1, pointSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Финишная точка
    if (isCompleted) {
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(x2, y2, pointSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x2 - pointSize * 0.4, y2);
      ctx.lineTo(x2 - pointSize * 0.1, y2 + pointSize * 0.3);
      ctx.lineTo(x2 + pointSize * 0.4, y2 - pointSize * 0.3);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#ff9800";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x2, y2, pointSize, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 4 линии снизу (наклон влево)
  for (let i = 0; i < 4; i++) {
    const x1 = canvas.width * linePositions[i];
    const y1 = bottomY;
    const x2 = x1 - diagonalOffset;
    const y2 = bottomY + lineLength;
    const isCompleted = completedSubTasks.includes(i + 4); // Индексы 4-7

    // Фон линии
    ctx.strokeStyle = isCompleted ? "#c8e6c9" : "#e0e0e0";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Целевая траектория
    ctx.strokeStyle = isCompleted ? "#4caf50" : "#667eea";
    ctx.lineWidth = 3;
    ctx.setLineDash(isCompleted ? [] : [10, 5]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Стартовая точка
    if (isCompleted) {
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(x1, y1, pointSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1 - pointSize * 0.4, y1);
      ctx.lineTo(x1 - pointSize * 0.1, y1 + pointSize * 0.3);
      ctx.lineTo(x1 + pointSize * 0.4, y1 - pointSize * 0.3);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(x1, y1, pointSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Финишная точка
    if (isCompleted) {
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(x2, y2, pointSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x2 - pointSize * 0.4, y2);
      ctx.lineTo(x2 - pointSize * 0.1, y2 + pointSize * 0.3);
      ctx.lineTo(x2 + pointSize * 0.4, y2 - pointSize * 0.3);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#ff9800";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x2, y2, pointSize, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// Круги - 6 кругов (3 слева в столбик, 3 справа в столбик) с увеличенными отступами
function drawPathCircles() {
  // Адаптивные размеры для мобильных устройств
  const radius = Math.min(28, canvas.width * 0.055); // Немного уменьшенный радиус
  const leftX = canvas.width * 0.28; // Сдвинуты ближе к центру
  const rightX = canvas.width * 0.72; // Сдвинуты ближе к центру

  // Увеличенные отступы между кругами по вертикали
  const topY = canvas.height * 0.25; // Верхний круг
  const middleY = canvas.height * 0.5; // Средний круг
  const bottomY = canvas.height * 0.75; // Нижний круг

  pathPoints = [];

  // Позиции всех 6 кругов
  const circlePositions = [
    { x: leftX, y: topY }, // 0: левый верхний
    { x: leftX, y: middleY }, // 1: левый средний
    { x: leftX, y: bottomY }, // 2: левый нижний
    { x: rightX, y: topY }, // 3: правый верхний
    { x: rightX, y: middleY }, // 4: правый средний
    { x: rightX, y: bottomY } // 5: правый нижний
  ];

  // Генерируем точки траектории для ВСЕХ кругов сразу
  for (let i = 0; i < 6; i++) {
    const cx = circlePositions[i].x;
    const cy = circlePositions[i].y;

    // Генерируем точки траектории круга
    const steps = 100;
    for (let j = 0; j <= steps; j++) {
      const angle = (j / steps) * Math.PI * 2;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      pathPoints.push({ x: px, y: py });
    }
  }

  // Рисуем все 6 кругов
  for (let i = 0; i < 6; i++) {
    const cx = circlePositions[i].x;
    const cy = circlePositions[i].y;
    const isCompleted = completedSubTasks.includes(i);

    // Фон круга (широкая серая линия)
    ctx.strokeStyle = isCompleted ? "#c8e6c9" : "#e0e0e0";
    ctx.lineWidth = Math.min(16, canvas.width * 0.028); // Уменьшенная толщина
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Целевая траектория
    ctx.strokeStyle = isCompleted ? "#4caf50" : "#667eea";
    ctx.lineWidth = 3;
    ctx.setLineDash(isCompleted ? [] : [10, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Стартовая точка (сверху круга)
    const pointSize = Math.min(12, canvas.width * 0.025);
    if (isCompleted) {
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(cx, cy - radius, pointSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - pointSize * 0.4, cy - radius);
      ctx.lineTo(cx - pointSize * 0.1, cy - radius + pointSize * 0.3);
      ctx.lineTo(cx + pointSize * 0.4, cy - radius - pointSize * 0.3);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(cx, cy - radius, pointSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Финишная точка (тоже сверху круга, рядом со стартом)
    if (!isCompleted) {
      ctx.strokeStyle = "#ff9800";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy - radius, pointSize, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// Дуги - 5 дуг по центру, смотрящих вниз, с увеличенными отступами
function drawPathArcs() {
  // Адаптивные размеры для мобильных устройств
  const radius = Math.min(32, canvas.width * 0.065); // Немного уменьшенный радиус
  const centerX = canvas.width * 0.5; // Центр экрана

  // Позиции 5 дуг в столбик по центру с увеличенными отступами
  const topY1 = canvas.height * 0.18; // Первая дуга (выше)
  const topY2 = canvas.height * 0.33; // Вторая дуга
  const topY3 = canvas.height * 0.5; // Третья дуга (центр)
  const topY4 = canvas.height * 0.67; // Четвертая дуга
  const topY5 = canvas.height * 0.82; // Пятая дуга (ниже)

  pathPoints = [];

  // Генерируем точки траектории для ВСЕХ дуг сразу
  // 5 дуг по центру (смотрят вниз)
  const yPositions = [topY1, topY2, topY3, topY4, topY5];
  for (let i = 0; i < 5; i++) {
    const cy = yPositions[i];
    const startAngle = Math.PI;
    const endAngle = Math.PI * 2;

    const steps = 50;
    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      const angle = startAngle + (endAngle - startAngle) * t;
      const px = centerX + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius; // Плюс для направления вниз
      pathPoints.push({ x: px, y: py });
    }
  }

  const lineWidth = Math.min(18, canvas.width * 0.035); // Немного уменьшенная толщина
  const pointSize = Math.min(12, canvas.width * 0.025);

  // Рисуем все 5 дуг (смотрят вниз)
  for (let i = 0; i < 5; i++) {
    const cy = yPositions[i];
    const isCompleted = completedSubTasks.includes(i);
    const startAngle = Math.PI;
    const endAngle = Math.PI * 2;

    // Фон дуги
    ctx.strokeStyle = isCompleted ? "#c8e6c9" : "#e0e0e0";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(centerX, cy, radius, startAngle, endAngle);
    ctx.stroke();

    // Целевая траектория
    ctx.strokeStyle = isCompleted ? "#4caf50" : "#667eea";
    ctx.lineWidth = 3;
    ctx.setLineDash(isCompleted ? [] : [10, 5]);
    ctx.beginPath();
    ctx.arc(centerX, cy, radius, startAngle, endAngle);
    ctx.stroke();
    ctx.setLineDash([]);

    // Стартовая точка (слева)
    const startX_point = centerX + Math.cos(startAngle) * radius;
    const startY_point = cy + Math.sin(startAngle) * radius;
    if (isCompleted) {
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(startX_point, startY_point, pointSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(startX_point - pointSize * 0.4, startY_point);
      ctx.lineTo(
        startX_point - pointSize * 0.1,
        startY_point + pointSize * 0.3
      );
      ctx.lineTo(
        startX_point + pointSize * 0.4,
        startY_point - pointSize * 0.3
      );
      ctx.stroke();
    } else {
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(startX_point, startY_point, pointSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Финишная точка (справа)
    const endX_point = centerX + Math.cos(endAngle) * radius;
    const endY_point = cy + Math.sin(endAngle) * radius;
    if (!isCompleted) {
      ctx.strokeStyle = "#ff9800";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(endX_point, endY_point, pointSize, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// Пружинка - 3 волнистые линии в столбик для мобильных устройств
function drawPathLoops() {
  // Адаптивные размеры для мобильных устройств
  const waveWidth = Math.min(200, canvas.width * 0.6); // Ширина волнистой линии
  const waveHeight = Math.min(40, canvas.height * 0.08); // Высота волн
  const wavesPerLine = 2.5; // Количество волн в линии
  const startX = (canvas.width - waveWidth) / 2; // Центрируем по горизонтали

  // Позиции 3 пружинок в столбик
  const topY = canvas.height * 0.25; // Верхняя пружинка
  const middleY = canvas.height * 0.5; // Средняя пружинка
  const bottomY = canvas.height * 0.75; // Нижняя пружинка
  const yPositions = [topY, middleY, bottomY];

  pathPoints = [];

  // Генерируем точки траектории для ВСЕХ волнистых линий сразу
  for (let i = 0; i < 3; i++) {
    const centerY = yPositions[i];

    // Генерируем точки для волнистой линии
    const totalSteps = 150;
    for (let j = 0; j <= totalSteps; j++) {
      const t = j / totalSteps;

      // Горизонтальное движение слева направо
      const px = startX + t * waveWidth;

      // Плавные волны (синусоида)
      const angle = t * wavesPerLine * Math.PI * 2;
      const py = centerY + (Math.sin(angle) * waveHeight) / 2;

      pathPoints.push({ x: px, y: py });
    }
  }

  // Рисуем все 3 волнистые линии
  for (let i = 0; i < 3; i++) {
    const centerY = yPositions[i];
    const waveEndX = startX + waveWidth;
    const isCompleted = completedSubTasks.includes(i);

    // Фон волнистой линии (широкая серая зона для мобильных)
    ctx.strokeStyle = isCompleted ? "#c8e6c9" : "#e0e0e0";
    ctx.lineWidth = Math.min(70, canvas.width * 0.12); // Адаптивная ширина зоны допуска
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();

    // Рисуем траекторию волнистой линии
    const totalSteps = 150;
    for (let j = 0; j <= totalSteps; j++) {
      const t = j / totalSteps;
      const px = startX + t * waveWidth;
      const angle = t * wavesPerLine * Math.PI * 2;
      const py = centerY + (Math.sin(angle) * waveHeight) / 2;

      if (j === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Целевая траектория (пунктир)
    ctx.strokeStyle = isCompleted ? "#4caf50" : "#667eea";
    ctx.lineWidth = 4;
    ctx.setLineDash(isCompleted ? [] : [15, 8]); // Крупный пунктир
    ctx.beginPath();

    for (let j = 0; j <= totalSteps; j++) {
      const t = j / totalSteps;
      const px = startX + t * waveWidth;
      const angle = t * wavesPerLine * Math.PI * 2;
      const py = centerY + (Math.sin(angle) * waveHeight) / 2;

      if (j === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Стартовая точка (слева)
    const pointSize = Math.min(18, canvas.width * 0.035);
    if (isCompleted) {
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(startX, centerY, pointSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(startX - pointSize * 0.4, centerY);
      ctx.lineTo(startX - pointSize * 0.1, centerY + pointSize * 0.3);
      ctx.lineTo(startX + pointSize * 0.4, centerY - pointSize * 0.3);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(startX, centerY, pointSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Финишная точка (справа)
    const finalAngle = wavesPerLine * Math.PI * 2;
    const endY = centerY + (Math.sin(finalAngle) * waveHeight) / 2;
    if (!isCompleted) {
      ctx.strokeStyle = "#ff9800";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(waveEndX, endY, pointSize, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// ============================================
// МОДУЛЬ 4: СЕРИЙНОСТЬ ДВИЖЕНИЙ
// ============================================

// Ритмичный заборчик - зигзаг с чередованием высоты зубцов
function drawRhythmicFence() {
  // Центрированный зигзаг с чередующейся высотой зубцов
  const totalWidth = canvas.width * 0.75; // 75% от ширины экрана
  const startX = (canvas.width - totalWidth) / 2; // Центрируем
  const endX = startX + totalWidth;

  // Базовая линия (нижняя точка для всех зубцов)
  const baseY = canvas.height * 0.65; // Нижняя линия

  // Высоты зубцов
  const tallHeight = Math.min(80, canvas.height * 0.2); // Высота четных зубцов
  const shortHeight = tallHeight / 2; // Высота нечетных зубцов (в 2 раза ниже)

  const tallTopY = baseY - tallHeight; // Вершина четных (высоких) зубцов
  const shortTopY = baseY - shortHeight; // Вершина нечетных (низких) зубцов

  // 6 зубцов (3 высоких + 3 низких, чередуются)
  const toothCount = 6;
  const toothWidth = totalWidth / toothCount;

  pathPoints = [];

  // Генерируем точки траектории
  // Паттерн: base -> short -> base -> tall -> base -> short -> base -> tall -> base -> short -> base -> tall -> base
  for (let i = 0; i < toothCount; i++) {
    const toothStartX = startX + i * toothWidth;
    const toothMidX = toothStartX + toothWidth / 2;
    const toothEndX = toothStartX + toothWidth;

    // Определяем высоту текущего зубца (четные - высокие, нечетные - низкие)
    const isEven = i % 2 === 0;
    const topY = isEven ? tallTopY : shortTopY;

    // Подъем от базовой линии к вершине
    const upSteps = 15;
    for (let j = 0; j <= upSteps; j++) {
      const t = j / upSteps;
      const px = toothStartX + t * (toothWidth / 2);
      const py = baseY + (topY - baseY) * t;
      pathPoints.push({ x: px, y: py });
    }

    // Спуск от вершины к базовой линии
    const downSteps = 15;
    for (let j = 1; j <= downSteps; j++) {
      const t = j / downSteps;
      const px = toothMidX + t * (toothWidth / 2);
      const py = topY + (baseY - topY) * t;
      pathPoints.push({ x: px, y: py });
    }
  }

  // Рисуем фон дорожки
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = Math.min(35, canvas.width * 0.08);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  if (pathPoints.length > 0) {
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
  }
  ctx.stroke();

  // Целевая траектория (пунктир)
  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();

  if (pathPoints.length > 0) {
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Стартовая точка
  ctx.fillStyle = "#4caf50";
  ctx.beginPath();
  ctx.arc(startX, baseY, 12, 0, Math.PI * 2);
  ctx.fill();

  // Финишная зона
  finishZone = { x: endX, y: baseY, radius: 30 };
  ctx.strokeStyle = "#ff9800";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(endX, baseY, 15, 0, Math.PI * 2);
  ctx.stroke();
}

// Волна и утес - чередование плавной волны и резкого угла
function drawWaveCliff() {
  // Центрированная траектория
  const totalWidth = canvas.width * 0.75; // 75% от ширины экрана
  const startX = (canvas.width - totalWidth) / 2; // Центрируем
  const centerY = canvas.height / 2;
  const amplitude = Math.min(35, canvas.height * 0.09);

  // Паттерн: волна -> угол -> волна -> угол -> волна -> угол -> волна
  // 3 угла + 4 волны = 7 элементов
  const elements = 7;
  const elementWidth = totalWidth / elements;

  pathPoints = [];

  // Генерируем точки траектории
  for (let i = 0; i < elements; i++) {
    const elementStartX = startX + i * elementWidth;
    const isWave = i % 2 === 0; // Четные индексы (0,2,4,6) - волны, нечетные (1,3,5) - углы

    if (isWave) {
      // Плавная волна (половина синусоиды)
      const waveSteps = 20;
      for (let j = 0; j <= waveSteps; j++) {
        const t = j / waveSteps;
        const x = elementStartX + t * elementWidth;
        const angle = t * Math.PI; // Половина периода (от 0 до π)
        const y = centerY - Math.sin(angle) * amplitude; // Минус для волны вверх
        pathPoints.push({ x: x, y: y });
      }
    } else {
      // Резкий угол (^)
      const peakX = elementStartX + elementWidth / 2;
      const peakY = centerY - amplitude * 1.5; // Угол выше волны

      // Подъем к вершине
      const upSteps = 10;
      for (let j = 1; j <= upSteps; j++) {
        const t = j / upSteps;
        const x = elementStartX + t * (elementWidth / 2);
        const y = centerY + (peakY - centerY) * t;
        pathPoints.push({ x: x, y: y });
      }

      // Спуск от вершины
      const downSteps = 10;
      for (let j = 1; j <= downSteps; j++) {
        const t = j / downSteps;
        const x = peakX + t * (elementWidth / 2);
        const y = peakY + (centerY - peakY) * t;
        pathPoints.push({ x: x, y: y });
      }
    }
  }

  // Рисуем фон дорожки
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = Math.min(35, canvas.width * 0.08);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  if (pathPoints.length > 0) {
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
  }
  ctx.stroke();

  // Целевая траектория (пунктир)
  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();

  if (pathPoints.length > 0) {
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Стартовая точка
  if (pathPoints.length > 0) {
    ctx.fillStyle = "#4caf50";
    ctx.beginPath();
    ctx.arc(pathPoints[0].x, pathPoints[0].y, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Финишная зона
  if (pathPoints.length > 0) {
    const lastPoint = pathPoints[pathPoints.length - 1];
    finishZone = { x: lastPoint.x, y: lastPoint.y, radius: 30 };
    ctx.strokeStyle = "#ff9800";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 15, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Ритмическая спираль - чередование больших и маленьких петель
function drawRhythmicSpiral() {
  const baseY = canvas.height * 0.65; // Базовая линия (низ петель)
  const bigRadius = Math.min(55, canvas.width * 0.11); // Радиус большой петли
  const smallRadius = bigRadius / 2; // Радиус маленькой петли (в 2 раза меньше)

  // Паттерн: большая -> маленькая -> маленькая -> большая -> маленькая -> маленькая
  const pattern = ["big", "small", "small", "big", "small", "small"];

  // Вычисляем общую ширину
  const totalWidth = canvas.width * 0.75;
  /*const startX = (canvas.width - totalWidth) / 2;*/
  const startX = 15;

  // Вычисляем ширину каждой петли с учетом их размеров
  const bigWidth = bigRadius * 2.2; // Ширина большой петли с запасом
  const smallWidth = smallRadius * 2.2; // Ширина маленькой петли с запасом

  pathPoints = [];
  let currentX = startX;

  // Генерируем точки траектории для каждой петли
  for (let i = 0; i < pattern.length; i++) {
    const isBig = pattern[i] === "big";
    const radius = isBig ? bigRadius : smallRadius;
    const loopWidth = isBig ? bigWidth : smallWidth;

    // Центр петли
    const centerX = currentX + loopWidth / 2;
    const centerY = baseY - radius; // Центр на высоте радиуса от базовой линии

    // Генерируем точки петли (начинаем снизу, идем против часовой стрелки)
    const steps = 50;
    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      // Начинаем с нижней точки (угол = π/2), идем полный круг
      const angle = Math.PI / 2 + t * Math.PI * 2;
      const px = centerX + Math.cos(angle) * radius;
      const py = centerY + Math.sin(angle) * radius;
      pathPoints.push({ x: px, y: py });
    }

    // Переходим к следующей петле
    currentX += loopWidth;
  }

  // Рисуем фон дорожки с переменной шириной
  currentX = startX;
  for (let i = 0; i < pattern.length; i++) {
    const isBig = pattern[i] === "big";
    const radius = isBig ? bigRadius : smallRadius;
    const loopWidth = isBig ? bigWidth : smallWidth;
    const lineWidth = isBig
      ? Math.min(40, canvas.width * 0.09)
      : Math.min(30, canvas.width * 0.065);

    const centerX = currentX + loopWidth / 2;
    const centerY = baseY - radius;

    // Рисуем серую зону для этой петли
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    currentX += loopWidth;
  }

  // Целевая траектория (пунктир)
  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();

  if (pathPoints.length > 0) {
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Стартовая точка (внизу первой петли)
  if (pathPoints.length > 0) {
    ctx.fillStyle = "#4caf50";
    ctx.beginPath();
    ctx.arc(pathPoints[0].x, pathPoints[0].y, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Финишная зона (внизу последней петли)
  if (pathPoints.length > 0) {
    const lastPoint = pathPoints[pathPoints.length - 1];
    finishZone = { x: lastPoint.x, y: lastPoint.y, radius: 30 };
    ctx.strokeStyle = "#ff9800";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 15, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Зубчатая стена (Меандр) - строго горизонтальные и вертикальные отрезки
function drawMeanderWall() {
  // Сдвигаем начало ещё левее, чтобы уместить 5 циклов на мобильных
  const startX = canvas.width * 0.03; // Было 0.1 → стало 0.05 (сдвиг на 5% влево)
  const startY = canvas.height * 0.7; // Начало внизу (без изменений)

  // Сохраняем размеры отрезков (стиль не меняем)
  const horizontalLength = Math.min(45, canvas.width * 0.09);
  const verticalLength = Math.min(50, canvas.height * 0.12);
  const cycles = 5; // Количество циклов (без изменений)

  pathPoints = [];

  let currentX = startX;
  let currentY = startY;

  // Генерируем точки траектории
  for (let i = 0; i < cycles; i++) {
    // 1. Отрезок ВПРАВО
    const rightEndX = currentX + horizontalLength;
    const steps1 = Math.ceil(horizontalLength / 3);
    for (let j = 0; j <= steps1; j++) {
      const t = j / steps1;
      const px = currentX + t * horizontalLength;
      const py = currentY;
      pathPoints.push({ x: px, y: py });
    }
    currentX = rightEndX;

    // 2. Отрезок ВВЕРХ
    const upEndY = currentY - verticalLength;
    const steps2 = Math.ceil(verticalLength / 3);
    for (let j = 1; j <= steps2; j++) {
      const t = j / steps2;
      const px = currentX;
      const py = currentY - t * verticalLength;
      pathPoints.push({ x: px, y: py });
    }
    currentY = upEndY;

    // 3. Отрезок ВПРАВО
    const rightEndX2 = currentX + horizontalLength;
    const steps3 = Math.ceil(horizontalLength / 3);
    for (let j = 1; j <= steps3; j++) {
      const t = j / steps3;
      const px = currentX + t * horizontalLength;
      const py = currentY;
      pathPoints.push({ x: px, y: py });
    }
    currentX = rightEndX2;

    // 4. Отрезок ВНИЗ
    const downEndY = currentY + verticalLength;
    const steps4 = Math.ceil(verticalLength / 3);
    for (let j = 1; j <= steps4; j++) {
      const t = j / steps4;
      const px = currentX;
      const py = currentY + t * verticalLength;
      pathPoints.push({ x: px, y: py });
    }
    currentY = downEndY;
  }

  // Рисуем фон дорожки (серая зона)
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = Math.min(35, canvas.width * 0.08);
  ctx.lineCap = "butt"; // Прямые углы без скругления
  ctx.lineJoin = "miter"; // Острые углы
  ctx.beginPath();

  if (pathPoints.length > 0) {
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
  }
  ctx.stroke();

  // Целевая траектория (пунктир)
  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]);
  ctx.lineCap = "butt"; // Прямые углы
  ctx.lineJoin = "miter"; // Острые углы
  ctx.beginPath();

  if (pathPoints.length > 0) {
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Стартовая точка
  if (pathPoints.length > 0) {
    ctx.fillStyle = "#4caf50";
    ctx.beginPath();
    ctx.arc(pathPoints[0].x, pathPoints[0].y, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Финишная зона
  if (pathPoints.length > 0) {
    const lastPoint = pathPoints[pathPoints.length - 1];
    finishZone = { x: lastPoint.x, y: lastPoint.y, radius: 30 };
    ctx.strokeStyle = "#ff9800";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 15, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Комбинированная цепь - финальный уровень: плавная волна + острый утес + прямоугольный меандр
function drawCombinedChain() {
  const baseY = canvas.height * 0.65; // Базовая линия для всех элементов
  const totalWidth = canvas.width * 0.8; // 80% от ширины экрана
  const startX = (canvas.width - totalWidth) / 2; // Центрируем

  // Разделяем на 3 части: волна (40%) + утес (20%) + меандр (40%)
  const waveWidth = totalWidth * 0.4;
  const cliffWidth = totalWidth * 0.2;
  const meanderWidth = totalWidth * 0.4;

  pathPoints = [];

  // ЧАСТЬ 1: Плавная волна (одна широкая и низкая дуга)
  const waveStartX = startX;
  const waveEndX = waveStartX + waveWidth;
  const waveAmplitude = Math.min(30, canvas.height * 0.08); // Низкая волна

  const waveSteps = 30;
  for (let i = 0; i <= waveSteps; i++) {
    const t = i / waveSteps;
    const x = waveStartX + t * waveWidth;
    // Половина синусоиды (от 0 до π) для плавной дуги
    const angle = t * Math.PI;
    const y = baseY - Math.sin(angle) * waveAmplitude;
    pathPoints.push({ x: x, y: y });
  }

  // ЧАСТЬ 2: Острый утес (высокий узкий пик)
  const cliffStartX = waveEndX;
  const cliffPeakX = cliffStartX + cliffWidth / 2;
  const cliffEndX = cliffStartX + cliffWidth;
  const cliffHeight = Math.min(60, canvas.height * 0.15); // Высокий пик
  const cliffPeakY = baseY - cliffHeight;

  // Подъем к вершине (прямая линия)
  const upSteps = 15;
  for (let i = 1; i <= upSteps; i++) {
    const t = i / upSteps;
    const x = cliffStartX + t * (cliffWidth / 2);
    const y = baseY + (cliffPeakY - baseY) * t;
    pathPoints.push({ x: x, y: y });
  }

  // Спуск от вершины (прямая линия)
  const downSteps = 15;
  for (let i = 1; i <= downSteps; i++) {
    const t = i / downSteps;
    const x = cliffPeakX + t * (cliffWidth / 2);
    const y = cliffPeakY + (baseY - cliffPeakY) * t;
    pathPoints.push({ x: x, y: y });
  }

  // ЧАСТЬ 3: Прямоугольный меандр (ступенька: вверх → вправо → вниз)
  const meanderStartX = cliffEndX;
  const stepHeight = Math.min(40, canvas.height * 0.1);
  const stepWidth = meanderWidth / 2; // Половина ширины на горизонталь

  let currentX = meanderStartX;
  let currentY = baseY;

  // Отрезок ВВЕРХ
  const upY = currentY - stepHeight;
  const verticalSteps = Math.ceil(stepHeight / 3);
  for (let i = 1; i <= verticalSteps; i++) {
    const t = i / verticalSteps;
    const x = currentX;
    const y = currentY - t * stepHeight;
    pathPoints.push({ x: x, y: y });
  }
  currentY = upY;

  // Отрезок ВПРАВО (горизонталь)
  const rightX = currentX + stepWidth;
  const horizontalSteps = Math.ceil(stepWidth / 3);
  for (let i = 1; i <= horizontalSteps; i++) {
    const t = i / horizontalSteps;
    const x = currentX + t * stepWidth;
    const y = currentY;
    pathPoints.push({ x: x, y: y });
  }
  currentX = rightX;

  // Отрезок ВНИЗ
  const downY = baseY;
  const verticalSteps2 = Math.ceil(stepHeight / 3);
  for (let i = 1; i <= verticalSteps2; i++) {
    const t = i / verticalSteps2;
    const x = currentX;
    const y = currentY + t * stepHeight;
    pathPoints.push({ x: x, y: y });
  }

  // Рисуем фон дорожки (серая зона одинаковой ширины)
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = Math.min(35, canvas.width * 0.08); // Одинаковая ширина по всей длине
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  if (pathPoints.length > 0) {
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
  }
  ctx.stroke();

  // Целевая траектория (пунктир)
  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  if (pathPoints.length > 0) {
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Стартовая точка
  if (pathPoints.length > 0) {
    ctx.fillStyle = "#4caf50";
    ctx.beginPath();
    ctx.arc(pathPoints[0].x, pathPoints[0].y, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Финишная зона
  if (pathPoints.length > 0) {
    const lastPoint = pathPoints[pathPoints.length - 1];
    finishZone = { x: lastPoint.x, y: lastPoint.y, radius: 30 };
    ctx.strokeStyle = "#ff9800";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 15, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ============================================
// МОДУЛЬ 5: ЗРИТЕЛЬНО-МОТОРНОЕ СООТНЕСЕНИЕ
// ============================================

function drawMirrorTreeTemplate() {
  // Параметры сетки
  gridCellSize = 35; // Размер клетки в пикселях
  const gridCols = Math.floor(canvas.width / gridCellSize);
  const gridRows = Math.floor(canvas.height / gridCellSize);

  // Центрируем сетку
  const totalGridWidth = gridCols * gridCellSize;
  const totalGridHeight = gridRows * gridCellSize;
  gridOffsetX = (canvas.width - totalGridWidth) / 2;
  gridOffsetY = (canvas.height - totalGridHeight) / 2;

  // Вычисляем позицию центральной оси (x=0 в координатах сетки)
  const centerGridX = gridCols / 2;
  const centerPixelX = gridOffsetX + centerGridX * gridCellSize;

  // Рисуем фон сетки
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(gridOffsetX, gridOffsetY, totalGridWidth, totalGridHeight);

  // Рисуем линии сетки (светло-серые)
  ctx.strokeStyle = "#d0d0d0";
  ctx.lineWidth = 1;

  // Вертикальные линии сетки
  for (let i = 0; i <= gridCols; i++) {
    const x = gridOffsetX + i * gridCellSize;
    ctx.beginPath();
    ctx.moveTo(x, gridOffsetY);
    ctx.lineTo(x, gridOffsetY + totalGridHeight);
    ctx.stroke();
  }

  // Горизонтальные линии сетки
  for (let i = 0; i <= gridRows; i++) {
    const y = gridOffsetY + i * gridCellSize;
    ctx.beginPath();
    ctx.moveTo(gridOffsetX, y);
    ctx.lineTo(gridOffsetX + totalGridWidth, y);
    ctx.stroke();
  }

  // Рисуем центральную ось симметрии (зеленая вертикальная линия)
  ctx.strokeStyle = "#4caf50";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(centerPixelX, gridOffsetY);
  ctx.lineTo(centerPixelX, gridOffsetY + totalGridHeight);
  ctx.stroke();

  // ============================================
  // ЛЕВАЯ ЧАСТЬ: ВИДИМЫЙ ОБРАЗЕЦ (черные линии)
  // ============================================
  if (mirrorTreeSegments.length > 0) {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let i = 0; i < mirrorTreeSegments.length; i++) {
      const seg = mirrorTreeSegments[i];
      const x1 = centerPixelX + seg.x1 * gridCellSize;
      const y1 = gridOffsetY + seg.y1 * gridCellSize;
      const x2 = centerPixelX + seg.x2 * gridCellSize;
      const y2 = gridOffsetY + seg.y2 * gridCellSize;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  // ============================================
  // ПРАВАЯ ЧАСТЬ: ТОЛЬКО ЗАВЕРШЕННЫЕ СЕГМЕНТЫ
  // Невидимые сегменты НЕ отрисовываются вообще
  // ============================================
  if (mirrorTreeTargets.length > 0) {
    ctx.strokeStyle = "#2196f3";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let i = 0; i < mirrorTreeTargets.length; i++) {
      const seg = mirrorTreeTargets[i];

      // Рисуем ТОЛЬКО если сегмент завершен
      if (seg.isCompleted) {
        const x1 = centerPixelX + seg.x1 * gridCellSize;
        const y1 = gridOffsetY + seg.y1 * gridCellSize;
        const x2 = centerPixelX + seg.x2 * gridCellSize;
        const y2 = gridOffsetY + seg.y2 * gridCellSize;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
  }
}

//==============================================
// УЗОР ПО ТОЧКАМ
//==============================================
function drawPatternDots() {
  // Инициализируем координаты точек в пиксели
  const sideWidth = canvas.width / 2;
  const sideHeight = canvas.height;

  // Преобразуем относительные координаты в пиксели
  const pixelPoints = patternPoints.map((point) => ({
    x: point.x * sideWidth,
    y: point.y * sideHeight
  }));

  // ============================================
  // ЛЕВАЯ ЧАСТЬ: ОБРАЗЕЦ (эталонный узор)
  // ============================================

  // Рисуем линии образца
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < patternReference.length; i++) {
    const [startIdx, endIdx] = patternReference[i];
    const start = pixelPoints[startIdx];
    const end = pixelPoints[endIdx];

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  // Рисуем точки образца
  for (let i = 0; i < pixelPoints.length; i++) {
    ctx.fillStyle = i === patternStartPoint ? "#2196f3" : "#333333";
    ctx.beginPath();
    ctx.arc(pixelPoints[i].x, pixelPoints[i].y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ============================================
  // ПРАВАЯ ЧАСТЬ: ПОЛЕ ДЛЯ ВВОДА
  // ============================================

  // Смещение для правой части
  const rightOffset = sideWidth;

  // Определяем, какие точки уже использованы
  const usedPoints = new Set();
  for (let i = 0; i < userConnections.length; i++) {
    const [startIdx, endIdx] = userConnections[i];
    usedPoints.add(startIdx);
    usedPoints.add(endIdx);
  }

  // Рисуем линии, которые провел пользователь
  ctx.strokeStyle = "#1976d2";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < userConnections.length; i++) {
    const [startIdx, endIdx] = userConnections[i];
    const start = pixelPoints[startIdx];
    const end = pixelPoints[endIdx];

    ctx.beginPath();
    ctx.moveTo(rightOffset + start.x, start.y);
    ctx.lineTo(rightOffset + end.x, end.y);
    ctx.stroke();
  }

  // Рисуем точки справа
  for (let i = 0; i < pixelPoints.length; i++) {
    const px = rightOffset + pixelPoints[i].x;
    const py = pixelPoints[i].y;

    // Выделяем стартовую точку
    if (i === patternStartPoint) {
      ctx.fillStyle = "#2196f3";
      ctx.beginPath();
      ctx.arc(px, py, dotRadius + 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (usedPoints.has(i)) {
      // Использованная точка - желтая подсветка
      ctx.fillStyle = "#ffeb3b";
      ctx.beginPath();
      ctx.arc(px, py, dotRadius + 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Сама точка - зеленая
    ctx.fillStyle = "#4caf50";
    ctx.beginPath();
    ctx.arc(px, py, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Рисуем временную линию при перемещении
  if (activePoint !== null && tempLine !== null) {
    ctx.strokeStyle = "#ff9800";
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 5]);

    const activePointPixel = pixelPoints[activePoint];
    ctx.beginPath();
    ctx.moveTo(rightOffset + activePointPixel.x, activePointPixel.y);
    ctx.lineTo(tempLine.x, tempLine.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Подсвечиваем активную точку
    ctx.fillStyle = "#ff5252";
    ctx.beginPath();
    ctx.arc(
      rightOffset + activePointPixel.x,
      activePointPixel.y,
      dotRadius + 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  // ============================================
  // ПОДСКАЗКА: Подсветка следующей целевой точки
  // ============================================
  if (!exerciseCompleted) {
    const nextTarget = getNextTargetPoint();
    if (nextTarget !== null) {
      const targetPoint = pixelPoints[nextTarget];
      const drawX = rightOffset + targetPoint.x;
      const drawY = targetPoint.y;

      // Пульсирующее оранжевое кольцо вокруг целевой точки
      ctx.strokeStyle = "rgba(255, 152, 0, 0.8)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]); // Пунктирное кольцо
      ctx.beginPath();
      ctx.arc(drawX, drawY, dotRadius + 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Лёгкая внутренняя подсветка
      ctx.fillStyle = "rgba(255, 152, 0, 0.15)";
      ctx.beginPath();
      ctx.arc(drawX, drawY, dotRadius + 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function getPointAtPosition(x, y) {
  const sideWidth = canvas.width / 2;
  const sideHeight = canvas.height;
  const rightOffset = sideWidth;

  // Проверяем, что палец в правой половине
  if (x < rightOffset) return null;

  const pixelPoints = patternPoints.map((point) => ({
    x: point.x * sideWidth,
    y: point.y * sideHeight
  }));

  // ✅ УВЕЛИЧЕН ДОПУСК до 40px для надежного захвата
  let closestPoint = null;
  let minDistance = 40;

  for (let i = 0; i < pixelPoints.length; i++) {
    const px = rightOffset + pixelPoints[i].x;
    const py = pixelPoints[i].y;

    const distance = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));

    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = i;
    }
  }
  return closestPoint;
}

function isValidConnection(startIdx, endIdx) {
  // Проверяет, существует ли такое соединение в эталонном узоре
  // Порядок не важен: [A,B] и [B,A] считаются одинаковыми

  for (let i = 0; i < patternReference.length; i++) {
    const [a, b] = patternReference[i];
    if ((a === startIdx && b === endIdx) || (a === endIdx && b === startIdx)) {
      return true;
    }
  }
  return false;
}

// Определяет следующую целевую точку для подсветки-подсказки
function getNextTargetPoint() {
  // Если упражнение завершено - нет подсказки
  if (exerciseCompleted) return null;

  // Если пользователь держит точку - ищем соединение от этой точки
  if (activePoint !== null) {
    for (let i = 0; i < patternReference.length; i++) {
      const [a, b] = patternReference[i];

      // Проверяем, есть ли такое соединение у пользователя (в любом порядке)
      let connectionExists = false;
      for (let j = 0; j < userConnections.length; j++) {
        const [ua, ub] = userConnections[j];
        if ((ua === a && ub === b) || (ua === b && ub === a)) {
          connectionExists = true;
          break;
        }
      }

      // Если соединение ещё не проведено и одна из его точек - активная
      if (!connectionExists && activePoint === a) {
        return b;
      }
      if (!connectionExists && activePoint === b) {
        return a;
      }
    }
    return null; // Не нашли подходящего соединения от активной точки
  }

  // Если активная точка не выбрана - ищем первое непройденное соединение,
  // которое начинается со startPoint или соединяется с уже пройденными точками
  const usedPoints = new Set();
  for (let i = 0; i < userConnections.length; i++) {
    const [a, b] = userConnections[i];
    usedPoints.add(a);
    usedPoints.add(b);
  }
  // startPoint всегда считается использованной
  if (patternStartPoint !== null) {
    usedPoints.add(patternStartPoint);
  }

  for (let i = 0; i < patternReference.length; i++) {
    const [a, b] = patternReference[i];

    // Проверяем, есть ли такое соединение у пользователя
    let connectionExists = false;
    for (let j = 0; j < userConnections.length; j++) {
      const [ua, ub] = userConnections[j];
      if ((ua === a && ub === b) || (ua === b && ub === a)) {
        connectionExists = true;
        break;
      }
    }

    if (!connectionExists) {
      // Если одно из конечных точек уже использовано - подсвечиваем другую
      if (usedPoints.has(a)) return b;
      if (usedPoints.has(b)) return a;
    }
  }

  // Если ничего не нашли - возвращаем startPoint как первую цель
  return patternStartPoint;
}

function checkPatternCompletion() {
  // Проверяет, завершен ли узор
  // Все соединения пользователя должны совпадать с эталонным узором

  if (userConnections.length !== patternReference.length) {
    return false; // Разное количество соединений
  }

  // Проверяем, что каждое соединение пользователя есть в эталоне
  for (let i = 0; i < userConnections.length; i++) {
    const [startIdx, endIdx] = userConnections[i];
    if (!isValidConnection(startIdx, endIdx)) {
      return false; // Соединение не совпадает
    }
  }

  // Проверяем, что каждое соединение из эталона есть у пользователя
  for (let i = 0; i < patternReference.length; i++) {
    const [a, b] = patternReference[i];
    let found = false;

    for (let j = 0; j < userConnections.length; j++) {
      const [startIdx, endIdx] = userConnections[j];
      if (
        (a === startIdx && b === endIdx) ||
        (a === endIdx && b === startIdx)
      ) {
        found = true;
        break;
      }
    }

    if (!found) {
      return false; // Не хватает соединения
    }
  }

  return true; // Все соединения совпадают
}

function startDrawingPatternDots(e) {
  e.preventDefault();

  if (exerciseCompleted) return;

  const pos = getPosition(e);
  const pointIdx = getPointAtPosition(pos.x, pos.y);

  if (pointIdx !== null) {
    activePoint = pointIdx;
    tempLine = null;

    // Перерисовываем холст
    clearCanvas();
    drawPatternDots();
  }
}

function drawPatternDotsWithCheck(pos) {
  if (activePoint === null) return;

  // Обновляем временную линию
  tempLine = { x: pos.x, y: pos.y };

  // Перерисовываем холст
  clearCanvas();
  drawPatternDots();
}

function stopDrawingPatternDots(e) {
  if (activePoint === null) return;
  e.preventDefault();

  // ✅ ОБЪЯВЛЯЕМ savedActivePoint ПЕРЕД использованием
  const savedActivePoint = activePoint;

  const pos = getPosition(e);
  const endPointIdx = getPointAtPosition(pos.x, pos.y);

  // Линия фиксируется только если палец находится рядом с точкой
  if (endPointIdx !== null && endPointIdx !== savedActivePoint) {
    // Проверяем, валидно ли это соединение
    if (isValidConnection(savedActivePoint, endPointIdx)) {
      // Проверяем, не добавлено ли уже это соединение
      let alreadyExists = false;
      for (let i = 0; i < userConnections.length; i++) {
        const [a, b] = userConnections[i];
        if (
          (a === savedActivePoint && b === endPointIdx) ||
          (a === endPointIdx && b === savedActivePoint)
        ) {
          alreadyExists = true;
          break;
        }
      }

      if (!alreadyExists) {
        // Добавляем соединение
        userConnections.push([savedActivePoint, endPointIdx]);

        // Проверяем, завершен ли узор (все 8 сегментов)
        if (checkPatternCompletion()) {
          completePatternDotsExercise();
        } else {
          // Показываем успех для этого соединения
          showPatternFeedback("✓ Правильно!");
        }
      } else {
        showPatternFeedback("⚠️ Уже соединено!");
      }
    } else {
      showPatternFeedback("✗ Неправильно!");
    }
  }

  // Сбрасываем активную точку
  activePoint = null;
  tempLine = null;

  // Перерисовываем холст
  clearCanvas();
  drawPatternDots();
}

function showPatternFeedback(message) {
  const feedback = document.getElementById("feedback");
  feedback.textContent = message;
  feedback.className = "feedback success";
  feedback.classList.remove("hidden");

  // Скрываем через 1.5 секунды
  setTimeout(() => {
    feedback.classList.add("hidden");
  }, 1500);
}

// Универсальная функция обратной связи (для модуля "Найди и повтори")
function showFeedback(message, type = "success") {
  const feedback = document.getElementById("feedback");
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
  feedback.classList.remove("hidden");
  setTimeout(() => feedback.classList.add("hidden"), 2000);
}

function completePatternDotsExercise() {
  exerciseCompleted = true;
  const feedback = document.getElementById("feedback");
  feedback.textContent = "🎉 Отлично! Узор готов!";
  feedback.className = "feedback success";
  feedback.classList.remove("hidden");

  // Показываем кнопку "Дальше" (для ручного перехода, если авто не сработает)
  document.getElementById("next-level-btn").classList.remove("hidden");

  // Обновляем статистику
  const endTime = Date.now();
  stats.successfulExercises++;
  stats.totalTime += endTime - startTime;
  saveStats();

  // ✅ АВТОМАТИЧЕСКИЙ ПЕРЕХОД к следующему упражнению через 1.5 секунды
  setTimeout(() => {
    nextExercise();
  }, 1500);
}

// Остальные шаблоны (для других модулей)
function drawLineGuide() {
  const y = canvas.height / 2;
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(50, y);
  ctx.lineTo(canvas.width - 50, y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPath() {
  const startY = canvas.height / 2;
  const width = canvas.width - 100;

  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 60;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(50, startY);
  ctx.lineTo(canvas.width - 50, startY);
  ctx.stroke();

  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(50, startY);
  ctx.lineTo(canvas.width - 50, startY);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawWaveGuide() {
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(50, canvas.height / 2);

  for (let x = 50; x < canvas.width - 50; x += 20) {
    const y = canvas.height / 2 + Math.sin(x / 30) * 40;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawLinesTemplate() {
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  for (let i = 0; i < 5; i++) {
    const x = 80 + i * 80;
    ctx.beginPath();
    ctx.moveTo(x, 100);
    ctx.lineTo(x, 250);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawOvalsTemplate() {
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  for (let i = 0; i < 4; i++) {
    const x = 80 + i * 100;
    const y = canvas.height / 2;
    ctx.beginPath();
    ctx.ellipse(x, y, 40, 20, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawPatternTemplate() {
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  // Рисуем образец узора
  const startX = 50;
  const y = canvas.height / 2;

  for (let i = 0; i < 3; i++) {
    const x = startX + i * 60;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 30);
    ctx.arc(x + 15, y - 30, 15, Math.PI, 0);
    ctx.lineTo(x + 30, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawCopyTemplate() {
  const y = canvas.height / 2;
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  // Левая половина - образец
  ctx.beginPath();
  ctx.arc(100, y, 40, 0, Math.PI * 2);
  ctx.stroke();

  // Правая половина - для копирования
  ctx.strokeStyle = "#667eea";
  ctx.beginPath();
  ctx.arc(canvas.width - 100, y, 40, 0, Math.PI, true);
  ctx.stroke();

  ctx.setLineDash([]);
}

function drawGrid() {
  const gridSize = 40;
  const startX = 50;
  const startY = 50;

  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;

  // Вертикальные линии
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.moveTo(startX + i * gridSize, startY);
    ctx.lineTo(startX + i * gridSize, startY + 8 * gridSize);
    ctx.stroke();
  }

  // Горизонтальные линии
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(startX, startY + i * gridSize);
    ctx.lineTo(startX + 9 * gridSize, startY + i * gridSize);
    ctx.stroke();
  }
}

function drawDefaultTemplate() {
  ctx.fillStyle = "#667eea";
  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Упражнение в разработке", canvas.width / 2, canvas.height / 2);
}

// ============================================
// Модуль 7: Запретный цвет: ЗАПРЕТНЫЙ ЦВЕТ
// ============================================
function drawForbiddenColorTemplate() {
  // Рисуем желтые (запретные)
  ctx.fillStyle = "#FFEB3B";
  ctx.strokeStyle = "#FBC02D";
  ctx.lineWidth = 3;
  for (let island of currentExercise.yellowIslands) {
    ctx.beginPath();
    ctx.arc(island.x, island.y, island.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Крестик внутри
    ctx.strokeStyle = "#D32F2F";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(island.x - 10, island.y - 10);
    ctx.lineTo(island.x + 10, island.y + 10);
    ctx.moveTo(island.x + 10, island.y - 10);
    ctx.lineTo(island.x - 10, island.y + 10);
    ctx.stroke();
  }

  // Рисуем синие (цели)
  ctx.fillStyle = "#2196F3";
  ctx.strokeStyle = "#1976D2";
  ctx.lineWidth = 3;
  for (let island of currentExercise.blueIslands) {
    ctx.beginPath();
    ctx.arc(island.x, island.y, island.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawTrafficLightTemplate() {
  if (!trafficLightTimer && !exerciseCompleted) startTrafficLightCycle(); // Автозапуск
  const roadWidth = canvas.width * 0.6;
  const roadX = (canvas.width - roadWidth) / 2;
  ctx.fillStyle = "#e0e0e0";
  ctx.fillRect(roadX, 0, roadWidth, canvas.height);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.setLineDash([20, 15]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = "#bdbdbd";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(roadX, 0);
  ctx.lineTo(roadX, canvas.height);
  ctx.moveTo(roadX + roadWidth, 0);
  ctx.lineTo(roadX + roadWidth, canvas.height);
  ctx.stroke();

  const indX = canvas.width / 2,
    indY = 50,
    indR = 60;
  ctx.fillStyle = "#424242";
  ctx.beginPath();
  ctx.arc(indX, indY, indR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = trafficLightState === "green" ? "#4caf50" : "#f44336";
  ctx.beginPath();
  ctx.arc(indX, indY, indR - 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    trafficLightState === "green" ? "МОЖНО" : "СТОП",
    indX,
    indY + 50
  );

  ctx.fillStyle = "#4caf50";
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height - 40, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#333";
  ctx.font = "bold 14px Arial";
  ctx.fillText("СТАРТ", canvas.width / 2, canvas.height - 15);
  ctx.strokeStyle = "#ff9800";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, 40, 15, 0, Math.PI * 2);
  ctx.stroke();
}

function startTrafficLightCycle() {
  if (trafficLightTimer) clearTimeout(trafficLightTimer);
  const duration = 1500 + Math.random() * 1500;
  trafficLightTimer = setTimeout(() => {
    if (exerciseCompleted) return;
    trafficLightState = trafficLightState === "green" ? "red" : "green";
    if (trafficLightState === "red") {
      redStartTime = Date.now(); // Запоминаем момент смены сигнала
      lastRedPos = null;
    }
    if (canvas && ctx) {
      const savedPath = [...userPath];
      clearCanvas();
      if (savedPath.length > 0) {
        ctx.strokeStyle = "#4fc3f7";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(savedPath[0].x, savedPath[0].y);
        for (let i = 1; i < savedPath.length; i++)
          ctx.lineTo(savedPath[i].x, savedPath[i].y);
        ctx.stroke();
      }
    }
    startTrafficLightCycle();
  }, duration);
}

function checkTrafficLightViolation(pos) {
  if (trafficLightState === "red" && isDrawing) {
    if (Date.now() - redStartTime < 1000) return;
    if (lastRedPos) {
      const dist = Math.hypot(pos.x - lastRedPos.x, pos.y - lastRedPos.y);
      if (dist < RED_TOLERANCE) return;
    }
    lastRedPos = pos;
    trafficViolations++;
    const feedback = document.getElementById("feedback");
    feedback.textContent = `⚠️ Нарушение! (${trafficViolations}/3)`;
    feedback.className = "feedback error";
    feedback.classList.remove("hidden");
    vibrateDevice();
    ctx.strokeStyle = "#f44336";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pos.x - 10, pos.y - 10);
    ctx.lineTo(pos.x + 10, pos.y + 10);
    ctx.moveTo(pos.x + 10, pos.y - 10);
    ctx.lineTo(pos.x - 10, pos.y + 10);
    ctx.stroke();
    if (trafficViolations >= 3) {
      isDrawing = false;
      exerciseCompleted = false;
      feedback.textContent = "❌ Много нарушений! Попробуй ещё раз.";
      feedback.className = "feedback error";
      feedback.classList.remove("hidden");
      setTimeout(() => {
        clearCanvas();
        drawExerciseTemplate(currentExercise);
        userPath = [];
        trafficViolations = 0;
        startZoneReached = false;
        feedback.classList.add("hidden");
      }, 1500);
    }
    setTimeout(() => feedback.classList.add("hidden"), 2000);
  }
}

// Обработка касания для этого упражнения
function handleForbiddenColorTouch(e) {
  e.preventDefault();
  const pos = getPosition(e);

  // Проверка: коснулись ли желтого?
  for (let island of currentExercise.yellowIslands) {
    const dist = Math.hypot(pos.x - island.x, pos.y - island.y);
    if (dist < island.r) {
      // ОШИБКА!
      vibrateDevice();
      const feedback = document.getElementById("feedback");
      feedback.textContent = "⚠️ Нельзя касаться желтых! Попробуй снова";
      feedback.className = "feedback error";
      feedback.classList.remove("hidden");
      setTimeout(() => {
        feedback.classList.add("hidden");
        // Перегенерируем уровень при ошибке
        generateForbiddenColorIslands();
        clearCanvas();
        drawExerciseTemplate(currentExercise);
      }, 1500);
      return;
    }
  }
}

// Проверка: является ли пиксель "запретным" цветом
function isForbiddenColor(r, g, b, targetColor, tolerance = 30) {
  return (
    Math.abs(r - targetColor.r) < tolerance &&
    Math.abs(g - targetColor.g) < tolerance &&
    Math.abs(b - targetColor.b) < tolerance
  );
}

// Проверка пути на пересечение с запретными зонами
function checkForbiddenPath(pos) {
  try {
    const imageData = ctx.getImageData(
      Math.floor(pos.x),
      Math.floor(pos.y),
      1,
      1
    ).data;

    const r = imageData[0],
      g = imageData[1],
      b = imageData[2];
    return isForbiddenColor(r, g, b, currentExercise.forbiddenColor);
  } catch (e) {
    // Если координаты вне холста — считаем безопасным
    return false;
  }
}

// Начало рисования для "Запретного цвета"
function startDrawingForbiddenColor(e) {
  e.preventDefault();
  if (exerciseCompleted) return;
  const pos = getPosition(e);
  let nearBlueIsland = false;

  for (const island of currentExercise.blueIslands) {
    // ИСПРАВЛЕНИЕ: не умножаем на canvas.width, так как x уже в пикселях
    const islandCenterX = island.x;
    const islandCenterY = island.y;

    const dist = Math.sqrt(
      Math.pow(pos.x - islandCenterX, 2) + Math.pow(pos.y - islandCenterY, 2)
    );

    if (dist <= island.r + 20) {
      nearBlueIsland = true;
      break;
    }
  }

  if (!nearBlueIsland) {
    showForbiddenColorError("Начни от синего островка!");
    return;
  }

  isDrawing = true;
  userPath = [pos];
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.strokeStyle = "#4caf50";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function startDrawingTrafficLight(e) {
  e.preventDefault();
  if (exerciseCompleted) return;
  const pos = getPosition(e);
  const roadWidth = canvas.width * 0.6;
  const roadX = (canvas.width - roadWidth) / 2;
  const isOnRoad =
    pos.x > roadX &&
    pos.x < roadX + roadWidth &&
    pos.y > 50 &&
    pos.y < canvas.height - 20;
  if (!isOnRoad) return;

  if (pos.y > canvas.height - 100 && !startZoneReached) {
    startZoneReached = true;
    isDrawing = true;
    userPath = [pos];
    lastTrafficCheckPos = pos;
    trafficViolations = 0;
    lastRedPos = null;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = "#4fc3f7";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    if (!trafficLightTimer) startTrafficLightCycle();
  } else if (startZoneReached && !exerciseCompleted) {
    isDrawing = true;
    userPath.push(pos);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = "#4fc3f7";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
  }
}

// Рисование с проверкой на запретный цвет
function drawForbiddenColorWithCheck(pos) {
  if (!isDrawing) return;

  userPath.push(pos);

  // === ПРОВЕРКА НА ЗАПРЕТНЫЙ ЦВЕТ ===
  if (checkForbiddenPath(pos)) {
    // Касание жёлтого — ошибка!
    ctx.strokeStyle = "#ff5252"; // Красный
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    isDrawing = false;
    ctx.closePath();

    showForbiddenColorError("⚠️ Касание запретного цвета! Попробуй снова");
    vibrateDevice();

    // Сброс через 1.5 сек
    setTimeout(() => {
      clearCanvas();
      drawForbiddenColorTemplate();
      userPath = [];
    }, 1500);
    return;
  }

  // === Рисуем путь ===
  ctx.strokeStyle = "#4caf50";
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();

  // === Проверка: прошли ли мы через все синие островки ===
  checkForbiddenColorCompletion();
}

// Проверка завершения: все ли синие островки посещены
function checkForbiddenColorCompletion() {
  let visitedCount = 0;

  for (let island of currentExercise.blueIslands) {
    // ОСТАНОВИТЕСЬ: island.x уже в пикселях, не умножаем на canvas.width!
    const x = island.x;
    const y = island.y;

    // Проверяем, касался ли пользователь этого островка
    for (let pos of userPath) {
      if (Math.hypot(pos.x - x, pos.y - y) <= island.r + 12) {
        visitedCount++;
        break; // Переходим к следующему островку
      }
    }
  }

  // Если посещены ВСЕ синие островки и линия достаточно длинная
  if (
    visitedCount === currentExercise.blueIslands.length &&
    userPath.length > 15
  ) {
    completeForbiddenColor();
  }
}

// Завершение упражнения
function completeForbiddenColor() {
  exerciseCompleted = true;
  isDrawing = false;

  const feedback = document.getElementById("feedback");
  feedback.textContent =
    "🎉 Отлично! Ты соединил все островки, не задев запретные!";
  feedback.className = "feedback success";
  feedback.classList.remove("hidden");

  document.getElementById("next-level-btn").classList.remove("hidden");

  setTimeout(() => {
    nextExercise();
  }, 2000);
}

// Ошибка для "Запретного цвета"
function showForbiddenColorError(message) {
  const feedback = document.getElementById("feedback");
  feedback.textContent = message;
  feedback.className = "feedback error";
  feedback.classList.remove("hidden");

  setTimeout(() => {
    feedback.classList.add("hidden");
  }, 2000);
}

// Генерация случайных островков для "Запретного цвета"
function generateForbiddenColorIslands() {
  const padding = 50;
  const minDist = 60; // Минимальное расстояние между центрами

  // Очищаем старые данные
  currentExercise.blueIslands = [];
  currentExercise.yellowIslands = [];

  // 1. Генерируем синие (цели) - от 3 до 4 штук
  const countBlue = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < countBlue; i++) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
      const r = 20 + Math.random() * 10;
      const x =
        padding + r + Math.random() * (canvas.width - 2 * padding - 2 * r);
      const y =
        padding + r + Math.random() * (canvas.height - 2 * padding - 2 * r);

      // Проверка на наложение
      let overlap = false;
      const allIslands = [
        ...currentExercise.blueIslands,
        ...currentExercise.yellowIslands
      ];
      for (let item of allIslands) {
        const dist = Math.hypot(x - item.x, y - item.y);
        if (dist < r + item.r + minDist) {
          overlap = true;
          break;
        }
      }

      if (!overlap) {
        currentExercise.blueIslands.push({ x, y, r });
        placed = true;
      }
      attempts++;
    }
  }

  // 2. Генерируем желтые (препятствия) - от 2 до 3 штук
  const countYellow = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < countYellow; i++) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
      const r = 25 + Math.random() * 10;
      const x =
        padding + r + Math.random() * (canvas.width - 2 * padding - 2 * r);
      const y =
        padding + r + Math.random() * (canvas.height - 2 * padding - 2 * r);

      let overlap = false;
      const allIslands = [
        ...currentExercise.blueIslands,
        ...currentExercise.yellowIslands
      ];
      for (let item of allIslands) {
        const dist = Math.hypot(x - item.x, y - item.y);
        if (dist < r + item.r + minDist) {
          overlap = true;
          break;
        }
      }

      if (!overlap) {
        currentExercise.yellowIslands.push({ x, y, r });
        placed = true;
      }
      attempts++;
    }
  }
}

// ============================================ КОНЕЦ МОДУЛЬ 7 ============================================ //

// ============================================
// МОДУЛЬ 6: ГРАФИЧЕСКИЕ ДИКТАНТЫ
// ============================================

// Рисование сетки для графических диктантов
function drawGridTemplate() {
  // Вычисляем размер клетки адаптивно (минимум 10 клеток по ширине, максимум 25 для больших фигур)
  gridSize = Math.min(25, Math.floor(canvas.width / 10));

  // Вычисляем количество клеток по горизонтали и вертикали
  const gridCols = Math.floor(canvas.width / gridSize);
  const gridRows = Math.floor(canvas.height / gridSize);

  // Центрируем сетку
  const totalGridWidth = gridCols * gridSize;
  const totalGridHeight = gridRows * gridSize;
  gridStartX = (canvas.width - totalGridWidth) / 2;
  gridStartY = (canvas.height - totalGridHeight) / 2;

  // Для grid-mountain, grid-snake и grid-heart заливаем весь холст светло-зеленым
  if (
    currentExercise &&
    (currentExercise.type === "grid-mountain" ||
      currentExercise.type === "grid-snake" ||
      currentExercise.type === "grid-heart")
  ) {
    ctx.fillStyle = "#f0fff0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Рисуем фон сетки (светло-зеленый как в школьной тетради)
  ctx.fillStyle = "#e8f5e9";
  ctx.fillRect(gridStartX, gridStartY, totalGridWidth, totalGridHeight);

  // Рисуем линии сетки
  if (
    currentExercise &&
    (currentExercise.type === "grid-mountain" ||
      currentExercise.type === "grid-snake" ||
      currentExercise.type === "grid-heart")
  ) {
    ctx.strokeStyle = "#b2dfb2";
    ctx.lineWidth = 1;
  } else {
    ctx.strokeStyle = "#c8e6c9";
    ctx.lineWidth = 1;
  }

  // Вертикальные линии
  for (let i = 0; i <= gridCols; i++) {
    const x = gridStartX + i * gridSize;
    ctx.beginPath();
    ctx.moveTo(x, gridStartY);
    ctx.lineTo(x, gridStartY + totalGridHeight);
    ctx.stroke();
  }

  // Горизонтальные линии
  for (let i = 0; i <= gridRows; i++) {
    const y = gridStartY + i * gridSize;
    ctx.beginPath();
    ctx.moveTo(gridStartX, y);
    ctx.lineTo(gridStartX + totalGridWidth, y);
    ctx.stroke();
  }

  // Устанавливаем стартовую позицию
  if (currentExercise && currentExercise.type === "grid-mountain") {
    // Для горки - 1 клетка от левого края, 80% от верха
    currentGridX = 1;
    currentGridY = Math.floor(gridRows * 0.8);
  } else if (currentExercise && currentExercise.type === "grid-snake") {
    // Различаем упражнения типа grid-snake по названию
    if (currentExercise.title === "Цифровая змейка") {
      // Траектория: 1 вправо → 1 вверх → 2 вправо → 1 вниз → 1 вправо → 2 вверх → 1 вправо → 2 вниз
      // Максимальные смещения: вправо = 5, вверх = 2, вниз = 1 (итоговое смещение)
      const maxRight = 5; // суммарное движение вправо
      const maxUp = 2; // максимальное движение вверх от стартовой точки
      const maxDown = 1; // итоговое смещение вниз от стартовой точки

      // Стартовая позиция: достаточно места справа и сверху/снизу
      currentGridX = Math.max(2, Math.floor(gridCols * 0.25)); // 25% от левого края, минимум 2 клетки
      currentGridY = Math.floor(gridRows * 0.4); // 40% от верха (ближе к верху, так как больше движений вверх)

      // Проверяем, что змейка поместится
      if (currentGridX + maxRight >= gridCols) {
        currentGridX = gridCols - maxRight - 1;
      }
      if (currentGridY - maxUp < 0) {
        currentGridY = maxUp + 1;
      }
      if (currentGridY + maxDown >= gridRows) {
        currentGridY = gridRows - maxDown - 1;
      }
    } else if (currentExercise.title === "Волшебный цилиндр") {
      // Траектория: 1→, 3↑, 2→, 3↓, 1→, 1↓, 4←, 1↑
      // Максимальные смещения: вправо = 4, вверх = 3, вниз = 4 (промежуточное)
      // Итоговые размеры фигуры: ширина = 4, высота = 4 (с учетом промежуточных позиций)
      const figureWidth = 4; // максимальная ширина фигуры
      const figureHeight = 4; // максимальная высота фигуры

      // Центрируем фигуру на экране
      currentGridX = Math.floor((gridCols - figureWidth) / 2);
      currentGridY = Math.floor((gridRows - figureHeight) / 2) + 3; // +3 чтобы начать снизу фигуры

      // Проверяем границы
      if (currentGridX < 0) currentGridX = 0;
      if (currentGridY < 3) currentGridY = 3;
      if (currentGridX + figureWidth >= gridCols) {
        currentGridX = gridCols - figureWidth - 1;
      }
      if (currentGridY + 1 >= gridRows) {
        currentGridY = gridRows - 2;
      }
    } else {
      // Для других упражнений grid-snake - используем логику змейки
      const maxRight = 5;
      const maxUp = 2;
      const maxDown = 1;

      currentGridX = Math.max(2, Math.floor(gridCols * 0.25));
      currentGridY = Math.floor(gridRows * 0.4);

      if (currentGridX + maxRight >= gridCols) {
        currentGridX = gridCols - maxRight - 1;
      }
      if (currentGridY - maxUp < 0) {
        currentGridY = maxUp + 1;
      }
      if (currentGridY + maxDown >= gridRows) {
        currentGridY = gridRows - maxDown - 1;
      }
    }
  } else if (currentExercise && currentExercise.type === "grid-heart") {
    // Для сердечка - рассчитываем стартовую позицию для фигуры 7x7
    // Траектория сердечка требует достаточно места во всех направлениях
    const figureWidth = 7; // максимальная ширина сердечка
    const figureHeight = 7; // максимальная высота сердечка

    // Устанавливаем стартовую позицию: 3 клетки левее центра, 2 клетки выше центра
    currentGridX = Math.floor(gridCols / 2) - 3;
    currentGridY = Math.floor(gridRows / 2) - 2;

    // Проверяем границы, чтобы координаты не были меньше 1
    if (currentGridX < 1) currentGridX = 1;
    if (currentGridY < 1) currentGridY = 1;
    if (currentGridX + figureWidth >= gridCols) {
      currentGridX = gridCols - figureWidth - 1;
    }
    if (currentGridY + figureHeight >= gridRows) {
      currentGridY = gridRows - figureHeight - 1;
    }
  } else {
    // Для остальных упражнений - в центре сетки
    currentGridX = Math.floor(gridCols / 2);
    currentGridY = Math.floor(gridRows / 2);
  }

  // Очищаем путь пользователя
  gridPath = [];
  userSequence = [];

  // Добавляем стартовую точку в путь
  const startPixelX = gridStartX + currentGridX * gridSize + gridSize / 2;
  const startPixelY = gridStartY + currentGridY * gridSize + gridSize / 2;
  gridPath.push({ x: startPixelX, y: startPixelY });

  // Для grid-snake НЕ рисуем подсветку целевых клеток (усложнение задачи)
  // Ребенок должен видеть только пустую сетку и стартовую точку

  // Рисуем стартовую точку
  drawGridStartPoint();
}

// Рисование стартовой точки
function drawGridStartPoint() {
  const startPixelX = gridStartX + currentGridX * gridSize + gridSize / 2;
  const startPixelY = gridStartY + currentGridY * gridSize + gridSize / 2;

  // Жирная черная точка
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(startPixelX, startPixelY, 8, 0, Math.PI * 2);
  ctx.fill();

  // Белый центр для контраста
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(startPixelX, startPixelY, 4, 0, Math.PI * 2);
  ctx.fill();
}

// Рисование подсветки целевых клеток для змейки
function drawSnakeTargetCells() {
  if (!currentExercise || currentExercise.type !== "grid-snake") return;

  // Симулируем путь змейки для подсветки целевых клеток
  let tempX = currentGridX;
  let tempY = currentGridY;

  // Рисуем светло-зеленую подсветку для каждой целевой клетки
  ctx.fillStyle = "rgba(144, 238, 144, 0.4)"; // Светло-зеленый с прозрачностью

  // Подсвечиваем стартовую клетку
  const startCellX = gridStartX + tempX * gridSize;
  const startCellY = gridStartY + tempY * gridSize;
  ctx.fillRect(startCellX + 1, startCellY + 1, gridSize - 2, gridSize - 2);

  // Проходим по всей траектории и подсвечиваем каждую клетку
  for (let i = 0; i < targetSequence.length; i++) {
    const direction = targetSequence[i];

    // Вычисляем следующую позицию
    switch (direction) {
      case "up":
        tempY--;
        break;
      case "down":
        tempY++;
        break;
      case "left":
        tempX--;
        break;
      case "right":
        tempX++;
        break;
    }

    // Подсвечиваем целевую клетку
    const cellX = gridStartX + tempX * gridSize;
    const cellY = gridStartY + tempY * gridSize;
    ctx.fillRect(cellX + 1, cellY + 1, gridSize - 2, gridSize - 2);
  }
}

// Движение в указанном направлении
function moveDirection(direction) {
  if (exerciseCompleted) return;

  // Проверяем, не превышен ли лимит шагов
  if (userSequence.length >= targetSequence.length) {
    return;
  }

  // Проверяем правильность шага
  const expectedDirection = targetSequence[userSequence.length];
  if (direction !== expectedDirection) {
    // Неправильный шаг - показываем специальное сообщение для разных типов упражнений
    if (currentExercise && currentExercise.type === "grid-mountain") {
      showGridMountainError();
    } else if (
      currentExercise &&
      (currentExercise.type === "grid-snake" ||
        currentExercise.type === "grid-heart")
    ) {
      showGridError();
    } else {
      showGridError();
    }
    return;
  }

  // Сохраняем текущую позицию
  const oldX = currentGridX;
  const oldY = currentGridY;

  // Вычисляем новую позицию
  let newX = currentGridX;
  let newY = currentGridY;

  switch (direction) {
    case "up":
      newY--;
      break;
    case "down":
      newY++;
      break;
    case "left":
      newX--;
      break;
    case "right":
      newX++;
      break;
  }

  // Проверяем границы сетки
  const gridCols = Math.floor(canvas.width / gridSize);
  const gridRows = Math.floor(canvas.height / gridSize);

  if (newX < 0 || newX >= gridCols || newY < 0 || newY >= gridRows) {
    // Выход за границы сетки
    showGridError();
    return;
  }

  // Обновляем позицию
  currentGridX = newX;
  currentGridY = newY;

  // Добавляем шаг в последовательность пользователя
  userSequence.push(direction);

  // Рисуем линию от старой позиции к новой
  drawGridLine(oldX, oldY, newX, newY);

  // Добавляем новую точку в путь
  const newPixelX = gridStartX + newX * gridSize + gridSize / 2;
  const newPixelY = gridStartY + newY * gridSize + gridSize / 2;
  gridPath.push({ x: newPixelX, y: newPixelY });

  // Обновляем счетчик шагов
  document.getElementById("current-step").textContent =
    userSequence.length.toString();

  // Проверяем завершение упражнения
  if (userSequence.length === targetSequence.length) {
    completeGridExercise();
  }
}

// Рисование линии между клетками
function drawGridLine(fromX, fromY, toX, toY) {
  const fromPixelX = gridStartX + fromX * gridSize + gridSize / 2;
  const fromPixelY = gridStartY + fromY * gridSize + gridSize / 2;
  const toPixelX = gridStartX + toX * gridSize + gridSize / 2;
  const toPixelY = gridStartY + toY * gridSize + gridSize / 2;

  // Жирная черная линия
  ctx.strokeStyle = "#000000";
  // Для grid-mountain используем толщину 3px, для остальных 4px
  if (currentExercise && currentExercise.type === "grid-mountain") {
    ctx.lineWidth = 3;
  } else {
    ctx.lineWidth = 4;
  }
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(fromPixelX, fromPixelY);
  ctx.lineTo(toPixelX, toPixelY);
  ctx.stroke();
}

// Показ ошибки для упражнения "Лесенка-горка"
function showGridMountainError() {
  const feedback = document.getElementById("feedback");
  feedback.textContent = "🎯 Сбился с ритма! Посмотри на схему еще раз";
  feedback.className = "feedback error";
  feedback.classList.remove("hidden");

  // Вибрация при ошибке
  vibrateDevice();

  // Через 2 секунды сбрасываем упражнение
  setTimeout(() => {
    resetGridExercise();
    feedback.classList.add("hidden");
  }, 2000);
}

// Показ ошибки
function showGridError() {
  const feedback = document.getElementById("feedback");
  feedback.textContent = "❌ Ой, не туда! Попробуй еще раз";
  feedback.className = "feedback error";
  feedback.classList.remove("hidden");

  // Вибрация при ошибке
  vibrateDevice();

  // Через 1.5 секунды сбрасываем упражнение
  setTimeout(() => {
    resetGridExercise();
    feedback.classList.add("hidden");
  }, 1500);
}

// Завершение упражнения
function completeGridExercise() {
  exerciseCompleted = true;

  const feedback = document.getElementById("feedback");

  // Специальные сообщения для разных упражнений
  let message = "🎉 Отлично! Фигура готова!";
  if (currentExercise && currentExercise.type === "grid-square") {
    message = "🎉 Квадрат готов! Отличная работа!";
  } else if (currentExercise && currentExercise.type === "grid-mountain") {
    message = "🏔 Гора покорена! Ты настоящий альпинист!";
  } else if (currentExercise && currentExercise.type === "grid-snake") {
    // Различаем упражнения типа grid-snake по названию
    if (currentExercise.title === "Цифровая змейка") {
      message = "🐍 Змейка готова! Отличная переключаемость внимания!";
    } else if (currentExercise.title === "Волшебный цилиндр") {
      message = "🎩 Алле-оп! Шляпа готова. Что спрятал там фокусник?";
    } else {
      message = "🐍 Змейка готова! Отличная переключаемость внимания!";
    }
  } else if (currentExercise && currentExercise.type === "grid-heart") {
    message =
      "❤️ Потрясающе! Ты нарисовал сердечко и успешно прошел весь модуль графических диктантов! Ты настоящий мастер!";
  } else if (currentExercise && currentExercise.type === "grid-triangle") {
    message = "🎉 Треугольник готов! Красивая крыша!";
  }

  feedback.textContent = message;
  feedback.className = "feedback";
  feedback.classList.remove("hidden");

  // Показываем кнопку "Дальше" для ручного перехода
  document.getElementById("next-level-btn").classList.remove("hidden");
}

// Сброс упражнения
function resetGridExercise() {
  if (exerciseCompleted) return;

  // Очищаем canvas и перерисовываем сетку
  clearCanvas();
  drawExerciseTemplate(currentExercise);

  // Сбрасываем состояние
  userSequence = [];
  gridPath = [];

  // Сбрасываем позицию в зависимости от типа упражнения
  const gridCols = Math.floor(canvas.width / gridSize);
  const gridRows = Math.floor(canvas.height / gridSize);

  if (currentExercise && currentExercise.type === "grid-mountain") {
    currentGridX = 1;
    currentGridY = Math.floor(gridRows * 0.8);
  } else if (currentExercise && currentExercise.type === "grid-snake") {
    // Различаем упражнения типа grid-snake по названию
    if (currentExercise.title === "Цифровая змейка") {
      // Траектория: 1 вправо → 1 вверх → 2 вправо → 1 вниз → 1 вправо → 2 вверх → 1 вправо → 2 вниз
      // Максимальные смещения: вправо = 5, вверх = 2, вниз = 1 (итоговое смещение)
      const maxRight = 5; // суммарное движение вправо
      const maxUp = 2; // максимальное движение вверх от стартовой точки
      const maxDown = 1; // итоговое смещение вниз от стартовой точки

      // Стартовая позиция: достаточно места справа и сверху/снизу
      currentGridX = Math.max(2, Math.floor(gridCols * 0.25)); // 25% от левого края, минимум 2 клетки
      currentGridY = Math.floor(gridRows * 0.4); // 40% от верха (ближе к верху, так как больше движений вверх)

      // Проверяем, что змейка поместится
      if (currentGridX + maxRight >= gridCols) {
        currentGridX = gridCols - maxRight - 1;
      }
      if (currentGridY - maxUp < 0) {
        currentGridY = maxUp + 1;
      }
      if (currentGridY + maxDown >= gridRows) {
        currentGridY = gridRows - maxDown - 1;
      }
    } else if (currentExercise.title === "Волшебный цилиндр") {
      // Траектория: 1→, 3↑, 2→, 3↓, 1→, 1↓, 4←, 1↑
      // Максимальные смещения: вправо = 4, вверх = 3, вниз = 4 (промежуточное)
      // Итоговые размеры фигуры: ширина = 4, высота = 4 (с учетом промежуточных позиций)
      const figureWidth = 4; // максимальная ширина фигуры
      const figureHeight = 4; // максимальная высота фигуры

      // Центрируем фигуру на экране
      currentGridX = Math.floor((gridCols - figureWidth) / 2);
      currentGridY = Math.floor((gridRows - figureHeight) / 2) + 3; // +3 чтобы начать снизу фигуры

      // Проверяем границы
      if (currentGridX < 0) currentGridX = 0;
      if (currentGridY < 3) currentGridY = 3;
      if (currentGridX + figureWidth >= gridCols) {
        currentGridX = gridCols - figureWidth - 1;
      }
      if (currentGridY + 1 >= gridRows) {
        currentGridY = gridRows - 2;
      }
    } else {
      // Для других упражнений grid-snake - используем логику змейки
      const maxRight = 5;
      const maxUp = 2;
      const maxDown = 1;

      currentGridX = Math.max(2, Math.floor(gridCols * 0.25));
      currentGridY = Math.floor(gridRows * 0.4);

      if (currentGridX + maxRight >= gridCols) {
        currentGridX = gridCols - maxRight - 1;
      }
      if (currentGridY - maxUp < 0) {
        currentGridY = maxUp + 1;
      }
      if (currentGridY + maxDown >= gridRows) {
        currentGridY = gridRows - maxDown - 1;
      }
    }
  } else if (currentExercise && currentExercise.type === "grid-heart") {
    // Для сердечка - рассчитываем стартовую позицию для фигуры 7x7
    // Траектория сердечка требует достаточно места во всех направлениях
    const figureWidth = 7; // максимальная ширина сердечка
    const figureHeight = 7; // максимальная высота сердечка

    // Устанавливаем стартовую позицию: 3 клетки левее центра, 2 клетки выше центра
    currentGridX = Math.floor(gridCols / 2) - 3;
    currentGridY = Math.floor(gridRows / 2) - 2;

    // Проверяем границы, чтобы координаты не были меньше 1
    if (currentGridX < 1) currentGridX = 1;
    if (currentGridY < 1) currentGridY = 1;
    if (currentGridX + figureWidth >= gridCols) {
      currentGridX = gridCols - figureWidth - 1;
    }
    if (currentGridY + figureHeight >= gridRows) {
      currentGridY = gridRows - figureHeight - 1;
    }
  } else {
    currentGridX = Math.floor(gridCols / 2);
    currentGridY = Math.floor(gridRows / 2);
  }

  // Управляем видимостью кнопки "Дальше" в зависимости от модуля
  if (currentModule === 6) {
    // В Модуле 6 (графические диктанты) кнопка "Дальше" всегда видна
    document.getElementById("next-level-btn").classList.remove("hidden");
  } else {
    // В других модулях скрываем кнопку "Дальше"
    document.getElementById("next-level-btn").classList.add("hidden");
  }

  // Обновляем счетчик
  document.getElementById("current-step").textContent = "0";
}
//=========================== НАЙДИ И ПОВТОРИ=====================
// ============================================
// УПРАЖНЕНИЕ: Распознавание фигур ($1 Recognizer)
// ============================================

// Генерация целевой фигуры
function generateGestureShape() {
  const shapes = ["circle", "square", "triangle"];
  return shapes[Math.floor(Math.random() * shapes.length)];
}

// Генерация трёх перекрывающихся фигур
function generateGestureShapes() {
  const colors = [
    "#FF5252",
    "#4FC3F7",
    "#69F0AE",
    "#FFD740",
    "#BA68C8",
    "#FF8A65"
  ];
  // Перемешиваем цвета (гарантия 3 разных)
  for (let i = colors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }

  const shapes = [];
  const halfW = canvas.width / 2;
  const halfH = canvas.height;

  // Перемешиваем типы фигур (круг, квадрат, треугольник)
  const types = [...SHAPE_TYPES_GESTURE];
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }

  // Центр кластера
  const clusterCx = halfW * 0.5;
  const clusterCy = halfH * 0.5;

  // ✅ УВЕЛИЧЕННЫЙ РАЗБРОС (акцент на вертикаль)
  const spreadX = halfW * 0.1; // Горизонтальный разброс
  const spreadY = halfH * 0.16; // Вертикальный разброс (увеличен)

  // Размер подбирается так, чтобы при таком разбросе фигуры ВСЕГДА накрывали центр кластера
  // и гарантированно пересекались между собой
  const size = halfW * (0.26 + Math.random() * 0.06);

  for (let i = 0; i < 3; i++) {
    const type = types[i];
    const color = colors[i];

    // Случайное смещение от центра кластера
    const cx = clusterCx + (Math.random() - 0.5) * 2 * spreadX;
    const cy = clusterCy + (Math.random() - 0.5) * 2 * spreadY;

    shapes.push({ type, color, size, cx, cy });
  }
  return shapes;
}

// Рисование одной фигуры (для шаблона с тремя фигурами)
function drawSingleShape(shape) {
  ctx.save();
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.beginPath();
  if (shape.type === "circle") {
    ctx.arc(shape.cx, shape.cy, shape.size, 0, Math.PI * 2);
  } else if (shape.type === "square") {
    ctx.rect(
      shape.cx - shape.size,
      shape.cy - shape.size,
      shape.size * 2,
      shape.size * 2
    );
  } else if (shape.type === "triangle") {
    const h = (shape.size * Math.sqrt(3)) / 2;
    ctx.moveTo(shape.cx, shape.cy - h * 0.66);
    ctx.lineTo(shape.cx + shape.size, shape.cy + h * 0.33);
    ctx.lineTo(shape.cx - shape.size, shape.cy + h * 0.33);
    ctx.closePath();
  }
  ctx.stroke(); // ✅ Только обводка, без fill()
  ctx.restore();
}

// Начало рисования для распознавания
function startDrawingGesture(e) {
  e.preventDefault();
  if (exerciseCompleted) return;

  const pos = getPosition(e);
  // Разрешаем рисовать только на правой половине
  if (pos.x < canvas.width / 2) {
    showFeedback("⚠️ Рисуй на правом поле!", "error");
    return;
  }

  isDrawing = true;
  userFilterPath = [{ X: pos.x, Y: pos.y }]; // Используем формат $1 Recognizer
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.strokeStyle = "#4fc3f7";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

// Рисование с конвертацией в формат $1
function drawGestureWithCheck(pos) {
  if (!isDrawing) return;

  // ✅ ЗАЩИТА: если массив пуст, выходим без ошибки
  if (!userFilterPath || userFilterPath.length === 0) return;
  // Проверка зоны рисования
  if (pos.x < canvas.width / 2) {
    ctx.strokeStyle = "#ff5252";
  } else {
    ctx.strokeStyle = "#4fc3f7";
  }

  // Добавляем точку только если расстояние достаточно (фильтр шума)
  const lastPoint = userFilterPath[userFilterPath.length - 1];
  if (Distance(lastPoint, { X: pos.x, Y: pos.y }) > 3) {
    userFilterPath.push({ X: pos.x, Y: pos.y });
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }
}

// Проверка завершения упражнения
function checkGestureCompletion() {
  if (userFilterPath.length < 10) return;

  // Распознаем фигуру
  const result = shapeRecognizer.recognize(userFilterPath);
  const targetShape = currentExercise.targetShape;
  const isCorrect = result.Name === targetShape && result.Score > 0.7;

  if (isCorrect) {
    // ✅ УСПЕХ
    exerciseCompleted = true;
    isDrawing = false;

    showFeedback(`✓ Отлично! Это ${SHAPE_NAMES_RU[targetShape]}!`, "success");

    // Обновляем статистику
    stats.successfulExercises++;
    stats.totalTime += Date.now() - startTime;
    saveStats();

    // Автоматический переход к следующему упражнению
    setTimeout(() => {
      nextExercise();
    }, 2000);
  } else {
    // ❌ ОШИБКА
    showFeedback(
      `⚠️ Это не ${SHAPE_NAMES_RU[targetShape]}! Попробуй снова`,
      "error"
    );

    // Сброс через 1.5 секунды
    setTimeout(() => {
      clearCanvas();
      drawExerciseTemplate(currentExercise);
      userFilterPath = [];
      isDrawing = false;
    }, 1500);
  }
}

// Шаблон упражнения
function drawGestureShapeTemplate() {
  const halfW = canvas.width / 2;
  // Фон: слева светло-серый (образец), справа белый (поле для рисования)
  ctx.fillStyle = "#f0f0f5";
  ctx.fillRect(0, 0, halfW, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(halfW, 0, halfW, canvas.height);

  // Разделительная линия
  ctx.strokeStyle = "#4caf50";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(halfW, 0);
  ctx.lineTo(halfW, canvas.height);
  ctx.stroke();

  // Рисуем ТРИ фигуры-отвлекающие слева
  if (currentExercise && currentExercise.shapes) {
    for (const shape of currentExercise.shapes) {
      drawSingleShape(shape);
    }
  }

  // Подсказка справа
  ctx.fillStyle = "#999";
  ctx.font = "24px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Нарисуй здесь", halfW + canvas.width / 4, canvas.height - 20);
}

// ============================================
// $1 UNISTROKE RECOGNIZER (для распознавания фигур)
// ============================================
function Point(x, y) {
  this.X = x;
  this.Y = y;
}
function Rectangle(x, y, w, h) {
  this.X = x;
  this.Y = y;
  this.Width = w;
  this.Height = h;
}
function GestureResult(name, score, time) {
  this.Name = name;
  this.Score = score;
  this.Time = time;
}

const NumPoints = 64,
  SquareSize = 250.0,
  Origin = new Point(0, 0);
const Diagonal = Math.sqrt(SquareSize * SquareSize + SquareSize * SquareSize);
const HalfDiagonal = 0.5 * Diagonal;
const AngleRange = Deg2Rad(45.0),
  AnglePrecision = Deg2Rad(2.0);
const Phi = 0.5 * (-1.0 + Math.sqrt(5.0));

function Resample(points, n) {
  const I = PathLength(points) / (n - 1);
  let D = 0.0;
  const newpoints = [new Point(points[0].X, points[0].Y)];
  const pts = points.map((p) => new Point(p.X, p.Y));
  for (let i = 1; i < pts.length; i++) {
    const d = Distance(pts[i - 1], pts[i]);
    if (D + d >= I) {
      const qx = pts[i - 1].X + ((I - D) / d) * (pts[i].X - pts[i - 1].X);
      const qy = pts[i - 1].Y + ((I - D) / d) * (pts[i].Y - pts[i - 1].Y);
      newpoints.push(new Point(qx, qy));
      pts.splice(i, 0, new Point(qx, qy));
      D = 0.0;
    } else D += d;
  }
  if (newpoints.length === n - 1)
    newpoints.push(new Point(pts[pts.length - 1].X, pts[pts.length - 1].Y));
  return newpoints;
}
function IndicativeAngle(points) {
  const c = Centroid(points);
  return Math.atan2(c.Y - points[0].Y, c.X - points[0].X);
}
function RotateBy(points, radians) {
  const c = Centroid(points),
    cos = Math.cos(radians),
    sin = Math.sin(radians),
    newpoints = [];
  for (const p of points) {
    const qx = (p.X - c.X) * cos - (p.Y - c.Y) * sin + c.X;
    const qy = (p.X - c.X) * sin + (p.Y - c.Y) * cos + c.Y;
    newpoints.push(new Point(qx, qy));
  }
  return newpoints;
}
function ScaleTo(points, size) {
  const B = BoundingBox(points),
    newpoints = [];
  for (const p of points)
    newpoints.push(new Point(p.X * (size / B.Width), p.Y * (size / B.Height)));
  return newpoints;
}
function TranslateTo(points, pt) {
  const c = Centroid(points),
    newpoints = [];
  for (const p of points)
    newpoints.push(new Point(p.X + pt.X - c.X, p.Y + pt.Y - c.Y));
  return newpoints;
}
function Centroid(points) {
  let x = 0,
    y = 0;
  for (const p of points) {
    x += p.X;
    y += p.Y;
  }
  return new Point(x / points.length, y / points.length);
}
function BoundingBox(points) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.X);
    maxX = Math.max(maxX, p.X);
    minY = Math.min(minY, p.Y);
    maxY = Math.max(maxY, p.Y);
  }
  return new Rectangle(minX, minY, maxX - minX, maxY - minY);
}
function PathDistance(pts1, pts2) {
  let d = 0;
  for (let i = 0; i < pts1.length; i++) d += Distance(pts1[i], pts2[i]);
  return d / pts1.length;
}
function PathLength(points) {
  let d = 0;
  for (let i = 1; i < points.length; i++)
    d += Distance(points[i - 1], points[i]);
  return d;
}
function Distance(p1, p2) {
  const dx = p2.X - p1.X,
    dy = p2.Y - p1.Y;
  return Math.sqrt(dx * dx + dy * dy);
}
function Deg2Rad(d) {
  return (d * Math.PI) / 180.0;
}
function DistanceAtBestAngle(points, template, a, b, threshold) {
  let x1 = Phi * a + (1 - Phi) * b,
    f1 = DistanceAtAngle(points, template, x1);
  let x2 = (1 - Phi) * a + Phi * b,
    f2 = DistanceAtAngle(points, template, x2);
  while (Math.abs(b - a) > threshold) {
    if (f1 < f2) {
      b = x2;
      x2 = x1;
      f2 = f1;
      x1 = Phi * a + (1 - Phi) * b;
      f1 = DistanceAtAngle(points, template, x1);
    } else {
      a = x1;
      x1 = x2;
      f1 = f2;
      x2 = (1 - Phi) * a + Phi * b;
      f2 = DistanceAtAngle(points, template, x2);
    }
  }
  return Math.min(f1, f2);
}
function DistanceAtAngle(points, template, radians) {
  return PathDistance(RotateBy(points, radians), template.Points);
}

function Unistroke(name, points) {
  this.Name = name;
  this.Points = Resample(points, NumPoints);
  const radians = IndicativeAngle(this.Points);
  this.Points = RotateBy(this.Points, -radians);
  this.Points = ScaleTo(this.Points, SquareSize);
  this.Points = TranslateTo(this.Points, Origin);
}

function DollarRecognizer() {
  this.templates = [];
  const self = this;
  this.addTemplate = function (name, points) {
    self.templates.push(new Unistroke(name, points));
  };
  this.recognize = function (points) {
    if (points.length < 10) return new GestureResult("Too few points", 0, 0);
    const candidate = new Unistroke("", points);
    let bestIdx = -1,
      bestDist = Infinity;
    for (let i = 0; i < self.templates.length; i++) {
      const d = DistanceAtBestAngle(
        candidate.Points,
        self.templates[i],
        -AngleRange,
        +AngleRange,
        AnglePrecision
      );
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const score = 1.0 - bestDist / HalfDiagonal;
    return new GestureResult(
      bestIdx === -1 ? "No match" : self.templates[bestIdx].Name,
      score,
      0
    );
  };

  // === ШАБЛОНЫ ФИГУР (с поддержкой обоих направлений) ===
  const circle = [
    new Point(127, 141),
    new Point(124, 140),
    new Point(120, 139),
    new Point(118, 139),
    new Point(116, 139),
    new Point(111, 140),
    new Point(109, 141),
    new Point(104, 144),
    new Point(100, 147),
    new Point(96, 152),
    new Point(93, 157),
    new Point(90, 163),
    new Point(87, 169),
    new Point(85, 175),
    new Point(83, 181),
    new Point(82, 190),
    new Point(82, 195),
    new Point(83, 200),
    new Point(84, 205),
    new Point(88, 213),
    new Point(91, 216),
    new Point(96, 219),
    new Point(103, 222),
    new Point(108, 224),
    new Point(111, 224),
    new Point(120, 224),
    new Point(133, 223),
    new Point(142, 222),
    new Point(152, 218),
    new Point(160, 214),
    new Point(167, 210),
    new Point(173, 204),
    new Point(178, 198),
    new Point(179, 196),
    new Point(182, 188),
    new Point(182, 177),
    new Point(178, 167),
    new Point(170, 150),
    new Point(163, 138),
    new Point(152, 130),
    new Point(143, 129),
    new Point(140, 131),
    new Point(129, 136),
    new Point(126, 139)
  ];
  this.addTemplate("circle", circle);
  this.addTemplate("circle", reversePoints(circle));

  const triangle = [
    new Point(137, 139),
    new Point(135, 141),
    new Point(133, 144),
    new Point(132, 146),
    new Point(130, 149),
    new Point(128, 151),
    new Point(126, 155),
    new Point(123, 160),
    new Point(120, 166),
    new Point(116, 171),
    new Point(112, 177),
    new Point(107, 183),
    new Point(102, 188),
    new Point(100, 191),
    new Point(95, 195),
    new Point(90, 199),
    new Point(86, 203),
    new Point(82, 206),
    new Point(80, 209),
    new Point(75, 213),
    new Point(73, 213),
    new Point(70, 216),
    new Point(67, 219),
    new Point(64, 221),
    new Point(61, 223),
    new Point(60, 225),
    new Point(62, 226),
    new Point(65, 225),
    new Point(67, 226),
    new Point(74, 226),
    new Point(77, 227),
    new Point(85, 229),
    new Point(91, 230),
    new Point(99, 231),
    new Point(108, 232),
    new Point(116, 233),
    new Point(125, 233),
    new Point(134, 234),
    new Point(145, 233),
    new Point(153, 232),
    new Point(160, 233),
    new Point(170, 234),
    new Point(177, 235),
    new Point(179, 236),
    new Point(186, 237),
    new Point(193, 238),
    new Point(198, 239),
    new Point(200, 237),
    new Point(202, 239),
    new Point(204, 238),
    new Point(206, 234),
    new Point(205, 230),
    new Point(202, 222),
    new Point(197, 216),
    new Point(192, 207),
    new Point(186, 198),
    new Point(179, 189),
    new Point(174, 183),
    new Point(170, 178),
    new Point(164, 171),
    new Point(161, 168),
    new Point(154, 160),
    new Point(148, 155),
    new Point(143, 150),
    new Point(138, 148),
    new Point(136, 148)
  ];
  this.addTemplate("triangle", triangle);
  this.addTemplate("triangle", reversePoints(triangle));

  const square = [
    new Point(78, 149),
    new Point(78, 153),
    new Point(78, 157),
    new Point(78, 160),
    new Point(79, 162),
    new Point(79, 164),
    new Point(79, 167),
    new Point(79, 169),
    new Point(79, 173),
    new Point(79, 178),
    new Point(79, 183),
    new Point(80, 189),
    new Point(80, 193),
    new Point(80, 198),
    new Point(80, 202),
    new Point(81, 208),
    new Point(81, 210),
    new Point(81, 216),
    new Point(82, 222),
    new Point(82, 224),
    new Point(82, 227),
    new Point(83, 229),
    new Point(83, 231),
    new Point(85, 230),
    new Point(88, 232),
    new Point(90, 233),
    new Point(92, 232),
    new Point(94, 233),
    new Point(99, 232),
    new Point(102, 233),
    new Point(106, 233),
    new Point(109, 234),
    new Point(117, 235),
    new Point(123, 236),
    new Point(126, 236),
    new Point(135, 237),
    new Point(142, 238),
    new Point(145, 238),
    new Point(152, 238),
    new Point(154, 239),
    new Point(165, 238),
    new Point(174, 237),
    new Point(179, 236),
    new Point(186, 235),
    new Point(191, 235),
    new Point(195, 233),
    new Point(197, 233),
    new Point(200, 233),
    new Point(201, 235),
    new Point(201, 233),
    new Point(199, 231),
    new Point(198, 226),
    new Point(198, 220),
    new Point(196, 207),
    new Point(195, 195),
    new Point(195, 181),
    new Point(195, 173),
    new Point(195, 163),
    new Point(194, 155),
    new Point(192, 145),
    new Point(192, 143),
    new Point(192, 138),
    new Point(191, 135),
    new Point(191, 133),
    new Point(191, 130),
    new Point(190, 128),
    new Point(188, 129),
    new Point(186, 129),
    new Point(181, 132),
    new Point(173, 131),
    new Point(162, 131),
    new Point(151, 132),
    new Point(149, 132),
    new Point(138, 132),
    new Point(136, 132),
    new Point(122, 131),
    new Point(120, 131),
    new Point(109, 130),
    new Point(107, 130),
    new Point(90, 132),
    new Point(81, 133),
    new Point(76, 133)
  ];
  this.addTemplate("square", square);
  this.addTemplate("square", reversePoints(square));
}
function reversePoints(points) {
  return points
    .slice()
    .reverse()
    .map((p) => new Point(p.X, p.Y));
}

// Глобальный экземпляр распознавателя
const shapeRecognizer = new DollarRecognizer();

// Вспомогательные функции для упражнения
const SHAPE_TYPES_GESTURE = ["circle", "square", "triangle"];
const SHAPE_EMOJI = { circle: "🔵", square: "🟦", triangle: "🔺" };
const SHAPE_NAMES_RU = {
  circle: "круг",
  square: "квадрат",
  triangle: "треугольник"
};

//	================ конец найди и повтори =====================

// ============================================
// УПРАЖНЕНИЕ: Волнистая дорожка (sine-corridor)
// ============================================

function startDrawingSineCorridor(e) {
  e.preventDefault();
  if (exerciseCompleted) return;
  const pos = getPosition(e);

  // Проверка зоны старта (сверху, между линиями)
  if (pos.y > 100) return;
  if (!currentExercise.corridorLeftX || !currentExercise.corridorRightX) return;
  if (
    pos.x < currentExercise.corridorLeftX ||
    pos.x > currentExercise.corridorRightX
  )
    return;

  isDrawing = true;
  userPath = [pos];
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function drawSineCorridorTemplate() {
  // 1. ПАРАМЕТРЫ СТРОКИ (узкой)
  const corridorWidth = canvas.width * 0.12; // 12% ширины экрана
  const startX = (canvas.width - corridorWidth) / 2;
  const endX = startX + corridorWidth;

  currentExercise.corridorLeftX = startX;
  currentExercise.corridorRightX = endX;
  currentExercise.finishY = canvas.height - 50;

  // === ВАЖНО: Сохраняем параметры для валидации ===
  currentExercise.sineStartY = 50;
  currentExercise.sineFrequency = 0.065;
  currentExercise.sineAmplitude = corridorWidth * 1.3; // > tolerance (25)
  currentExercise.sineCenterX = (startX + endX) / 2;
  // ============================================

  pathPoints = [];
  const startY = 50;
  const frequency = 0.065;
  const amplitude = corridorWidth * 1.3;
  const centerX = (startX + endX) / 2;

  for (let y = startY; y <= currentExercise.finishY; y += 5) {
    const x = centerX + Math.sin((y - startY) * frequency) * amplitude;
    pathPoints.push({ x: x, y: y });
  }

  // Отрисовка границ
  ctx.strokeStyle = "#a0a0a0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, 0);
  ctx.lineTo(startX, canvas.height);
  ctx.moveTo(endX, 0);
  ctx.lineTo(endX, canvas.height);
  ctx.stroke();

  // Отрисовка пунктира (2 петли)
  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.lineCap = "round";
  ctx.beginPath();

  if (pathPoints.length > 0) {
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    const twoCyclesY = startY + (4 * Math.PI) / frequency;
    for (let i = 1; i < pathPoints.length; i++) {
      if (pathPoints[i].y > twoCyclesY) break;
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Маркеры
  ctx.fillStyle = "#4caf50";
  ctx.beginPath();
  ctx.arc(centerX, startY, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 152, 0, 0.3)";
  ctx.beginPath();
  ctx.arc(centerX, currentExercise.finishY, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ff9800";
  ctx.beginPath();
  ctx.arc(centerX, currentExercise.finishY, 15, 0, Math.PI * 2);
  ctx.stroke();
}

function drawSineCorridorWithCheck(pos) {
  if (!isDrawing) return;

  // === ПРОВЕРКА ПО ФОРМУЛЕ СИНУСОИДЫ ===
  const startY = currentExercise.sineStartY;
  const freq = currentExercise.sineFrequency;
  const amp = currentExercise.sineAmplitude;
  const centerX = currentExercise.sineCenterX;

  // Вычисляем идеальную позицию по формуле
  const idealX = centerX + Math.sin((pos.y - startY) * freq) * amp;
  const deviation = Math.abs(pos.x - idealX);
  const tolerance = 25; // Допуск в пикселях

  if (deviation > tolerance) {
    // Ошибка: ушли слишком далеко от траектории
    isDrawing = false;
    ctx.strokeStyle = "#ff5252";
    ctx.lineWidth = 4;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.closePath();

    showFeedback("⚠️ Соблюдай ритм волны!", "error");
    vibrateDevice();

    setTimeout(() => {
      clearCanvas();
      drawExerciseTemplate(currentExercise);
      userPath = [];
    }, 1000);
    return;
  }

  // Успех: рисуем зелёной линией
  ctx.strokeStyle = "#4caf50";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  userPath.push(pos);
}

function completeSineCorridor() {
  // === ФИНАЛЬНАЯ ПРОВЕРКА КАЧЕСТВА ===
  let totalChecked = 0;
  let withinTolerance = 0;
  const tolerance = 25;

  const startY = currentExercise.sineStartY;
  const freq = currentExercise.sineFrequency;
  const amp = currentExercise.sineAmplitude;
  const centerX = currentExercise.sineCenterX;

  // Проверяем точки (пропускаем первые 15 для "разгона")
  for (let i = 15; i < userPath.length; i++) {
    const p = userPath[i];
    const idealX = centerX + Math.sin((p.y - startY) * freq) * amp;
    const deviation = Math.abs(p.x - idealX);

    if (deviation < tolerance) {
      withinTolerance++;
    }
    totalChecked++;
  }

  const successRate = totalChecked > 0 ? withinTolerance / totalChecked : 0;

  if (successRate >= 0.6) {
    exerciseCompleted = true;
    isDrawing = false;
    showFeedback("🎉 Отлично! Ты справился!", "success");
    document.getElementById("next-level-btn").classList.remove("hidden");
    setTimeout(() => nextExercise(), 1500);
  } else {
    isDrawing = false;
    showFeedback("⚠️ Попробуй еще раз, соблюдай волну!", "error");
    setTimeout(() => {
      clearCanvas();
      drawExerciseTemplate(currentExercise);
      userPath = [];
    }, 1500);
  }
}

function completeTrafficLight() {
  if (exerciseCompleted) return;
  if (trafficLightTimer) clearTimeout(trafficLightTimer);

  if (startZoneReached && userPath.length > 80 && trafficViolations < 3) {
    exerciseCompleted = true;
    isDrawing = false;
    const feedback = document.getElementById("feedback");
    feedback.textContent =
      trafficViolations === 0
        ? "🎉 Идеально!"
        : `✅ ${trafficViolations} нарушений`;
    feedback.className = "feedback";
    feedback.classList.remove("hidden");
    document.getElementById("next-level-btn").classList.remove("hidden");
    setTimeout(() => nextExercise(), 2000);
  } else {
    isDrawing = false;
    exerciseCompleted = false;
    const feedback = document.getElementById("feedback");
    feedback.textContent = "❌ Начни от старта и веди до финиша!";
    feedback.className = "feedback error";
    feedback.classList.remove("hidden");
    setTimeout(() => {
      clearCanvas();
      drawExerciseTemplate(currentExercise);
      userPath = [];
      trafficViolations = 0;
      startZoneReached = false;
      feedback.classList.add("hidden");
    }, 1500);
  }
}

// ============================================
// УПРАЖНЕНИЕ: ИНВЕРСИЯ (Модуль 7.3)
// ============================================

// Возможные задачи и их инверсия
const INVERSION_RULES = [
  { display: "up", target: "down", text: "ВВЕРХ", symbol: "↑" },
  { display: "down", target: "up", text: "ВНИЗ", symbol: "↓" },
  { display: "left", target: "right", text: "ВЛЕВО", symbol: "←" },
  { display: "right", target: "left", text: "ВПРАВО", symbol: "→" }
];

function drawInversionTemplate() {
  // Выбираем случайное задание
  const randomRule =
    INVERSION_RULES[Math.floor(Math.random() * INVERSION_RULES.length)];
  currentInversionTask = randomRule;
  inversionStartPos = null;

  // Центр экрана
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Фон
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Рисуем стрелку-подсказку (КРУПНО, чтобы сбить с толку)
  ctx.fillStyle = "#e3f2fd"; // Легкий фон
  ctx.beginPath();
  ctx.arc(cx, cy, 80, 0, Math.PI * 2);
  ctx.fill();

  // Символ (Стрелка)
  ctx.fillStyle = "#1976d2"; // Ярко-синий цвет
  ctx.font = "bold 70px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(randomRule.symbol, cx, cy - 30);

  // Текст (Усиление когнитивного конфликта)
  ctx.font = "bold 24px Arial";
  ctx.fillStyle = "#0d47a1";
  ctx.fillText(randomRule.text, cx, cy + 40);

  // Подсказка снизу
  ctx.fillStyle = "#888";
  ctx.font = "16px Arial";
  ctx.fillText(
    "Проведи линию в противоположную сторону!",
    cx,
    canvas.height - 50
  );
}

function startDrawingInversion(e) {
  e.preventDefault();
  if (exerciseCompleted) return;
  const pos = getPosition(e);

  // Фиксируем старт линии
  inversionStartPos = pos;
  isDrawing = true;
  userPath = [pos];

  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.strokeStyle = "#4fc3f7";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
}

// Проверка результата (вызывается в stopDrawing)
function checkInversionResult() {
  if (!inversionStartPos || userPath.length < 10) {
    showFeedback("⚠️ Проведи линию!", "error");
    setTimeout(resetInversion, 1000);
    return;
  }

  const start = inversionStartPos;
  const end = userPath[userPath.length - 1];

  // 1. Расчет вектора движения пользователя
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  // 2. Проверка длины линии (не менее 100px)
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 100) {
    showFeedback("⚠️ Линия слишком короткая", "error");
    setTimeout(resetInversion, 1000);
    return;
  }

  // 3. Сравнение с целью
  const targetDir = currentInversionTask.target;
  let isCorrect = false;

  // Логика проверки направления с допуском ±45 градусов
  // Мы используем сравнение проекций для простоты и надежности

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (targetDir === "up") {
    // Цель: Вверх. dy должно быть сильно отрицательным (y уменьшается)
    // Допуск: вертикальная проекция должна быть больше горизонтальной
    isCorrect = dy < -50 && absDy > absDx;
  } else if (targetDir === "down") {
    // Цель: Вниз. dy должно быть положительным
    isCorrect = dy > 50 && absDy > absDx;
  } else if (targetDir === "left") {
    // Цель: Влево. dx должно быть отрицательным
    isCorrect = dx < -50 && absDx > absDy;
  } else if (targetDir === "right") {
    // Цель: Вправо. dx должно быть положительным
    isCorrect = dx > 50 && absDx > absDy;
  }

  if (isCorrect) {
    exerciseCompleted = true;
    isDrawing = false;
    ctx.strokeStyle = "#4caf50"; // Зеленый успех
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    showFeedback("🎉 Отлично! Ты не поддался импульсу!", "success");
    document.getElementById("next-level-btn").classList.remove("hidden");
    setTimeout(() => nextExercise(), 2000);
  } else {
    // Ошибка: нарисовал в ту же сторону или по диагонали
    ctx.strokeStyle = "#ff5252"; // Красная ошибка
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    showFeedback("❌ Ошибка! Нужно было в ПРОТИВОПОЛОЖНУЮ сторону", "error");
    vibrateDevice();
    setTimeout(resetInversion, 1500);
  }
}

function resetInversion() {
  clearCanvas();
  drawInversionTemplate(); // Генерируем новую задачу
  userPath = [];
  inversionStartPos = null;
}

// ============================================
// УПРАЖНЕНИЕ: ВЕРНЫЙ МАРШРУТ (Star Route)
// ============================================

function generateStarRouteItems() {
  starRouteItems = [];
  const countStars = 5;
  const countTraps = 6; // 3 круга, 3 квадрата
  const padding = 60;
  const minDist = 80;

  // Генерируем звезды
  for (let i = 0; i < countStars; i++) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
      const r = 25;
      const x =
        padding + r + Math.random() * (canvas.width - 2 * padding - 2 * r);
      const y =
        padding + r + Math.random() * (canvas.height - 2 * padding - 2 * r);

      let overlap = false;
      for (let item of starRouteItems) {
        const dist = Math.hypot(x - item.x, y - item.y);
        if (dist < r + item.r + minDist) overlap = true;
      }
      if (!overlap) {
        starRouteItems.push({ type: "star", x, y, r, collected: false });
        placed = true;
      }
      attempts++;
    }
  }

  // Генерируем ловушки
  const trapTypes = ["circle", "square"];
  for (let i = 0; i < countTraps; i++) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
      const r = 20;
      const x =
        padding + r + Math.random() * (canvas.width - 2 * padding - 2 * r);
      const y =
        padding + r + Math.random() * (canvas.height - 2 * padding - 2 * r);
      const type = trapTypes[i % 2]; // Чередование

      let overlap = false;
      for (let item of starRouteItems) {
        const dist = Math.hypot(x - item.x, y - item.y);
        if (dist < r + item.r + 40) overlap = true; // Больше отступ от ловушек
      }
      if (!overlap) {
        starRouteItems.push({ type: "trap", subtype: type, x, y, r });
        placed = true;
      }
      attempts++;
    }
  }
}

function drawStarShape(ctx, x, y, r) {
  const innerR = r * 0.4;
  const spikes = 5;
  const step = Math.PI / spikes;
  let rot = (Math.PI / 2) * 3;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  for (let i = 0; i < spikes; i++) {
    let x_outer = x + Math.cos(rot) * r;
    let y_outer = y + Math.sin(rot) * r;
    ctx.lineTo(x_outer, y_outer);
    rot += step;
    let x_inner = x + Math.cos(rot) * innerR;
    let y_inner = y + Math.sin(rot) * innerR;
    ctx.lineTo(x_inner, y_inner);
    rot += step;
  }
  ctx.lineTo(x, y - r);
  ctx.closePath();
}

function drawStarRouteTemplate() {
  generateStarRouteItems();

  for (let item of starRouteItems) {
    if (item.type === "star") {
      ctx.fillStyle = item.collected ? "#4caf50" : "#FFC107";
      drawStarShape(ctx, item.x, item.y, item.r);
      ctx.fill();
    } else {
      if (item.subtype === "circle") {
        ctx.fillStyle = "#FF5252";
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
        ctx.fill();
        // Крестик
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(item.x - 8, item.y - 8);
        ctx.lineTo(item.x + 8, item.y + 8);
        ctx.moveTo(item.x + 8, item.y - 8);
        ctx.lineTo(item.x - 8, item.y + 8);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#2196F3";
        ctx.fillRect(item.x - item.r, item.y - item.r, item.r * 2, item.r * 2);
        // Крестик
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(item.x - 8, item.y - 8);
        ctx.lineTo(item.x + 8, item.y + 8);
        ctx.moveTo(item.x + 8, item.y - 8);
        ctx.lineTo(item.x - 8, item.y + 8);
        ctx.stroke();
      }
    }
  }
}

// Модуль 7 Верный путь
function startDrawingStarRoute(e) {
  e.preventDefault();
  if (exerciseCompleted) return;
  const pos = getPosition(e);

  // Если это первое касание, проверяем близость к звезде
  if (userPath.length === 0) {
    let nearStar = false;
    for (let item of starRouteItems) {
      if (
        item.type === "star" &&
        Math.hypot(pos.x - item.x, pos.y - item.y) < item.r + 30
      ) {
        nearStar = true;
        break;
      }
    }
    if (!nearStar) return;
    userPath = [pos];
  } else {
    // При возобновлении просто фиксируем новую точку старта
    userPath.push(pos);
  }

  isDrawing = true;
  ctx.beginPath();
  // Рисуем мостик от предыдущей точки к текущей, чтобы линия была сплошной
  const prevPos = userPath.length > 1 ? userPath[userPath.length - 2] : pos;
  ctx.moveTo(prevPos.x, prevPos.y);
  ctx.lineTo(pos.x, pos.y);
  ctx.strokeStyle = "#4fc3f7";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round"; // Сглаживает углы при возобновлении рисования
  ctx.stroke();
}

function drawStarRouteWithCheck(pos) {
  if (!isDrawing) return;
  userPath.push(pos);

  // 1. Проверка на ловушку (Круг/Квадрат)
  for (let item of starRouteItems) {
    if (item.type === "trap") {
      const dist = Math.hypot(pos.x - item.x, pos.y - item.y);
      if (dist < item.r + 10) {
        isDrawing = false;
        ctx.strokeStyle = "#ff5252";
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        showFeedback("❌ Попал в ловушку!", "error");
        vibrateDevice();
        setTimeout(() => {
          clearCanvas();
          drawExerciseTemplate(currentExercise);
          userPath = [];
          starRouteCollected = 0;
          starRouteItems.forEach((i) => (i.collected = false));
        }, 1000);
        return;
      }
    }
  }

  // 2. Сбор звезды
  for (let item of starRouteItems) {
    if (item.type === "star" && !item.collected) {
      const dist = Math.hypot(pos.x - item.x, pos.y - item.y);
      if (dist < item.r + 15) {
        item.collected = true;
        starRouteCollected++;
        drawCollectedStarFeedback(item); // Мгновенная анимация/смена цвета
      }
    }
  }

  // 3. Отрисовка линии
  ctx.strokeStyle = "#4fc3f7";
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}

function drawCollectedStarFeedback(item) {
  // Рисуем свечение (отсвет)
  ctx.shadowColor = "#4caf50";
  ctx.shadowBlur = 20;

  // Перекрашиваем звезду в зелёный
  ctx.fillStyle = "#4caf50";
  drawStarShape(ctx, item.x, item.y, item.r);
  ctx.fill();

  // Рисуем контрастную галочку
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0;
  ctx.lineCap = "round";
  ctx.beginPath();
  //ctx.moveTo(item.x - item.r * 0.4, item.y);
  //ctx.lineTo(item.x - item.r * 0.1, item.y + item.r * 0.3);
  //ctx.lineTo(item.x + item.r * 0.4, item.y - item.r * 0.3);
  //ctx.stroke();
  ctx.shadowBlur = 0;

  checkStarRouteFinish();
}

function checkStarRouteFinish() {
  if (
    starRouteCollected >= starRouteItems.filter((i) => i.type === "star").length
  ) {
    exerciseCompleted = true;
    isDrawing = false;
    showFeedback("🎉 Маршрут пройден!", "success");
    document.getElementById("next-level-btn").classList.remove("hidden");
    setTimeout(() => nextExercise(), 1500);
  }
}

// ================= START: [Полная логика "Переключатель"] =================
function drawSwitcherTemplate() {
  switcherCircles = [];
  const count = 6;
  const padding = canvas.width * 0.12;
  const usableWidth = canvas.width - padding * 2;
  const yBase = canvas.height / 2;
  const amplitude = canvas.height * 0.15;

  for (let i = 0; i < count; i++) {
    const x = padding + (i / (count - 1)) * usableWidth;
    const y = i % 2 === 0 ? yBase - amplitude : yBase + amplitude;
    switcherCircles.push({ x, y, r: 25 });
  }

  for (let i = 0; i < switcherCircles.length; i++) {
    const c = switcherCircles[i];
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);

    // Подсветка следующей целевой точки
    if (i === switcherCurrentIdx + 1) {
      ctx.fillStyle = "#e3f2fd";
      ctx.strokeStyle = "#2196f3";
      ctx.lineWidth = 4;
      ctx.fill();
      ctx.stroke();
      // Пульсирующее кольцо-подсказка
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r + 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(33, 150, 243, 0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (i <= switcherCurrentIdx) {
      ctx.fillStyle = "#4caf50"; // Пройденные/старт
      ctx.strokeStyle = "#388e3c";
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = "#ffffff"; // Ещё не доступные
      ctx.strokeStyle = "#bdbdbd";
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();
    }
  }
}

function startDrawingSwitcher(e) {
  e.preventDefault();
  if (exerciseCompleted) return;
  if (switcherLocked) {
    showSwitcherFeedback("⚠️ Нажми кнопку «Смена программы»!", "error");
    return;
  }
  const pos = getPosition(e);
  const target = switcherCircles[switcherCurrentIdx];
  const dist = Math.hypot(pos.x - target.x, pos.y - target.y);
  if (dist > target.r + 20) return; // Начинать только от текущего кружка

  isDrawing = true;
  userPath = [pos];
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  const style = SWITCHER_STYLES[switcherCurrentStyle % SWITCHER_STYLES.length];
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width;
  ctx.setLineDash(style.dash);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function drawSwitcherWithCheck(pos) {
  if (!isDrawing) return;
  const target = switcherCircles[switcherCurrentIdx + 1];
  if (!target) return;

  userPath.push(pos);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();

  const dist = Math.hypot(pos.x - target.x, pos.y - target.y);
  if (dist <= target.r + 5) {
    completeSwitcherConnection();
  }
}

function completeSwitcherConnection() {
  isDrawing = false;
  ctx.setLineDash([]);
  ctx.closePath();
  switcherCurrentIdx++;

  // Подсветка достигнутого кружка
  if (switcherCurrentIdx > 0 && switcherCurrentIdx <= switcherCircles.length) {
    const reached = switcherCircles[switcherCurrentIdx - 1];
    ctx.fillStyle = "#4caf50";
    ctx.beginPath();
    ctx.arc(reached.x, reached.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Если остались точки -> блокируем рисование и активируем кнопку
  if (switcherCurrentIdx < switcherCircles.length - 1) {
    switcherLocked = true;
    const btn = document.getElementById("switch-btn");
    if (btn) btn.disabled = false;
    showSwitcherFeedback("🔄 Остановись и нажми кнопку!", "success");
  } else {
    // Дошли до последней точки
    completeSwitcherExercise();
  }
  drawSwitcherTemplate(); // Обновляем подсветку следующей цели
}

window.handleSwitcherAction = function () {
  if (!switcherLocked) return;

  switcherLocked = false;
  switcherCurrentStyle++;

  const btn = document.getElementById("switch-btn");
  if (btn) {
    btn.disabled = true; // Делаем кнопку серой до следующего отрезка
    btn.classList.remove("visible");
    setTimeout(() => btn.classList.add("visible"), 10); // Триггер для перерисовки CSS
  }

  showSwitcherFeedback("✅ Режим изменен! Веди к следующей точке.", "success");
  drawSwitcherTemplate();
};

function completeSwitcherExercise() {
  exerciseCompleted = true;
  isDrawing = false;
  ctx.setLineDash([]);
  showSwitcherFeedback("🎉 Отлично! Программа выполнена!", "success");
  document.getElementById("next-level-btn").classList.remove("hidden");
  const btn = document.getElementById("switch-btn");
  if (btn) btn.style.display = "none"; // Скрываем кнопку после финиша
  setTimeout(() => nextExercise(), 2000);
}

function showSwitcherFeedback(msg, type) {
  const fb = document.getElementById("feedback");
  fb.textContent = msg;
  fb.className = `feedback ${type === "error" ? "error" : ""}`;
  fb.classList.remove("hidden");
  setTimeout(() => fb.classList.add("hidden"), 2000);
}
// ================= END: [Полная логика "Переключатель"] =================

// В глобальной области (после всех функций)
window.appVersion = FILE_VERSION;
window.checkVersion = logVersion;
