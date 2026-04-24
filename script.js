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

// Загрузка статистики из localStorage
function loadStats() {
    const saved = localStorage.getItem('graphomotorStats');
    if (saved) {
        stats = JSON.parse(saved);
    }
}

// Сохранение статистики
function saveStats() {
    localStorage.setItem('graphomotorStats', JSON.stringify(stats));
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    // Не инициализируем canvas сразу, только когда он понадобится
});

// Навигация
function showMainMenu() {
    hideAllScreens();
    document.querySelector('.main-menu').classList.remove('hidden');
    // Скрываем все элементы управления
    const regularControls = document.querySelector('.controls');
    const gridControls = document.getElementById('grid-controls');
    if (regularControls) regularControls.classList.remove('hidden');
    if (gridControls) gridControls.classList.add('hidden');
    // Разрешаем скролл в меню
    document.body.style.overflow = 'auto';
    // ИСПРАВЛЕНИЕ ОШИБКИ 3: Сбрасываем зеленый фон при выходе в главное меню
    document.body.style.backgroundColor = '';
}

function showExercises() {
    hideAllScreens();
    document.getElementById('exercises-menu').classList.remove('hidden');
    // Скрываем все элементы управления
    const regularControls = document.querySelector('.controls');
    const gridControls = document.getElementById('grid-controls');
    if (regularControls) regularControls.classList.remove('hidden');
    if (gridControls) gridControls.classList.add('hidden');
    // Разрешаем скролл в меню выбора упражнений
    document.body.style.overflow = 'auto';
}

function showResults() {
    hideAllScreens();
    document.getElementById('results-screen').classList.remove('hidden');
    updateResultsDisplay();
    // Разрешаем скролл на экране результатов
    document.body.style.overflow = 'auto';
}

function showInfo() {
    hideAllScreens();
    document.getElementById('info-screen').classList.remove('hidden');
    // Разрешаем скролл на экране информации
    document.body.style.overflow = 'auto';
}

function hideAllScreens() {
    document.querySelector('.main-menu').classList.add('hidden');
    document.getElementById('exercises-menu').classList.add('hidden');
    document.getElementById('exercise-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.add('hidden');
    document.getElementById('info-screen').classList.add('hidden');
}

// Начать занятие (автоматический набор упражнений)
function startLesson() {
    const lessonModules = [1, 2, 4, 7]; // Разминка, траектории, серийность, самоконтроль
    currentModule = lessonModules[0];
    loadModule(currentModule);
}

// Загрузка модуля
function loadModule(moduleNum) {
    currentModule = moduleNum;
    currentExerciseIndex = 0;
    moduleExercises = getModuleExercises(moduleNum);
    
    // ИСПРАВЛЕНИЕ ОШИБКИ 3: Зеленый фон для Модуля 6
    if (moduleNum === 6) {
        document.body.style.backgroundColor = '#f0fff0';
    } else {
        document.body.style.backgroundColor = '';
    }
    
    hideAllScreens();
    document.getElementById('exercise-screen').classList.remove('hidden');
    
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
        displayExercise(currentExercise);
        startTime = Date.now();
    }, 100); // Увеличена задержка до 100ms для надежности
}

// Получение упражнений модуля
function getModuleExercises(moduleNum) {
    const modules = {
        1: [
            { title: 'Поставь точку в центре', type: 'point-center', instruction: 'Коснись центра экрана' },
            { title: 'Поставь точку вверху', type: 'point-top', instruction: 'Коснись верхней части экрана' },
            { title: 'Поставь точку внизу', type: 'point-bottom', instruction: 'Коснись нижней части экрана' },
            { title: 'Поставь точку слева', type: 'point-left', instruction: 'Коснись левой части экрана' },
            { title: 'Поставь точку справа', type: 'point-right', instruction: 'Коснись правой части экрана' }
        ],
        2: [
            { title: 'Проведи по прямой дорожке', type: 'path-straight', instruction: 'Веди пальцем по дорожке слева направо' },
            { title: 'Поднимись по столбику', type: 'path-vertical', instruction: 'Веди пальцем снизу вверх' },
            { title: 'Перепрыгни через кочки', type: 'path-zigzag', instruction: 'Веди пальцем по зигзагу' },
            { title: 'Проплыви по волнам', type: 'path-wave', instruction: 'Веди пальцем по волнистой линии' },
            { title: 'Закрути улитку', type: 'path-spiral', instruction: 'Веди пальцем по спирали от центра' }
        ],
        3: [
            { title: 'Прямые линии', type: 'path-lines', instruction: 'Обведи все прямые линии сверху вниз', subTasks: 5 },
            { title: 'Наклонные линии', type: 'path-diagonal', instruction: 'Обведи все наклонные линии', subTasks: 8 },
            { title: 'Круги', type: 'path-circles', instruction: 'Обведи все круги по контуру', subTasks: 6 },
            { title: 'Дуги', type: 'path-arcs', instruction: 'Обведи все дуги плавным движением', subTasks: 5 },
            { title: 'Пружинка', type: 'path-loops', instruction: 'Обведи волнистые линии слева направо', subTasks: 3 }
        ],
        4: [
            { title: 'Ритмичный заборчик', type: 'rhythmic-fence', instruction: 'Веди пальцем по зигзагу, чередуя высоту зубьев' },
            { title: 'Волна и утес', type: 'wave-cliff', instruction: 'Чередуй плавные волны и резкие углы' },
            { title: 'Ритмическая спираль', type: 'rhythmic-spiral', instruction: 'Веди пальцем по спирали, чередуя большие и маленькие петли' },
            { title: 'Зубчатая стена', type: 'meander-wall', instruction: 'Веди пальцем по ступенькам, строго по горизонтали и вертикали' },
            { title: 'Комбинированная цепь', type: 'combined-chain', instruction: 'Финальный тест: круги, углы и прямые линии в одной цепи' }
        ],
        5: [
            { 
                title: 'Зеркальная елочка', 
                type: 'mirror-tree', 
                instruction: 'Повтори елочку справа, глядя на образец слева',
                subTasks: 3,
                segments: [
                    // ВЕРХНИЙ ТРЕУГОЛЬНИК (subTaskIndex: 0)
                    { x1: 0, y1: 1, x2: -2, y2: 3, isCompleted: false, subTaskIndex: 0 },   // левая сторона верхнего треугольника
                    { x1: 0, y1: 1, x2: 2, y2: 3, isCompleted: false, subTaskIndex: 0 },    // правая сторона верхнего треугольника
                    { x1: -2, y1: 3, x2: 2, y2: 3, isCompleted: false, subTaskIndex: 0 },   // основание верхнего треугольника
                    
                    // НИЖНИЙ ТРЕУГОЛЬНИК (subTaskIndex: 1)
                    { x1: 0, y1: 3, x2: -3, y2: 6, isCompleted: false, subTaskIndex: 1 },   // левая сторона нижнего треугольника
                    { x1: 0, y1: 3, x2: 3, y2: 6, isCompleted: false, subTaskIndex: 1 },    // правая сторона нижнего треугольника
                    { x1: -3, y1: 6, x2: 3, y2: 6, isCompleted: false, subTaskIndex: 1 },   // основание нижнего треугольника
                    
                    // СТВОЛ (subTaskIndex: 2)
                    { x1: -1, y1: 6, x2: -1, y2: 8, isCompleted: false, subTaskIndex: 2 },  // левая сторона ствола
                    { x1: 1, y1: 6, x2: 1, y2: 8, isCompleted: false, subTaskIndex: 2 },    // правая сторона ствола
                    { x1: -1, y1: 8, x2: 1, y2: 8, isCompleted: false, subTaskIndex: 2 }    // основание ствола
                ]
            },
            {
                title: 'Узор по точкам',
                type: 'pattern-dots',
                instruction: 'Начни с синей точки и повтори узор',
                gridSize: 5,
                startPoint: 20,
                points: [
                    // Сетка 5x5 (25 точек)
                    { x: 0.1, y: 0.1 }, { x: 0.3, y: 0.1 }, { x: 0.5, y: 0.1 }, { x: 0.7, y: 0.1 }, { x: 0.9, y: 0.1 },
                    { x: 0.1, y: 0.3 }, { x: 0.3, y: 0.3 }, { x: 0.5, y: 0.3 }, { x: 0.7, y: 0.3 }, { x: 0.9, y: 0.3 },
                    { x: 0.1, y: 0.5 }, { x: 0.3, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.7, y: 0.5 }, { x: 0.9, y: 0.5 },
                    { x: 0.1, y: 0.7 }, { x: 0.3, y: 0.7 }, { x: 0.5, y: 0.7 }, { x: 0.7, y: 0.7 }, { x: 0.9, y: 0.7 },
                    { x: 0.1, y: 0.9 }, { x: 0.3, y: 0.9 }, { x: 0.5, y: 0.9 }, { x: 0.7, y: 0.9 }, { x: 0.9, y: 0.9 }
                ],
                pattern: [
                    // Равнобедренный треугольник (8 сегментов)
                    [20, 11],  // Левая грань (часть 1)
                    [11, 2],   // Левая грань (часть 2)
                    [2, 13],   // Правая грань (часть 1)
                    [13, 24],  // Правая грань (часть 2)
                    [24, 23],  // Основание (часть 1)
                    [23, 22],  // Основание (часть 2)
                    [22, 21],  // Основание (часть 3)
                    [21, 20]   // Основание (часть 4)
                ]
            }
        ],
        6: [
            { title: 'Квадратное окошко', type: 'grid-square', instruction: 'Проведи: 2 клетки вправо, 2 вниз, 2 влево, 2 вверх', 
              sequence: ['right', 'right', 'down', 'down', 'left', 'left', 'up', 'up'] },
            { title: 'Лесенка-гора', type: 'grid-mountain', instruction: 'Построй гору! Повтори 4 раза: (1 вправо, 1 вверх). А потом 4 раза: (1 вправо, 1 вниз)',
              sequence: ['right', 'up', 'right', 'up', 'right', 'up', 'right', 'up', 'right', 'down', 'right', 'down', 'right', 'down', 'right', 'down'] },
            { title: 'Цифровая змейка', type: 'grid-snake', instruction: 'Нарисуй змейку: 1 вправо, 1 вверх, 2 вправо, 1 вниз, 1 вправо, 2 вверх, 1 вправо, 2 вниз', 
              sequence: ['right', 'up', 'right', 'right', 'down', 'right', 'up', 'up', 'right', 'down', 'down'] },
            { title: 'Волшебный цилиндр', type: 'grid-snake', instruction: 'Нарисуй шляпу фокусника: 1 вправо, 3 вверх, 2 вправо, 3 вниз, 1 вправо, 1 вниз, 4 влево, 1 вверх', 
              sequence: ['right', 'up', 'up', 'up', 'right', 'right', 'down', 'down', 'down', 'right', 'down', 'left', 'left', 'left', 'left', 'up'] },
            { title: 'Подарок', type: 'grid-heart', instruction: 'Давай нарисуем красивое сердечко! Внимательно слушай и точно выполняй каждый шаг: начни с 2 шагов вправо, затем 1 шаг вниз, снова 2 шага вправо, потом 1 шаг вверх, ещё 2 шага вправо, 1 шаг вниз, 1 шаг вправо и 3 шага вниз. Теперь важная часть - повторяй трижды такую связку: 1 шаг влево и 1 шаг вниз. После этого сделай 2 шага влево. Теперь снова повторяй трижды: 1 шаг вверх и 1 шаг влево. Завершаем сердечко: 3 шага вверх, 1 шаг вправо и 1 шаг вверх для замыкания контура.', 
              sequence: ['right', 'right', 'down', 'right', 'right', 'up', 'right', 'right', 'down', 'right', 'down', 'down', 'down', 'left', 'down', 'left', 'down', 'left', 'down', 'left', 'left', 'up', 'left', 'up', 'left', 'up', 'left', 'up', 'up', 'up', 'right', 'up'] }
        ],
        7: [
            { title: 'Найди ошибку', type: 'find-error', instruction: 'Найди неправильный элемент' },
            { title: 'Сравни узоры', type: 'compare', instruction: 'Выбери правильный узор' }
        ],
        8: [
            { title: 'Укрась дорожку', type: 'decorate', instruction: 'Укрась дорожку точками' },
            { title: 'Соедини пары', type: 'connect', instruction: 'Соедини одинаковые фигуры' }
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
    const regularControls = document.querySelector('.controls');
    const gridControls = document.getElementById('grid-controls');
    regularControls.classList.remove('hidden');
    gridControls.classList.add('hidden');
    
    showExercises();
    // Разрешаем скролл при выходе из упражнения
    document.body.style.overflow = 'auto';
}

// Обновление отображения результатов
function updateResultsDisplay() {
    const accuracy = stats.totalExercises > 0 ? 
        Math.round((stats.successfulExercises / stats.totalExercises) * 100) : 0;
    const avgTime = stats.successfulExercises > 0 ? 
        Math.round(stats.totalTime / stats.successfulExercises / 1000) : 0;
    
    document.getElementById('total-exercises').textContent = stats.totalExercises;
    document.getElementById('successful-exercises').textContent = stats.successfulExercises;
    document.getElementById('accuracy').textContent = accuracy + '%';
    document.getElementById('average-time').textContent = avgTime + ' сек';
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
        console.error('No exercise provided!');
        return;
    }
    
    console.log('Displaying exercise:', exercise.title, exercise.type);
    
    // Блокируем скролл во время выполнения упражнения
    document.body.style.overflow = 'hidden';
    
    document.getElementById('exercise-title').textContent = exercise.title;
    document.getElementById('instruction').textContent = exercise.instruction;
    document.getElementById('feedback').classList.add('hidden');
    
    exerciseCompleted = false;
    targetZone = null;
    
    // Сброс переменных для модуля 2
    pathPoints = [];
    userPath = [];
    exitCount = 0;
    isOutOfBounds = false;
    finishZone = null;
    
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
        mirrorTreeTargets = exercise.segments.map(seg => ({
            x1: -seg.x1,  // Зеркальное отражение относительно x=0
            y1: seg.y1,
            x2: -seg.x2,
            y2: seg.y2,
            isCompleted: false,  // Все сегменты начинаются как невыполненные
            subTaskIndex: seg.subTaskIndex  // Сохраняем индекс подзадачи
        }));
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
    const regularControls = document.querySelector('.controls');
    const gridControls = document.getElementById('grid-controls');
    
    if (exercise.type && exercise.type.startsWith('grid-')) {
        // Модуль 6: показываем кнопки-стрелки, скрываем обычные кнопки
        regularControls.classList.add('hidden');
        gridControls.classList.remove('hidden');
        
        // Управляем видимостью кнопки "Дальше" при инициализации
        if (currentModule === 6) {
            // В Модуле 6 (графические диктанты) кнопка "Дальше" всегда видна
            document.getElementById('next-level-btn').classList.remove('hidden');
        } else {
            // В других модулях скрываем кнопку "Дальше" при инициализации
            document.getElementById('next-level-btn').classList.add('hidden');
        }
        
        // Обновляем счетчик шагов
        document.getElementById('current-step').textContent = '0';
        document.getElementById('total-steps').textContent = targetSequence.length.toString();
    } else {
        // Другие модули: показываем обычные кнопки, скрываем стрелки
        regularControls.classList.remove('hidden');
        gridControls.classList.add('hidden');
    }
    
    if (canvas && ctx) {
        // ИСПРАВЛЕНИЕ ОШИБКИ 1: Принудительно обновляем размеры canvas после показа экрана
        setTimeout(() => {
            resizeCanvas();
            clearCanvas();
            drawExerciseTemplate(exercise);
        }, 50); // Даем время на отрисовку DOM
    } else {
        console.error('Canvas not initialized!');
    }
}

// Инициализация canvas
function initCanvas() {
    canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    ctx = canvas.getContext('2d');
    resizeCanvas();
    
    // Удаляем старые обработчики, если они есть
    canvas.removeEventListener('touchstart', handleCanvasTouch);
    canvas.removeEventListener('mousedown', handleCanvasClick);
    canvas.removeEventListener('touchmove', draw);
    canvas.removeEventListener('touchend', stopDrawing);
    canvas.removeEventListener('mousemove', draw);
    canvas.removeEventListener('mouseup', stopDrawing);
    
    // События для точечных упражнений (клик/тап)
    canvas.addEventListener('touchstart', handleCanvasTouch);
    canvas.addEventListener('mousedown', handleCanvasClick);
    
    // События для рисования (для других модулей)
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    
    // Удаляем старый обработчик resize, если есть
    window.removeEventListener('resize', resizeCanvas);
    window.addEventListener('resize', resizeCanvas);
    
    console.log('Canvas initialized:', canvas.width, 'x', canvas.height);
}

function resizeCanvas() {
    if (!canvas) return;
    
    // Получаем контейнер canvas
    const container = canvas.parentElement;
    if (!container) return;
    
    // Получаем блок с кнопками управления
    const controlsBlock = document.querySelector('.controls');
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
    
    console.log('Canvas resized:', canvas.width, 'x', canvas.height, 'Available height:', availableHeight);
    
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
    const feedback = document.getElementById('feedback');
    feedback.textContent = '💡 Веди пальцем медленно и аккуратно по пунктирной линии';
    feedback.className = 'feedback';
    feedback.classList.remove('hidden');
    
    setTimeout(() => {
        feedback.classList.add('hidden');
    }, 3000);
}

// Обработка касания/клика на canvas
function handleCanvasTouch(e) {
    e.preventDefault();
    
    if (exerciseCompleted) return;
    
    const pos = getPosition(e);
    
    // Модуль 1: Точечные упражнения
    if (currentExercise && currentExercise.type.startsWith('point-')) {
        checkPointPlacement(pos);
    } 
    // Модуль 2 и 3: Дорожки
    else if (currentExercise && currentExercise.type.startsWith('path-')) {
        startDrawingPath(e);
    }
    // Модуль 4: Серийность движений (используют механизм дорожек)
    else if (currentExercise && (currentExercise.type === 'rhythmic-fence' || 
        currentExercise.type === 'wave-cliff' || 
        currentExercise.type === 'rhythmic-spiral' ||
        currentExercise.type === 'meander-wall' ||
        currentExercise.type === 'combined-chain')) {
        startDrawingPath(e);
    }
    // Модуль 5: Зрительно-моторное соотнесение
    else if (currentExercise && currentExercise.type === 'mirror-tree') {
        startDrawingMirrorTree(e);
    }
    else {
        startDrawing(e);
    }
}

function handleCanvasClick(e) {
    e.preventDefault();
    
    if (exerciseCompleted) return;
    
    const pos = getPosition(e);
    
    // Модуль 1: Точечные упражнения
    if (currentExercise && currentExercise.type.startsWith('point-')) {
        checkPointPlacement(pos);
    } 
    // Модуль 2 и 3: Дорожки
    else if (currentExercise && currentExercise.type.startsWith('path-')) {
        startDrawingPath(e);
    }
    // Модуль 4: Серийность движений (используют механизм дорожек)
    else if (currentExercise && (currentExercise.type === 'rhythmic-fence' || 
        currentExercise.type === 'wave-cliff' || 
        currentExercise.type === 'rhythmic-spiral' ||
        currentExercise.type === 'meander-wall' ||
        currentExercise.type === 'combined-chain')) {
        startDrawingPath(e);
    }
    // Модуль 5: Зрительно-моторное соотнесение
    else if (currentExercise && currentExercise.type === 'mirror-tree') {
        startDrawingMirrorTree(e);
    }
    else {
        startDrawing(e);
    }
}

// Проверка размещения точки
function checkPointPlacement(pos) {
    if (!targetZone) return;
    
    const distance = Math.sqrt(
        Math.pow(pos.x - targetZone.x, 2) + 
        Math.pow(pos.y - targetZone.y, 2)
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
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Белый центр
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Анимация успеха - круги расходятся
    animateSuccess(pos);
}

// Рисование ошибочной точки
function drawErrorPoint(pos) {
    // Красная точка
    ctx.fillStyle = '#ff5252';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Крестик
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
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
    const feedback = document.getElementById('feedback');
    feedback.textContent = '✓ Отлично! Точно в цель!';
    feedback.className = 'feedback';
    feedback.classList.remove('hidden');
}

// Показ обратной связи об ошибке
function showErrorFeedback() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = '↻ Попробуй еще раз, ближе к середине';
    feedback.className = 'feedback error';
    feedback.classList.remove('hidden');
    
    setTimeout(() => {
        feedback.classList.add('hidden');
    }, 2000);
}

// Рисование
function startDrawing(e) {
    e.preventDefault();
    
    // Модуль 5: Узор по точкам
    if (currentExercise && currentExercise.type === 'pattern-dots') {
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
    if (currentExercise && currentExercise.type === 'mirror-tree') {
        drawMirrorTreeWithCheck(pos);
        return;
    }
    
    // Модуль 5: Узор по точкам
    if (currentExercise && currentExercise.type === 'pattern-dots') {
        drawPatternDotsWithCheck(pos);
        return;
    }
    
    // Модуль 2, 3 и 4: Проверка границ дорожки
    if (currentExercise && (currentExercise.type.startsWith('path-') || 
        currentExercise.type === 'rhythmic-fence' || 
        currentExercise.type === 'wave-cliff' ||
        currentExercise.type === 'rhythmic-spiral' ||
        currentExercise.type === 'meander-wall' ||
        currentExercise.type === 'combined-chain')) {
        drawPathWithCheck(pos);
        return;
    }
    
    // Обычное рисование для других модулей
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
}

function stopDrawing(e) {
    if (!isDrawing) return;
    e.preventDefault();
    isDrawing = false;
    ctx.closePath();
    
    // Модуль 5: Узор по точкам
    if (currentExercise && currentExercise.type === 'pattern-dots') {
        stopDrawingPatternDots(e);
        return;
    }
    
    // Модуль 2, 3 и 4: Проверка достижения финиша
    if (currentExercise && (currentExercise.type.startsWith('path-') || 
        currentExercise.type === 'rhythmic-fence' || 
        currentExercise.type === 'wave-cliff' ||
        currentExercise.type === 'rhythmic-spiral' ||
        currentExercise.type === 'meander-wall' ||
        currentExercise.type === 'combined-chain')) {
        checkPathFinish();
    }
    
    // Модуль 5: Активация сегментов происходит в реальном времени в drawMirrorTreeWithCheck()
    // Здесь больше ничего не нужно делать
}

function getPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
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
        showMirrorTreeError('Рисуй только справа!');
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
            const distToStart = Math.sqrt(Math.pow(pos.x - x1, 2) + Math.pow(pos.y - y1, 2));
            if (distToStart <= pointTolerance) {
                segmentStartPoints[i] = true;
            }
            
            // Проверяем, прошли ли мы через конечную точку
            const distToEnd = Math.sqrt(Math.pow(pos.x - x2, 2) + Math.pow(pos.y - y2, 2));
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
        ctx.strokeStyle = '#2196f3';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    } else {
        ctx.strokeStyle = '#ff5252';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }
    
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}

function checkMirrorSubTaskCompletion() {
    // Проверяем, выполнены ли все сегменты текущего этапа
    const currentSubTaskSegments = mirrorTreeTargets.filter(seg => seg.subTaskIndex === currentSubTask);
    const allSubTaskCompleted = currentSubTaskSegments.every(seg => seg.isCompleted);
    
    if (allSubTaskCompleted) {
        // Увеличиваем номер текущего этапа
        currentSubTask++;
        
        // Если это не последний этап - показываем промежуточную похвалу
        if (currentSubTask < totalSubTasks) {
            showMirrorFeedback('Молодец, продолжай!');
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
    const feedback = document.getElementById('feedback');
    feedback.textContent = '❌ ' + message;
    feedback.className = 'feedback error';
    feedback.classList.remove('hidden');
    
    vibrateDevice();
    
    setTimeout(() => {
        feedback.classList.add('hidden');
    }, 1500);
}

// Показ промежуточной похвалы
function showMirrorFeedback(message) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = 'feedback success';
    feedback.classList.remove('hidden');
    
    setTimeout(() => {
        feedback.classList.add('hidden');
    }, 1500);
}

// Завершение упражнения
function completeMirrorTree() {
    exerciseCompleted = true;
    isDrawing = false;
    
    const feedback = document.getElementById('feedback');
    feedback.textContent = '🎉 Ты нарисовал красивую елочку!';
    feedback.className = 'feedback';
    feedback.classList.remove('hidden');
    
    // Показываем кнопку "Дальше"
    document.getElementById('next-level-btn').classList.remove('hidden');
    
    setTimeout(() => {
        nextExercise();
    }, 2000);
}

// Вибрация устройства
function vibrateDevice() {
    if ('vibrate' in navigator) {
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
        
        if (currentExercise.type === 'path-lines') {
            // Прямые линии - используем те же относительные координаты, что и в drawPathLines
            const linePositions = [0.15, 0.3, 0.45, 0.6, 0.85];
            const startY = canvas.height * 0.35;
            
            for (let i = 0; i < totalSubTasks; i++) {
                if (!completedSubTasks.includes(i)) {
                    const lineX = canvas.width * linePositions[i];
                    const distance = Math.sqrt(
                        Math.pow(pos.x - lineX, 2) + 
                        Math.pow(pos.y - startY, 2)
                    );
                    
                    if (distance <= 30) {
                        nearStart = true;
                        break;
                    }
                }
            }
        } else if (currentExercise.type === 'path-diagonal') {
            // Наклонные линии - используем те же относительные координаты, что и в drawPathDiagonal
            const linePositions = [0.2, 0.4, 0.6, 0.8];
            const topY = canvas.height * 0.4;
            const bottomY = canvas.height * 0.55;
            
            // Проверяем 4 линии сверху
            for (let i = 0; i < 4; i++) {
                if (!completedSubTasks.includes(i)) {
                    const x1 = canvas.width * linePositions[i];
                    const distance = Math.sqrt(
                        Math.pow(pos.x - x1, 2) + 
                        Math.pow(pos.y - topY, 2)
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
                            Math.pow(pos.x - x1, 2) + 
                            Math.pow(pos.y - bottomY, 2)
                        );
                        
                        if (distance <= 30) {
                            nearStart = true;
                            break;
                        }
                    }
                }
            }
        } else if (currentExercise.type === 'path-circles') {
            // Круги - 6 кругов (3 слева в столбик, 3 справа в столбик)
            const radius = Math.min(28, canvas.width * 0.055);
            const leftX = canvas.width * 0.28;
            const rightX = canvas.width * 0.72;
            const topY = canvas.height * 0.25;
            const middleY = canvas.height * 0.5;
            const bottomY = canvas.height * 0.75;
            
            const circlePositions = [
                { x: leftX, y: topY },     // 0: левый верхний
                { x: leftX, y: middleY },  // 1: левый средний
                { x: leftX, y: bottomY },  // 2: левый нижний
                { x: rightX, y: topY },    // 3: правый верхний
                { x: rightX, y: middleY }, // 4: правый средний
                { x: rightX, y: bottomY }  // 5: правый нижний
            ];
            
            for (let i = 0; i < totalSubTasks; i++) {
                if (!completedSubTasks.includes(i)) {
                    const cx = circlePositions[i].x;
                    const cy = circlePositions[i].y;
                    const distance = Math.sqrt(
                        Math.pow(pos.x - cx, 2) + 
                        Math.pow(pos.y - (cy - radius), 2)
                    );
                    
                    if (distance <= 30) {
                        nearStart = true;
                        break;
                    }
                }
            }
        } else if (currentExercise.type === 'path-arcs') {
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
        } else if (currentExercise.type === 'path-loops') {
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
                        Math.pow(pos.x - startX, 2) + 
                        Math.pow(pos.y - centerY, 2)
                    );
                    
                    if (distance <= 40) { // Увеличенная зона старта для мобильных
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
                Math.pow(pos.x - startPoint.x, 2) + 
                Math.pow(pos.y - startPoint.y, 2)
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
        console.error('pathPoints is empty! Cannot check boundaries.');
        return;
    }
    
    // Отладка для Модуля 4
    if (currentExercise && (currentExercise.type === 'rhythmic-fence' || 
        currentExercise.type === 'wave-cliff' || 
        currentExercise.type === 'rhythmic-spiral' ||
        currentExercise.type === 'meander-wall' ||
        currentExercise.type === 'combined-chain')) {
        console.log('Module 4 check:', {
            exerciseType: currentExercise.type,
            distanceToPath: distanceToPath.toFixed(2),
            pathPointsCount: pathPoints.length,
            userPathCount: userPath.length
        });
    }
    
    // Проверка выхода за границы - увеличенная зона допуска для мобильных устройств
    let boundaryTolerance = 20; // По умолчанию
    
    // Для упражнения "Пружинка" делаем более мягкие границы
    if (currentExercise && currentExercise.type === 'path-loops') {
        boundaryTolerance = 30; // Увеличенная зона допуска для волнистых линий
    }
    
    // Для упражнения "Спираль" (улитка) делаем еще более мягкие границы
    if (currentExercise && currentExercise.type === 'path-spiral') {
        boundaryTolerance = 30; // Увеличенная зона допуска для спирали
    }
    
    // Для упражнений Модуля 4 (серийность движений) делаем разные границы
    if (currentExercise && (currentExercise.type === 'rhythmic-fence' || currentExercise.type === 'wave-cliff')) {
        boundaryTolerance = 25; // Увеличенная зона допуска для сложных траекторий
    }
    
    // Для ритмической спирали - самая строгая проверка (самый сложный уровень)
    if (currentExercise && currentExercise.type === 'rhythmic-spiral') {
        boundaryTolerance = 20; // Строгая зона допуска для спирали
    }
    
    // Для меандра (зубчатой стены) - строгая проверка углов
    if (currentExercise && currentExercise.type === 'meander-wall') {
        boundaryTolerance = 22; // Строгая зона для прямых углов
    }
    
    // Для комбинированной цепи - самая строгая проверка (финальный уровень)
    if (currentExercise && currentExercise.type === 'combined-chain') {
        boundaryTolerance = 25; // Одинаковая зона по всей длине
    }
    
    if (distanceToPath > boundaryTolerance) {
        // Вышли за границы - немедленно прерываем рисование
        if (!isOutOfBounds) {
            isOutOfBounds = true;
            exitCount++;
            vibrateDevice(); // Вибрация при выходе
            
            // Показываем ошибку
            const feedback = document.getElementById('feedback');
            feedback.textContent = '⚠️ Вышел за границы! Попробуй снова';
            feedback.className = 'feedback error';
            feedback.classList.remove('hidden');
            
            // Рисуем красную линию в месте выхода
            ctx.strokeStyle = '#ff5252';
            ctx.lineTo(pos.x, pos.y);
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            
            // Немедленно прерываем рисование
            isDrawing = false;
            ctx.closePath();
            
            // Через 1 секунду очищаем и заставляем проходить уровень заново
            setTimeout(() => {
                clearCanvas();
                drawExerciseTemplate(currentExercise);
                feedback.classList.add('hidden');
                // Полное обнуление состояния для новой попытки
                userPath = [];
                exitCount = 0;
                isOutOfBounds = false;
            }, 1000);
        }
        return;
    }
    
    // В пределах границ - рисуем зеленым
    ctx.strokeStyle = '#4caf50'; // Зеленый цвет
    
    ctx.lineTo(pos.x, pos.y);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Проверяем достижение финиша в реальном времени
    if (totalSubTasks > 0) {
        // Для упражнений с несколькими линиями - проверяем все финишные зоны
        if (currentExercise.type === 'path-lines') {
            // Прямые линии - используем те же относительные координаты, что и в drawPathLines
            const linePositions = [0.15, 0.3, 0.45, 0.6, 0.85];
            const lineLength = canvas.height * 0.3;
            const startY = canvas.height * 0.35;
            
            for (let i = 0; i < totalSubTasks; i++) {
                if (!completedSubTasks.includes(i)) {
                    const lineX = canvas.width * linePositions[i];
                    const finishY = startY + lineLength;
                    const distanceToFinish = Math.sqrt(
                        Math.pow(pos.x - lineX, 2) + 
                        Math.pow(pos.y - finishY, 2)
                    );
                    
                    if (distanceToFinish <= 30) {
                        completePathExercise();
                        return;
                    }
                }
            }
        } else if (currentExercise.type === 'path-diagonal') {
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
                        Math.pow(pos.x - x2, 2) + 
                        Math.pow(pos.y - y2, 2)
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
                        Math.pow(pos.x - x2, 2) + 
                        Math.pow(pos.y - y2, 2)
                    );
                    
                    if (distanceToFinish <= 30) {
                        completePathExercise();
                        return;
                    }
                }
            }
        } else if (currentExercise.type === 'path-circles') {
            // Круги - проверяем возврат к стартовой точке (полный круг)
            const radius = Math.min(28, canvas.width * 0.055);
            const leftX = canvas.width * 0.28;
            const rightX = canvas.width * 0.72;
            const topY = canvas.height * 0.25;
            const middleY = canvas.height * 0.5;
            const bottomY = canvas.height * 0.75;
            
            const circlePositions = [
                { x: leftX, y: topY },     // 0: левый верхний
                { x: leftX, y: middleY },  // 1: левый средний
                { x: leftX, y: bottomY },  // 2: левый нижний
                { x: rightX, y: topY },    // 3: правый верхний
                { x: rightX, y: middleY }, // 4: правый средний
                { x: rightX, y: bottomY }  // 5: правый нижний
            ];
            
            for (let i = 0; i < totalSubTasks; i++) {
                if (!completedSubTasks.includes(i)) {
                    const cx = circlePositions[i].x;
                    const cy = circlePositions[i].y;
                    const startY = cy - radius;
                    
                    // Проверяем, вернулся ли пользователь к стартовой точке
                    const distanceToStart = Math.sqrt(
                        Math.pow(pos.x - cx, 2) + 
                        Math.pow(pos.y - startY, 2)
                    );
                    
                    // Также проверяем, что пользователь прошел достаточно пути (хотя бы половину круга)
                    if (distanceToStart <= 30 && userPath.length > 50) {
                        completePathExercise();
                        return;
                    }
                }
            }
        } else if (currentExercise.type === 'path-arcs') {
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
                        Math.pow(pos.x - endX_point, 2) + 
                        Math.pow(pos.y - endY_point, 2)
                    );
                    
                    if (distanceToFinish <= 30) {
                        completePathExercise();
                        return;
                    }
                }
            }
        } else if (currentExercise.type === 'path-loops') {
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
                    const endY = centerY + Math.sin(finalAngle) * waveHeight / 2;
                    
                    const distanceToFinish = Math.sqrt(
                        Math.pow(pos.x - waveEndX, 2) + 
                        Math.pow(pos.y - endY, 2)
                    );
                    
                    if (distanceToFinish <= 40) { // Увеличенная зона финиша для мобильных
                        completePathExercise();
                        return;
                    }
                }
            }
        }
    } else if (finishZone) {
        // Для обычных упражнений - проверяем единственную финишную зону
        const distanceToFinish = Math.sqrt(
            Math.pow(pos.x - finishZone.x, 2) + 
            Math.pow(pos.y - finishZone.y, 2)
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
            Math.pow(point.x - pathPoint.x, 2) + 
            Math.pow(point.y - pathPoint.y, 2)
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
    if (currentExercise && currentExercise.type === 'path-spiral') {
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
            
            if (currentExercise.type === 'path-lines') {
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
            } else if (currentExercise.type === 'path-diagonal') {
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
                            Math.pow(lastPoint.x - x2, 2) + 
                            Math.pow(lastPoint.y - y2, 2)
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
                            Math.pow(lastPoint.x - x2, 2) + 
                            Math.pow(lastPoint.y - y2, 2)
                        );
                        
                        if (distance < minDistance && distance <= 30) {
                            minDistance = distance;
                            completedLine = i + 4;
                        }
                    }
                }
            } else if (currentExercise.type === 'path-circles') {
                // Круги
                const radius = Math.min(28, canvas.width * 0.055);
                const leftX = canvas.width * 0.28;
                const rightX = canvas.width * 0.72;
                const topY = canvas.height * 0.25;
                const middleY = canvas.height * 0.5;
                const bottomY = canvas.height * 0.75;
                
                const circlePositions = [
                    { x: leftX, y: topY },     // 0: левый верхний
                    { x: leftX, y: middleY },  // 1: левый средний
                    { x: leftX, y: bottomY },  // 2: левый нижний
                    { x: rightX, y: topY },    // 3: правый верхний
                    { x: rightX, y: middleY }, // 4: правый средний
                    { x: rightX, y: bottomY }  // 5: правый нижний
                ];
                
                for (let i = 0; i < totalSubTasks; i++) {
                    if (!completedSubTasks.includes(i)) {
                        const cx = circlePositions[i].x;
                        const cy = circlePositions[i].y;
                        const startY = cy - radius;
                        const distance = Math.sqrt(
                            Math.pow(lastPoint.x - cx, 2) + 
                            Math.pow(lastPoint.y - startY, 2)
                        );
                        
                        if (distance < minDistance && distance <= 30) {
                            minDistance = distance;
                            completedLine = i;
                        }
                    }
                }
            } else if (currentExercise.type === 'path-arcs') {
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
            } else if (currentExercise.type === 'path-loops') {
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
                        const endY = centerY + Math.sin(finalAngle) * waveHeight / 2;
                        
                        const distance = Math.sqrt(
                            Math.pow(lastPoint.x - waveEndX, 2) + 
                            Math.pow(lastPoint.y - endY, 2)
                        );
                        
                        if (distance < minDistance && distance <= 40) { // Увеличенная зона для мобильных
                            minDistance = distance;
                            completedLine = i;
                        }
                    }
                }
            }
            
            if (completedLine !== -1) {
                // Отмечаем линию как завершенную
                completedSubTasks.push(completedLine);
                
                const feedback = document.getElementById('feedback');
                
                // Проверяем, все ли линии завершены
                if (completedSubTasks.length >= totalSubTasks) {
                    // Все линии завершены - переход к следующему упражнению
                    exerciseCompleted = true;
                    isDrawing = false;
                    
                    feedback.textContent = `🎉 Идеально! Все ${totalSubTasks} линии выполнены!`;
                    feedback.className = 'feedback';
                    feedback.classList.remove('hidden');
                    
                    // Автоматический переход к следующему упражнению
                    setTimeout(() => {
                        nextExercise();
                    }, 1500);
                } else {
                    // Еще есть незавершенные линии
                    feedback.textContent = `✓ Отлично! Линия ${completedSubTasks.length} из ${totalSubTasks}. Проведи остальные!`;
                    feedback.className = 'feedback';
                    feedback.classList.remove('hidden');
                    
                    // Через 1 секунду перерисовываем
                    setTimeout(() => {
                        clearCanvas();
                        drawExerciseTemplate(currentExercise);
                        feedback.classList.add('hidden');
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
            
            const feedback = document.getElementById('feedback');
            
            // Специальное сообщение для спирали с учетом допустимых ошибок
            if (currentExercise && currentExercise.type === 'path-spiral') {
                if (exitCount === 0) {
                    feedback.textContent = '🎉 Идеально! Переход к следующему уровню!';
                } else {
                    feedback.textContent = `✅ Отлично! ${exitCount} касаний границ (до 3 разрешено)`;
                }
            } else {
                feedback.textContent = '🎉 Идеально! Переход к следующему уровню!';
            }
            
            feedback.className = 'feedback';
            feedback.classList.remove('hidden');
            
            setTimeout(() => {
                nextExercise();
            }, 1500);
        }
    } else {
        // Если были ошибки - не засчитываем, заставляем пройти заново
        isDrawing = false;
        
        const feedback = document.getElementById('feedback');
        
        // Специальное сообщение об ошибке для спирали
        if (currentExercise && currentExercise.type === 'path-spiral') {
            feedback.textContent = `⚠️ Слишком много касаний границ (${exitCount}/3). Попробуй аккуратнее!`;
        } else {
            feedback.textContent = '⚠️ Были выходы за границы. Попробуй еще раз!';
        }
        
        feedback.className = 'feedback error';
        feedback.classList.remove('hidden');
        
        // Через 1.5 секунды очищаем и даем пройти уровень заново
        setTimeout(() => {
            clearCanvas();
            drawExerciseTemplate(currentExercise);
            feedback.classList.add('hidden');
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
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(finishZone.x, finishZone.y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Белая галочка
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(finishZone.x - 8, finishZone.y);
    ctx.lineTo(finishZone.x - 2, finishZone.y + 6);
    ctx.lineTo(finishZone.x + 8, finishZone.y - 6);
    ctx.stroke();
}

// Вибрация устройства
function vibrateDevice() {
    if ('vibrate' in navigator) {
        navigator.vibrate(50); // 50ms вибрация
    }
}
// Шаблоны упражнений
function drawExerciseTemplate(exercise) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    switch(exercise.type) {
        // Модуль 1: Точечные упражнения
        case 'point-center':
            drawCenterTarget();
            break;
        case 'point-top':
            drawTopTarget();
            break;
        case 'point-bottom':
            drawBottomTarget();
            break;
        case 'point-left':
            drawLeftTarget();
            break;
        case 'point-right':
            drawRightTarget();
            break;
        
        // Модуль 2: Дорожки
        case 'path-straight':
            drawStraightPath();
            break;
        case 'path-vertical':
            drawVerticalPath();
            break;
        case 'path-zigzag':
            drawZigzagPath();
            break;
        case 'path-wave':
            drawWavePath();
            break;
        case 'path-spiral':
            drawSpiralPath();
            break;
        
        // Модуль 3: Базовые элементы
        case 'path-lines':
            drawPathLines();
            break;
        case 'path-diagonal':
            drawPathDiagonal();
            break;
        case 'path-circles':
            drawPathCircles();
            break;
        case 'path-arcs':
            drawPathArcs();
            break;
        case 'path-loops':
            drawPathLoops();
            break;
        
        // Модуль 4: Серийность движений
        case 'rhythmic-fence':
            drawRhythmicFence();
            break;
        case 'wave-cliff':
            drawWaveCliff();
            break;
        case 'rhythmic-spiral':
            drawRhythmicSpiral();
            break;
        case 'meander-wall':
            drawMeanderWall();
            break;
        case 'combined-chain':
            drawCombinedChain();
            break;
        
        // Модуль 5: Зрительно-моторное соотнесение
        case 'mirror-tree':
            drawMirrorTreeTemplate();
            break;
        case 'pattern-dots':
            drawPatternDots();
            break;
        
        // Модуль 6: Графические диктанты
        case 'grid-square':
        case 'grid-mountain':
        case 'grid-snake':
        case 'grid-heart':
        case 'grid-triangle':
            drawGridTemplate();
            break;
        
        // Другие модули
        case 'line':
            drawLineGuide();
            break;
        case 'path':
            drawPath();
            break;
        case 'wave':
            drawWaveGuide();
            break;
        case 'lines':
            drawLinesTemplate();
            break;
        case 'ovals':
            drawOvalsTemplate();
            break;
        case 'pattern':
            drawPatternTemplate();
            break;
        case 'copy':
            drawCopyTemplate();
            break;
        case 'grid':
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
    ctx.strokeStyle = '#e0e0e0';
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
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    // Центральная точка
    ctx.fillStyle = '#667eea';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
}

function drawTopTarget() {
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.25; // Поднимаем выше - 25% от верха
    
    targetZone = { x: cx, y: cy, radius: 50 };
    
    // Стрелка вверх
    ctx.strokeStyle = '#667eea';
    ctx.fillStyle = '#667eea';
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
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = '#667eea';
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
    ctx.strokeStyle = '#667eea';
    ctx.fillStyle = '#667eea';
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
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = '#667eea';
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
    ctx.strokeStyle = '#667eea';
    ctx.fillStyle = '#667eea';
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
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = '#667eea';
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
    ctx.strokeStyle = '#667eea';
    ctx.fillStyle = '#667eea';
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
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = '#667eea';
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
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = Math.min(35, canvas.width * 0.08); // Адаптивная толщина
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
    
    // Целевая траектория (пунктир)
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Стартовая точка
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(startX, y, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Финишная зона
    finishZone = { x: endX, y: y, radius: 30 };
    ctx.strokeStyle = '#ff9800';
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
    const startY = canvas.height - (canvas.height - totalHeight) / 2 - totalHeight * 0.1; // Немного выше центра
    const endY = startY - totalHeight;
    
    pathPoints = [];
    for (let y = startY; y >= endY; y -= 5) {
        pathPoints.push({ x: x, y: y });
    }
    
    // Фон дорожки
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = Math.min(35, canvas.width * 0.08); // Адаптивная толщина
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
    
    // Целевая траектория
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Стартовая точка
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(x, startY, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Финишная зона
    finishZone = { x: x, y: endY, radius: 30 };
    ctx.strokeStyle = '#ff9800';
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
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = Math.min(35, canvas.width * 0.08); // Адаптивная толщина
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    
    ctx.moveTo(startX, startY);
    
    for (let i = 0; i <= segments; i++) {
        const x = startX + i * segmentWidth;
        const y = i % 2 === 0 ? centerY - amplitude : centerY + amplitude;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Целевая траектория (пунктир)
    ctx.strokeStyle = '#667eea';
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
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(startX, startY, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Финишная зона (на последней вершине зигзага)
    const finalY = segments % 2 === 0 ? centerY - amplitude : centerY + amplitude;
    finishZone = { x: endX, y: finalY, radius: 30 };
    ctx.strokeStyle = '#ff9800';
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
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = Math.min(35, canvas.width * 0.08); // Адаптивная толщина
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, centerY);
    
    for (let x = startX; x <= endX; x += 5) {
        const y = centerY + Math.sin((x - startX) * frequency) * amplitude;
        ctx.lineTo(x, y);
        pathPoints.push({ x: x, y: y });
    }
    ctx.stroke();
    
    // Целевая траектория
    ctx.strokeStyle = '#667eea';
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
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(startX, centerY, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Финишная зона
    const finalY = centerY + Math.sin((endX - startX) * frequency) * amplitude;
    finishZone = { x: endX, y: finalY, radius: 30 };
    ctx.strokeStyle = '#ff9800';
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
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 60; // Увеличена толщина с 40 до 60
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
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
    ctx.strokeStyle = '#667eea';
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
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Финишная зона (на конце спирали)
    const finalAngle = turns * Math.PI * 2;
    const finalX = centerX + Math.cos(finalAngle) * maxRadius;
    const finalY = centerY + Math.sin(finalAngle) * maxRadius;
    finishZone = { x: finalX, y: finalY, radius: 30 };
    ctx.strokeStyle = '#ff9800';
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
            ctx.strokeStyle = '#c8e6c9';
        } else {
            // Активные линии - обычный серый фон
            ctx.strokeStyle = '#e0e0e0';
        }
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY + lineLength);
        ctx.stroke();
        
        // Целевая траектория (пунктир)
        if (isCompleted) {
            ctx.strokeStyle = '#4caf50';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
        } else {
            ctx.strokeStyle = '#667eea';
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
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x, startY, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - pointSize * 0.4, startY);
            ctx.lineTo(x - pointSize * 0.1, startY + pointSize * 0.3);
            ctx.lineTo(x + pointSize * 0.4, startY - pointSize * 0.3);
            ctx.stroke();
        } else {
            // Зеленая точка на активных линиях
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x, startY, pointSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка
        if (isCompleted) {
            // Зеленая галочка на завершенных линиях
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x, startY + lineLength, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - pointSize * 0.4, startY + lineLength);
            ctx.lineTo(x - pointSize * 0.1, startY + lineLength + pointSize * 0.3);
            ctx.lineTo(x + pointSize * 0.4, startY + lineLength - pointSize * 0.3);
            ctx.stroke();
        } else {
            // Оранжевый финиш на активных линиях
            ctx.strokeStyle = '#ff9800';
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
        ctx.strokeStyle = isCompleted ? '#c8e6c9' : '#e0e0e0';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Целевая траектория
        ctx.strokeStyle = isCompleted ? '#4caf50' : '#667eea';
        ctx.lineWidth = 3;
        ctx.setLineDash(isCompleted ? [] : [10, 5]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Стартовая точка
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x1, y1, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1 - pointSize * 0.4, y1);
            ctx.lineTo(x1 - pointSize * 0.1, y1 + pointSize * 0.3);
            ctx.lineTo(x1 + pointSize * 0.4, y1 - pointSize * 0.3);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x1, y1, pointSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x2, y2, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x2 - pointSize * 0.4, y2);
            ctx.lineTo(x2 - pointSize * 0.1, y2 + pointSize * 0.3);
            ctx.lineTo(x2 + pointSize * 0.4, y2 - pointSize * 0.3);
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#ff9800';
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
        ctx.strokeStyle = isCompleted ? '#c8e6c9' : '#e0e0e0';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Целевая траектория
        ctx.strokeStyle = isCompleted ? '#4caf50' : '#667eea';
        ctx.lineWidth = 3;
        ctx.setLineDash(isCompleted ? [] : [10, 5]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Стартовая точка
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x1, y1, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1 - pointSize * 0.4, y1);
            ctx.lineTo(x1 - pointSize * 0.1, y1 + pointSize * 0.3);
            ctx.lineTo(x1 + pointSize * 0.4, y1 - pointSize * 0.3);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x1, y1, pointSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x2, y2, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x2 - pointSize * 0.4, y2);
            ctx.lineTo(x2 - pointSize * 0.1, y2 + pointSize * 0.3);
            ctx.lineTo(x2 + pointSize * 0.4, y2 - pointSize * 0.3);
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#ff9800';
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
    const topY = canvas.height * 0.25;    // Верхний круг
    const middleY = canvas.height * 0.5;  // Средний круг
    const bottomY = canvas.height * 0.75; // Нижний круг
    
    pathPoints = [];
    
    // Позиции всех 6 кругов
    const circlePositions = [
        { x: leftX, y: topY },     // 0: левый верхний
        { x: leftX, y: middleY },  // 1: левый средний
        { x: leftX, y: bottomY },  // 2: левый нижний
        { x: rightX, y: topY },    // 3: правый верхний
        { x: rightX, y: middleY }, // 4: правый средний
        { x: rightX, y: bottomY }  // 5: правый нижний
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
        ctx.strokeStyle = isCompleted ? '#c8e6c9' : '#e0e0e0';
        ctx.lineWidth = Math.min(16, canvas.width * 0.028); // Уменьшенная толщина
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Целевая траектория
        ctx.strokeStyle = isCompleted ? '#4caf50' : '#667eea';
        ctx.lineWidth = 3;
        ctx.setLineDash(isCompleted ? [] : [10, 5]);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Стартовая точка (сверху круга)
        const pointSize = Math.min(12, canvas.width * 0.025);
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(cx, cy - radius, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx - pointSize * 0.4, cy - radius);
            ctx.lineTo(cx - pointSize * 0.1, cy - radius + pointSize * 0.3);
            ctx.lineTo(cx + pointSize * 0.4, cy - radius - pointSize * 0.3);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(cx, cy - radius, pointSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка (тоже сверху круга, рядом со стартом)
        if (!isCompleted) {
            ctx.strokeStyle = '#ff9800';
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
    const topY1 = canvas.height * 0.18;    // Первая дуга (выше)
    const topY2 = canvas.height * 0.33;    // Вторая дуга
    const topY3 = canvas.height * 0.5;     // Третья дуга (центр)
    const topY4 = canvas.height * 0.67;    // Четвертая дуга
    const topY5 = canvas.height * 0.82;    // Пятая дуга (ниже)
    
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
        ctx.strokeStyle = isCompleted ? '#c8e6c9' : '#e0e0e0';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(centerX, cy, radius, startAngle, endAngle);
        ctx.stroke();
        
        // Целевая траектория
        ctx.strokeStyle = isCompleted ? '#4caf50' : '#667eea';
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
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(startX_point, startY_point, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(startX_point - pointSize * 0.4, startY_point);
            ctx.lineTo(startX_point - pointSize * 0.1, startY_point + pointSize * 0.3);
            ctx.lineTo(startX_point + pointSize * 0.4, startY_point - pointSize * 0.3);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(startX_point, startY_point, pointSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка (справа)
        const endX_point = centerX + Math.cos(endAngle) * radius;
        const endY_point = cy + Math.sin(endAngle) * radius;
        if (!isCompleted) {
            ctx.strokeStyle = '#ff9800';
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
    const topY = canvas.height * 0.25;    // Верхняя пружинка
    const middleY = canvas.height * 0.5;  // Средняя пружинка
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
            const py = centerY + Math.sin(angle) * waveHeight / 2;
            
            pathPoints.push({ x: px, y: py });
        }
    }
    
    // Рисуем все 3 волнистые линии
    for (let i = 0; i < 3; i++) {
        const centerY = yPositions[i];
        const waveEndX = startX + waveWidth;
        const isCompleted = completedSubTasks.includes(i);
        
        // Фон волнистой линии (широкая серая зона для мобильных)
        ctx.strokeStyle = isCompleted ? '#c8e6c9' : '#e0e0e0';
        ctx.lineWidth = Math.min(70, canvas.width * 0.12); // Адаптивная ширина зоны допуска
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        // Рисуем траекторию волнистой линии
        const totalSteps = 150;
        for (let j = 0; j <= totalSteps; j++) {
            const t = j / totalSteps;
            const px = startX + t * waveWidth;
            const angle = t * wavesPerLine * Math.PI * 2;
            const py = centerY + Math.sin(angle) * waveHeight / 2;
            
            if (j === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.stroke();
        
        // Целевая траектория (пунктир)
        ctx.strokeStyle = isCompleted ? '#4caf50' : '#667eea';
        ctx.lineWidth = 4;
        ctx.setLineDash(isCompleted ? [] : [15, 8]); // Крупный пунктир
        ctx.beginPath();
        
        for (let j = 0; j <= totalSteps; j++) {
            const t = j / totalSteps;
            const px = startX + t * waveWidth;
            const angle = t * wavesPerLine * Math.PI * 2;
            const py = centerY + Math.sin(angle) * waveHeight / 2;
            
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
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(startX, centerY, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(startX - pointSize * 0.4, centerY);
            ctx.lineTo(startX - pointSize * 0.1, centerY + pointSize * 0.3);
            ctx.lineTo(startX + pointSize * 0.4, centerY - pointSize * 0.3);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(startX, centerY, pointSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка (справа)
        const finalAngle = wavesPerLine * Math.PI * 2;
        const endY = centerY + Math.sin(finalAngle) * waveHeight / 2;
        if (!isCompleted) {
            ctx.strokeStyle = '#ff9800';
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
    const tallHeight = Math.min(80, canvas.height * 0.2);   // Высота четных зубцов
    const shortHeight = tallHeight / 2;                      // Высота нечетных зубцов (в 2 раза ниже)
    
    const tallTopY = baseY - tallHeight;    // Вершина четных (высоких) зубцов
    const shortTopY = baseY - shortHeight;  // Вершина нечетных (низких) зубцов
    
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
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = Math.min(35, canvas.width * 0.08);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    
    if (pathPoints.length > 0) {
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) {
            ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
        }
    }
    ctx.stroke();
    
    // Целевая траектория (пунктир)
    ctx.strokeStyle = '#667eea';
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
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(startX, baseY, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Финишная зона
    finishZone = { x: endX, y: baseY, radius: 30 };
    ctx.strokeStyle = '#ff9800';
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
        const isWave = (i % 2 === 0); // Четные индексы (0,2,4,6) - волны, нечетные (1,3,5) - углы
        
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
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = Math.min(35, canvas.width * 0.08);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    
    if (pathPoints.length > 0) {
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) {
            ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
        }
    }
    ctx.stroke();
    
    // Целевая траектория (пунктир)
    ctx.strokeStyle = '#667eea';
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
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.arc(pathPoints[0].x, pathPoints[0].y, 12, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Финишная зона
    if (pathPoints.length > 0) {
        const lastPoint = pathPoints[pathPoints.length - 1];
        finishZone = { x: lastPoint.x, y: lastPoint.y, radius: 30 };
        ctx.strokeStyle = '#ff9800';
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
    const pattern = ['big', 'small', 'small', 'big', 'small', 'small'];
    
    // Вычисляем общую ширину
    const totalWidth = canvas.width * 0.75;
    const startX = (canvas.width - totalWidth) / 2;
    
    // Вычисляем ширину каждой петли с учетом их размеров
    const bigWidth = bigRadius * 2.2; // Ширина большой петли с запасом
    const smallWidth = smallRadius * 2.2; // Ширина маленькой петли с запасом
    
    pathPoints = [];
    let currentX = startX;
    
    // Генерируем точки траектории для каждой петли
    for (let i = 0; i < pattern.length; i++) {
        const isBig = pattern[i] === 'big';
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
        const isBig = pattern[i] === 'big';
        const radius = isBig ? bigRadius : smallRadius;
        const loopWidth = isBig ? bigWidth : smallWidth;
        const lineWidth = isBig ? Math.min(40, canvas.width * 0.09) : Math.min(30, canvas.width * 0.065);
        
        const centerX = currentX + loopWidth / 2;
        const centerY = baseY - radius;
        
        // Рисуем серую зону для этой петли
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        currentX += loopWidth;
    }
    
    // Целевая траектория (пунктир)
    ctx.strokeStyle = '#667eea';
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
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.arc(pathPoints[0].x, pathPoints[0].y, 12, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Финишная зона (внизу последней петли)
    if (pathPoints.length > 0) {
        const lastPoint = pathPoints[pathPoints.length - 1];
        finishZone = { x: lastPoint.x, y: lastPoint.y, radius: 30 };
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 15, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Зубчатая стена (Меандр) - строго горизонтальные и вертикальные отрезки
function drawMeanderWall() {
    const startX = canvas.width * 0.1; // Начало слева
    const startY = canvas.height * 0.7; // Начало внизу
    
    const horizontalLength = Math.min(45, canvas.width * 0.09); // Длина горизонтального отрезка
    const verticalLength = Math.min(50, canvas.height * 0.12); // Длина вертикального отрезка
    const cycles = 5; // Количество циклов (вправо-вверх-вправо-вниз)
    
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
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = Math.min(35, canvas.width * 0.08);
    ctx.lineCap = 'butt'; // Прямые углы без скругления
    ctx.lineJoin = 'miter'; // Острые углы
    ctx.beginPath();
    
    if (pathPoints.length > 0) {
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) {
            ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
        }
    }
    ctx.stroke();
    
    // Целевая траектория (пунктир)
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.lineCap = 'butt'; // Прямые углы
    ctx.lineJoin = 'miter'; // Острые углы
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
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.arc(pathPoints[0].x, pathPoints[0].y, 12, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Финишная зона
    if (pathPoints.length > 0) {
        const lastPoint = pathPoints[pathPoints.length - 1];
        finishZone = { x: lastPoint.x, y: lastPoint.y, radius: 30 };
        ctx.strokeStyle = '#ff9800';
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
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = Math.min(35, canvas.width * 0.08); // Одинаковая ширина по всей длине
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    
    if (pathPoints.length > 0) {
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) {
            ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
        }
    }
    ctx.stroke();
    
    // Целевая траектория (пунктир)
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
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
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.arc(pathPoints[0].x, pathPoints[0].y, 12, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Финишная зона
    if (pathPoints.length > 0) {
        const lastPoint = pathPoints[pathPoints.length - 1];
        finishZone = { x: lastPoint.x, y: lastPoint.y, radius: 30 };
        ctx.strokeStyle = '#ff9800';
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
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(gridOffsetX, gridOffsetY, totalGridWidth, totalGridHeight);
    
    // Рисуем линии сетки (светло-серые)
    ctx.strokeStyle = '#d0d0d0';
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
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(centerPixelX, gridOffsetY);
    ctx.lineTo(centerPixelX, gridOffsetY + totalGridHeight);
    ctx.stroke();
    
    // ============================================
    // ЛЕВАЯ ЧАСТЬ: ВИДИМЫЙ ОБРАЗЕЦ (черные линии)
    // ============================================
    if (mirrorTreeSegments.length > 0) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
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
        ctx.strokeStyle = '#2196f3';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
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

function drawPatternDots() {
    // Инициализируем координаты точек в пиксели
    const sideWidth = canvas.width / 2;
    const sideHeight = canvas.height;
    
    // Преобразуем относительные координаты в пиксели
    const pixelPoints = patternPoints.map(point => ({
        x: point.x * sideWidth,
        y: point.y * sideHeight
    }));
    
    // ============================================
    // ЛЕВАЯ ЧАСТЬ: ОБРАЗЕЦ (эталонный узор)
    // ============================================
    
    // Рисуем точки образца
    ctx.fillStyle = '#333333';
    for (let i = 0; i < pixelPoints.length; i++) {
        // Выделяем стартовую точку синим цветом
        if (i === patternStartPoint) {
            ctx.fillStyle = '#2196f3'; // Яркий синий для стартовой точки
        } else {
            ctx.fillStyle = '#333333'; // Серый для остальных
        }
        
        ctx.beginPath();
        ctx.arc(pixelPoints[i].x, pixelPoints[i].y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Рисуем линии образца
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    for (let i = 0; i < patternReference.length; i++) {
        const [startIdx, endIdx] = patternReference[i];
        const start = pixelPoints[startIdx];
        const end = pixelPoints[endIdx];
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
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
    
    // Рисуем точки справа (с подсветкой использованных и стартовой)
    for (let i = 0; i < pixelPoints.length; i++) {
        // Выделяем стартовую точку синим цветом
        if (i === patternStartPoint) {
            ctx.fillStyle = '#2196f3'; // Яркий синий для стартовой точки
            ctx.beginPath();
            ctx.arc(rightOffset + pixelPoints[i].x, pixelPoints[i].y, dotRadius + 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (usedPoints.has(i)) {
            // Использованная точка - желтая подсветка
            ctx.fillStyle = '#ffeb3b';
            ctx.beginPath();
            ctx.arc(rightOffset + pixelPoints[i].x, pixelPoints[i].y, dotRadius + 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Сама точка - зеленая
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.arc(rightOffset + pixelPoints[i].x, pixelPoints[i].y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Рисуем линии, которые провел пользователь (ЖИРНЫЕ И ЯРКИЕ)
    ctx.strokeStyle = '#1976d2'; // Более яркий синий
    ctx.lineWidth = 5; // Увеличенная толщина
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    for (let i = 0; i < userConnections.length; i++) {
        const [startIdx, endIdx] = userConnections[i];
        const start = pixelPoints[startIdx];
        const end = pixelPoints[endIdx];
        
        ctx.beginPath();
        ctx.moveTo(rightOffset + start.x, start.y);
        ctx.lineTo(rightOffset + end.x, end.y);
        ctx.stroke();
    }
    
    // Рисуем временную линию при перемещении (ЖИРНЕЕ)
    if (activePoint !== null && tempLine !== null) {
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 4; // Увеличенная толщина
        ctx.setLineDash([5, 5]);
        
        const activePointPixel = pixelPoints[activePoint];
        ctx.beginPath();
        ctx.moveTo(rightOffset + activePointPixel.x, activePointPixel.y);
        ctx.lineTo(tempLine.x, tempLine.y);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }
    
    // Подсвечиваем активную точку (КРАСНАЯ)
    if (activePoint !== null) {
        const activePointPixel = pixelPoints[activePoint];
        ctx.fillStyle = '#ff5252';
        ctx.beginPath();
        ctx.arc(rightOffset + activePointPixel.x, activePointPixel.y, dotRadius + 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================
// PATTERN-DOTS: Вспомогательные функции
// ============================================

function getPointAtPosition(x, y) {
    // Находит ближайшую точку в пределах допуска
    const sideWidth = canvas.width / 2;
    const sideHeight = canvas.height;
    const rightOffset = sideWidth;
    
    // Проверяем, находимся ли мы в правой половине (поле ввода)
    if (x < rightOffset) {
        return null; // Только правая половина
    }
    
    // Преобразуем относительные координаты в пиксели
    const pixelPoints = patternPoints.map(point => ({
        x: point.x * sideWidth,
        y: point.y * sideHeight
    }));
    
    // Ищем ближайшую точку с увеличенным допуском (магнит 25px)
    let closestPoint = null;
    let minDistance = 25; // Увеличенный допуск для лучшей "магнитности"
    
    for (let i = 0; i < pixelPoints.length; i++) {
        const px = rightOffset + pixelPoints[i].x;
        const py = pixelPoints[i].y;
        
        // Корректно вычисляем расстояние
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
            if ((a === startIdx && b === endIdx) || (a === endIdx && b === startIdx)) {
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
    
    const pos = getPosition(e);
    const endPointIdx = getPointAtPosition(pos.x, pos.y);
    
    // Линия фиксируется только если палец находится рядом с точкой
    if (endPointIdx !== null && endPointIdx !== activePoint) {
        // Проверяем, валидно ли это соединение
        if (isValidConnection(activePoint, endPointIdx)) {
            // Проверяем, не добавлено ли уже это соединение
            let alreadyExists = false;
            for (let i = 0; i < userConnections.length; i++) {
                const [a, b] = userConnections[i];
                if ((a === activePoint && b === endPointIdx) || (a === endPointIdx && b === activePoint)) {
                    alreadyExists = true;
                    break;
                }
            }
            
            if (!alreadyExists) {
                // Добавляем соединение
                userConnections.push([activePoint, endPointIdx]);
                
                // Проверяем, завершен ли узор (все 8 сегментов)
                if (checkPatternCompletion()) {
                    completePatternDotsExercise();
                } else {
                    // Показываем успех для этого соединения
                    showPatternFeedback('✓ Правильно!');
                }
            } else {
                showPatternFeedback('⚠️ Уже соединено!');
            }
        } else {
            showPatternFeedback('✗ Неправильно!');
        }
    }
    // Если палец отпущен далеко от точек - временная линия сбрасывается
    
    // Сбрасываем активную точку
    activePoint = null;
    tempLine = null;
    
    // Перерисовываем холст
    clearCanvas();
    drawPatternDots();
}

function showPatternFeedback(message) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = 'feedback success';
    feedback.classList.remove('hidden');
    
    // Скрываем через 1.5 секунды
    setTimeout(() => {
        feedback.classList.add('hidden');
    }, 1500);
}

function completePatternDotsExercise() {
    exerciseCompleted = true;
    
    const feedback = document.getElementById('feedback');
    feedback.textContent = '🎉 Отлично! Узор готов!';
    feedback.className = 'feedback success';
    feedback.classList.remove('hidden');
    
    // Показываем кнопку "Дальше"
    document.getElementById('next-level-btn').classList.remove('hidden');
    
    // Обновляем статистику
    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000;
    stats.successfulExercises++;
    stats.totalTime += timeTaken;
    saveStats();
}

// Остальные шаблоны (для других модулей)
function drawLineGuide() {
    const y = canvas.height / 2;
    ctx.strokeStyle = '#e0e0e0';
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
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 60;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(50, startY);
    ctx.lineTo(canvas.width - 50, startY);
    ctx.stroke();
    
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(50, startY);
    ctx.lineTo(canvas.width - 50, startY);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawWaveGuide() {
    ctx.strokeStyle = '#e0e0e0';
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
    ctx.strokeStyle = '#e0e0e0';
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
    ctx.strokeStyle = '#e0e0e0';
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
    ctx.strokeStyle = '#e0e0e0';
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
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Левая половина - образец
    ctx.beginPath();
    ctx.arc(100, y, 40, 0, Math.PI * 2);
    ctx.stroke();
    
    // Правая половина - для копирования
    ctx.strokeStyle = '#667eea';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, y, 40, 0, Math.PI, true);
    ctx.stroke();
    
    ctx.setLineDash([]);
}

function drawGrid() {
    const gridSize = 40;
    const startX = 50;
    const startY = 50;
    
    ctx.strokeStyle = '#e0e0e0';
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
    ctx.fillStyle = '#667eea';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Упражнение в разработке', canvas.width / 2, canvas.height / 2);
}

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
    if (currentExercise && (currentExercise.type === 'grid-mountain' || currentExercise.type === 'grid-snake' || currentExercise.type === 'grid-heart')) {
        ctx.fillStyle = '#f0fff0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Рисуем фон сетки (светло-зеленый как в школьной тетради)
    ctx.fillStyle = '#e8f5e9';
    ctx.fillRect(gridStartX, gridStartY, totalGridWidth, totalGridHeight);
    
    // Рисуем линии сетки
    if (currentExercise && (currentExercise.type === 'grid-mountain' || currentExercise.type === 'grid-snake' || currentExercise.type === 'grid-heart')) {
        ctx.strokeStyle = '#b2dfb2';
        ctx.lineWidth = 1;
    } else {
        ctx.strokeStyle = '#c8e6c9';
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
    if (currentExercise && currentExercise.type === 'grid-mountain') {
        // Для горки - 1 клетка от левого края, 80% от верха
        currentGridX = 1;
        currentGridY = Math.floor(gridRows * 0.8);
    } else if (currentExercise && currentExercise.type === 'grid-snake') {
        // Различаем упражнения типа grid-snake по названию
        if (currentExercise.title === 'Цифровая змейка') {
            // Траектория: 1 вправо → 1 вверх → 2 вправо → 1 вниз → 1 вправо → 2 вверх → 1 вправо → 2 вниз
            // Максимальные смещения: вправо = 5, вверх = 2, вниз = 1 (итоговое смещение)
            const maxRight = 5; // суммарное движение вправо
            const maxUp = 2;    // максимальное движение вверх от стартовой точки
            const maxDown = 1;  // итоговое смещение вниз от стартовой точки
            
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
        } else if (currentExercise.title === 'Волшебный цилиндр') {
            // Траектория: 1→, 3↑, 2→, 3↓, 1→, 1↓, 4←, 1↑
            // Максимальные смещения: вправо = 4, вверх = 3, вниз = 4 (промежуточное)
            // Итоговые размеры фигуры: ширина = 4, высота = 4 (с учетом промежуточных позиций)
            const figureWidth = 4;  // максимальная ширина фигуры
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
    } else if (currentExercise && currentExercise.type === 'grid-heart') {
        // Для сердечка - рассчитываем стартовую позицию для фигуры 7x7
        // Траектория сердечка требует достаточно места во всех направлениях
        const figureWidth = 7;  // максимальная ширина сердечка
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
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(startPixelX, startPixelY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Белый центр для контраста
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(startPixelX, startPixelY, 4, 0, Math.PI * 2);
    ctx.fill();
}

// Рисование подсветки целевых клеток для змейки
function drawSnakeTargetCells() {
    if (!currentExercise || currentExercise.type !== 'grid-snake') return;
    
    // Симулируем путь змейки для подсветки целевых клеток
    let tempX = currentGridX;
    let tempY = currentGridY;
    
    // Рисуем светло-зеленую подсветку для каждой целевой клетки
    ctx.fillStyle = 'rgba(144, 238, 144, 0.4)'; // Светло-зеленый с прозрачностью
    
    // Подсвечиваем стартовую клетку
    const startCellX = gridStartX + tempX * gridSize;
    const startCellY = gridStartY + tempY * gridSize;
    ctx.fillRect(startCellX + 1, startCellY + 1, gridSize - 2, gridSize - 2);
    
    // Проходим по всей траектории и подсвечиваем каждую клетку
    for (let i = 0; i < targetSequence.length; i++) {
        const direction = targetSequence[i];
        
        // Вычисляем следующую позицию
        switch (direction) {
            case 'up':
                tempY--;
                break;
            case 'down':
                tempY++;
                break;
            case 'left':
                tempX--;
                break;
            case 'right':
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
        if (currentExercise && currentExercise.type === 'grid-mountain') {
            showGridMountainError();
        } else if (currentExercise && (currentExercise.type === 'grid-snake' || currentExercise.type === 'grid-heart')) {
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
        case 'up':
            newY--;
            break;
        case 'down':
            newY++;
            break;
        case 'left':
            newX--;
            break;
        case 'right':
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
    document.getElementById('current-step').textContent = userSequence.length.toString();
    
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
    ctx.strokeStyle = '#000000';
    // Для grid-mountain используем толщину 3px, для остальных 4px
    if (currentExercise && currentExercise.type === 'grid-mountain') {
        ctx.lineWidth = 3;
    } else {
        ctx.lineWidth = 4;
    }
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fromPixelX, fromPixelY);
    ctx.lineTo(toPixelX, toPixelY);
    ctx.stroke();
}

// Показ ошибки для упражнения "Лесенка-горка"
function showGridMountainError() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = '🎯 Сбился с ритма! Посмотри на схему еще раз';
    feedback.className = 'feedback error';
    feedback.classList.remove('hidden');
    
    // Вибрация при ошибке
    vibrateDevice();
    
    // Через 2 секунды сбрасываем упражнение
    setTimeout(() => {
        resetGridExercise();
        feedback.classList.add('hidden');
    }, 2000);
}

// Показ ошибки
function showGridError() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = '❌ Ой, не туда! Попробуй еще раз';
    feedback.className = 'feedback error';
    feedback.classList.remove('hidden');
    
    // Вибрация при ошибке
    vibrateDevice();
    
    // Через 1.5 секунды сбрасываем упражнение
    setTimeout(() => {
        resetGridExercise();
        feedback.classList.add('hidden');
    }, 1500);
}

// Завершение упражнения
function completeGridExercise() {
    exerciseCompleted = true;
    
    const feedback = document.getElementById('feedback');
    
    // Специальные сообщения для разных упражнений
    let message = '🎉 Отлично! Фигура готова!';
    if (currentExercise && currentExercise.type === 'grid-square') {
        message = '🎉 Квадрат готов! Отличная работа!';
    } else if (currentExercise && currentExercise.type === 'grid-mountain') {
        message = '🏔 Гора покорена! Ты настоящий альпинист!';
    } else if (currentExercise && currentExercise.type === 'grid-snake') {
        // Различаем упражнения типа grid-snake по названию
        if (currentExercise.title === 'Цифровая змейка') {
            message = '🐍 Змейка готова! Отличная переключаемость внимания!';
        } else if (currentExercise.title === 'Волшебный цилиндр') {
            message = '🎩 Алле-оп! Шляпа готова. Что спрятал там фокусник?';
        } else {
            message = '🐍 Змейка готова! Отличная переключаемость внимания!';
        }
    } else if (currentExercise && currentExercise.type === 'grid-heart') {
        message = '❤️ Потрясающе! Ты нарисовал сердечко и успешно прошел весь модуль графических диктантов! Ты настоящий мастер!';
    } else if (currentExercise && currentExercise.type === 'grid-triangle') {
        message = '🎉 Треугольник готов! Красивая крыша!';
    }
    
    feedback.textContent = message;
    feedback.className = 'feedback';
    feedback.classList.remove('hidden');
    
    // Показываем кнопку "Дальше" для ручного перехода
    document.getElementById('next-level-btn').classList.remove('hidden');
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
    
    if (currentExercise && currentExercise.type === 'grid-mountain') {
        currentGridX = 1;
        currentGridY = Math.floor(gridRows * 0.8);
    } else if (currentExercise && currentExercise.type === 'grid-snake') {
        // Различаем упражнения типа grid-snake по названию
        if (currentExercise.title === 'Цифровая змейка') {
            // Траектория: 1 вправо → 1 вверх → 2 вправо → 1 вниз → 1 вправо → 2 вверх → 1 вправо → 2 вниз
            // Максимальные смещения: вправо = 5, вверх = 2, вниз = 1 (итоговое смещение)
            const maxRight = 5; // суммарное движение вправо
            const maxUp = 2;    // максимальное движение вверх от стартовой точки
            const maxDown = 1;  // итоговое смещение вниз от стартовой точки
            
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
        } else if (currentExercise.title === 'Волшебный цилиндр') {
            // Траектория: 1→, 3↑, 2→, 3↓, 1→, 1↓, 4←, 1↑
            // Максимальные смещения: вправо = 4, вверх = 3, вниз = 4 (промежуточное)
            // Итоговые размеры фигуры: ширина = 4, высота = 4 (с учетом промежуточных позиций)
            const figureWidth = 4;  // максимальная ширина фигуры
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
    } else if (currentExercise && currentExercise.type === 'grid-heart') {
        // Для сердечка - рассчитываем стартовую позицию для фигуры 7x7
        // Траектория сердечка требует достаточно места во всех направлениях
        const figureWidth = 7;  // максимальная ширина сердечка
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
        document.getElementById('next-level-btn').classList.remove('hidden');
    } else {
        // В других модулях скрываем кнопку "Дальше"
        document.getElementById('next-level-btn').classList.add('hidden');
    }
    
    // Обновляем счетчик
    document.getElementById('current-step').textContent = '0';
}