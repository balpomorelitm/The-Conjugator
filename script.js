document.addEventListener('DOMContentLoaded', () => {
  let selectedGameMode = 'infinite'; // Valor por defecto
  let allVerbData = [];
  let currentQuestion = {};
  let currentOptions = {};
  let score = 0, streak = 0, multiplier = 1.0, startTime = 0;
  let countdownTimer;
  let countdownTime = 240; // 4 minutes = 240 seconds
  let remainingLives = 5;
  let targetVolume=0.05;
  const setupScreen  = document.getElementById('setup-screen');
  const gameScreen   = document.getElementById('game-screen');
  const setupForm    = document.getElementById('setup-form');
  const quitButton   = document.getElementById('quit-button');
  const checkButton  = document.getElementById('check-button');
  const skipButton   = document.getElementById('skip-button');
  const endButton    = document.getElementById('end-button');
  const tenseSelect  = document.getElementById('tense-select');
  const scoreDisplay = document.getElementById('score-display');
  const rankingBox   = document.getElementById('ranking-box');
  const flameEl      = document.getElementById('flames');
  const gameTitle    = document.getElementById('game-title');
  const qPrompt      = document.getElementById('question-prompt');
  const ansES        = document.getElementById('answer-input-es');
  const ansEN        = document.getElementById('answer-input-en');
  const esContainer  = document.getElementById('input-es-container');
  const enContainer  = document.getElementById('input-en-container');
  const feedback     = document.getElementById('feedback-area');
  const titleElement = document.querySelector('.glitch-title');
  setInterval(() => {
    titleElement.classList.add('glitch-active');
    setTimeout(() => {
      titleElement.classList.remove('glitch-active');
    }, 600); // Glitch dura 0.5s
  }, 3000); // Cada 4s se activa el glitch
  const pronouns = ['yo','tú','él','nosotros','vosotros','ellos'];
  const pronounMap = {
    yo: ['I'],
    tú: ['you'],
    él: ['he', 'she'],
	usted: ['he', 'she'],
    nosotros: ['we'],
    vosotros: ['you'],
    ellos: ['they'],
    nosotras: ['we'], // Femenino plural
    vosotras: ['you'], // Femenino plural
    ellas: ['they'], // Femenino plural
    ustedes: ['you'] // Formal plural
};
  const irregularityTypes = [
    { value: 'regular', name: 'Regular', times: ['present', 'past_simple', 'present_perfect'], hint: '' }, // Sin pista específica
    { value: 'first_person_irregular', name: '1st Person', times: ['present'], hint: '⚙️ salir -> salgo' },
    { value: 'stem_changing', name: 'Stem Change', times: ['present'], hint: '⚙️ dormir -> duermo' },
    { value: 'multiple_irregularities', name: 'Multiple', times: ['present'], hint: '⚙️ tener -> tengo, tienes' },
    { value: 'y_change', name: 'Y Change', times: ['present','past_simple'], hint: '⚙️ oír -> oyes' },
    { value: 'irregular_root', name: 'Irreg. Root', times: ['past_simple'], hint: '⚙️ estar -> estuve' },
    { value: 'stem_change_3rd_person', name: 'Stem 3rd P.', times: ['past_simple'], hint: '⚙️ morir -> murió' },
    { value: 'totally_irregular', name: 'Totally Irreg.', times: ['past_simple'], hint: '⚙️ ser/ir -> fui' }, // Añadí esta que vi en tu JSON
    { value: 'irregular_participle', name: 'Irreg. Participle', times: ['present_perfect'], hint: '⚙️ ver -> visto' }
];
// ---> FIN AÑADIDO <---  
  const verbTypeLabels = Array.from(document.querySelectorAll('label[data-times]'));
  const soundCorrect = new Audio('sounds/correct.mp3');
  const soundWrong = new Audio('sounds/wrong.mp3');
  const soundClick = new Audio('sounds/click.mp3');
  const soundStart = new Audio('sounds/start-verb.mp3');
  const soundSkip = new Audio('sounds/skip.mp3');
  const music = new Audio('sounds/music.mp3');
  const soundGameOver = new Audio('sounds/gameover.mp3');
  music.loop = true;
  music.volume=0;             // empieza en silencio
  tenseSelect.addEventListener('change', filterVerbTypes);
  renderVerbTypeButtons(); // <<< --- LLAMAR AQUÍ
  filterVerbTypes(); // Mantener esto para el estado inicial
  tenseSelect.addEventListener('change', filterVerbTypes);
  // ... resto del código DOMContentLoaded ...
  document.querySelectorAll('input[type="checkbox"], input[type="radio"], select')
    .forEach(el => {
      el.addEventListener('change', () => {
        soundClick.play();
      });
    });

  // ---> REEMPLAZAR ESTA FUNCIÓN <---
function filterVerbTypes() {
  const selectedTense = tenseSelect.value;
  document.querySelectorAll('.verb-type-button').forEach(button => {
    const applicableTenses = button.dataset.times.split(',');
    if (applicableTenses.includes(selectedTense)) {
      // Habilitar y volver a seleccionar por defecto
      button.disabled = false;
      button.classList.remove('disabled');
      button.classList.add('selected');
    } else {
      // Deshabilitar y desmarcar
      button.disabled = true;
      button.classList.add('disabled');
      button.classList.remove('selected');
    }
  });
}

  // 1) Game-mode buttons (Infinite/Timer/Lives)
  const gameModeButtons = document.querySelectorAll('#game-modes .mode-button');
  gameModeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedGameMode = btn.dataset.mode;
      soundClick.play();
      gameModeButtons.forEach(b => b.classList.remove('selected-mode'));
      btn.classList.add('selected-mode');
      // … resto de tu lógica actual (filterVerbTypes, console.log, etc.)
      document.getElementById('setup-screen').style.display = 'block';
      filterVerbTypes();
      console.log('Selected mode:', selectedGameMode);
    });
  });

  // 2) Config-mode buttons (Produce/Recall)
  const configButtons = document.querySelectorAll('.config-button');
  configButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentOptions.mode = btn.dataset.mode;
      soundClick.play();
      configButtons.forEach(b => b.classList.remove('selected-mode'));
      btn.classList.add('selected-mode');
      // aquí pones sólo lo que quieras al cambiar Produce/Recall
      console.log('Selected config mode:', currentOptions.mode);
    });
  });


const musicToggle = document.getElementById('music-toggle');
const volumeSlider = document.getElementById('volume-slider');
volumeSlider.value = targetVolume;  
volumeSlider.addEventListener('input', () => {
  targetVolume = parseFloat(volumeSlider.value);
  music.volume = targetVolume;
});
let musicPlaying = false;

musicToggle.addEventListener('click', () => {
  if (music.paused) {
    music.volume = targetVolume;  // inicia directamente al 20%
    music.play();
    musicToggle.textContent = '🔊';
    volumeSlider.disabled = false;
  } else {
    music.pause();
    musicToggle.textContent = '🔇';
    volumeSlider.disabled = true;
  }
});
 // 1) Asegura que existen 3 "archivos" de ranking en localStorage
  function initRankingStorage() {
    ['infinite', 'timer', 'lives'].forEach(mode => {
      const key = `rankingHkuVerbGame_${mode}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }
    });
  }

  // 2) Renderiza en pantalla de Setup los top-5 de cada modo
  function renderSetupRecords() {
    const container = document.getElementById('setup-records');
    if (!container) return;  // Si no existe, salimos
    container.querySelectorAll('.mode-records').forEach(div => {
      const mode = div.dataset.mode;
      const key = `rankingHkuVerbGame_${mode}`;
      const R = JSON.parse(localStorage.getItem(key) || '[]').slice(0, 5);
      const ul = div.querySelector('.record-list');
      ul.innerHTML = ''; // limpia lista anterior
      R.forEach((entry, i) => {
        const medal = i === 0 ? '🥇'
                    : i === 1 ? '🥈'
                    : i === 2 ? '🥉'
                    : '';
        const li = document.createElement('li');
        li.textContent = `${medal} ${entry.name}: ${entry.score}`;
        ul.appendChild(li);
      });
    });
  }

  // 3) Inicializar y mostrar al cargar
  initRankingStorage();
  renderSetupRecords();

  function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }
function fadeIn(audio, to = 0.6, ms = 2000) {
  const steps = 30;
  const step = (to - audio.volume) / steps;
  let count = 0;
  const id = setInterval(() => {
    audio.volume = Math.min(to, audio.volume + step);
    if (++count >= steps) clearInterval(id);
  }, ms / steps);
}
// ---> REEMPLAZAR ESTA FUNCIÓN <---
async function loadVerbs() {
  let rawVerbData = [];
  try {
      const resp = await fetch(`verbos.json?cb=${Date.now()}`);
      if (!resp.ok) throw new Error('Network response was not ok');
      rawVerbData = await resp.json();
  } catch (error) {
      console.error("Error fetching raw verb data:", error);
      alert("Could not load verb data file.");
      return false; // Indicar fallo
  }


  // Obtener tipos seleccionados desde los BOTONES
  const selectedTypes = Array.from(
    document.querySelectorAll('.verb-type-button.selected') // Buscar botones con clase 'selected'
  ).map(button => button.dataset.value); // Obtener el valor guardado en data-value

  if (selectedTypes.length === 0) {
    alert('Please select at least one verb type.');
    // Reactivar el botón 'regular' por defecto si no hay nada seleccionado? Opcional.
    // const regularButton = document.querySelector('.verb-type-button[data-value="regular"]');
    // if(regularButton) regularButton.classList.add('selected');
    // selectedTypes.push('regular'); // Forzar selección de regular
    return false; // O simplemente no permitir continuar
  }

  // Filtrar los datos crudos según los tipos seleccionados Y el tiempo actual
  const filtered = rawVerbData.filter(v => {
    // Obtener los tipos definidos para este verbo EN EL TIEMPO ACTUAL
    const typesForTense = v.types[currentOptions.tense] || [];
    // Comprobar si ALGUNO de los tipos del verbo para este tiempo está en la lista de seleccionados
    return typesForTense.some(t => selectedTypes.includes(t));
  });

  if (filtered.length === 0) {
    alert('No verbs available for the selected tense and verb types.');
    return false;
  }

  // Guardar los verbos filtrados para usar en el juego
  allVerbData = filtered;
  console.log(`Filtered down to ${allVerbData.length} verbs for tense '${currentOptions.tense}' and types:`, selectedTypes);
  return true; // Indicar éxito
}
// ---> FIN REEMPLAZO <---

  function updateRanking() {
    const key = `rankingHkuVerbGame_${selectedGameMode}`;
    const R   = JSON.parse(localStorage.getItem(key) || '[]');
    rankingBox.innerHTML = '<h3>🏆 Top 5</h3>';
    R.forEach(entry => {
      rankingBox.innerHTML += `<div>${entry.name}: ${entry.score}</div>`;
    });
    // ← Aquí, tras actualizar el cuadro en juego, refrescamos el Setup
    renderSetupRecords();
  }

  function updateScore() {
    scoreDisplay.innerHTML =
      `<strong>🎯 Score:</strong> ${score}`
      + ` | <strong>🔥 Streak:</strong> ${streak}`
      + ` | <strong>×${multiplier.toFixed(1)}</strong>`;
    
    // Aquí agregamos el control de la vibración progresiva
    const maxStreakForFullFire = 15;
    const container = document.getElementById('score-container');
    const containerHeight = container.clientHeight;  // altura real incluyendo padding
    const fireHeight = Math.min(
      (streak / maxStreakForFullFire) * containerHeight,
      containerHeight
    );
    flameEl.style.height = `${fireHeight}px`;
    flameEl.style.opacity = streak > 0 ? '1' : '0';

    // Añadir vibración progresiva a la racha
    const streakElement = document.getElementById('streak-display');
    if (streak >= 2 && streak <= 8) {
        streakElement.classList.add('vibrate');
    } else {
        streakElement.classList.remove('vibrate');
    }
}

// --- Función para preparar y mostrar la siguiente pregunta (CORREGIDA para tu versión) ---
let usedVerbs = [];  // Array para almacenar los verbos ya seleccionados

// --- Función para preparar y mostrar la siguiente pregunta (CORREGIDA para Pronombres) ---
// --- Función para preparar y mostrar la siguiente pregunta (CORREGIDA para Pronombres y Texto Productivo) ---
function prepareNextQuestion() {
    // --- Validación de datos ---
    if (!allVerbData || allVerbData.length === 0) {
        console.error("No hay datos de verbos válidos para preparar la pregunta.");
        feedback.textContent = "Error: No se pudieron cargar los datos de los verbos.";
        return;
    }
    console.log("Preparando nueva pregunta...");

    // --- Selección aleatoria (Verbo - manteniendo tu lógica de no repetición) ---
    const unusedVerbs = allVerbData.filter(v => !usedVerbs.includes(v.infinitive_es));
    if (unusedVerbs.length === 0 && allVerbData.length > 0) {
        console.log("Reiniciando lista de verbos usados.");
        usedVerbs = []; // Reiniciar si se usaron todos
    }
     // Seleccionar de los no usados si hay, si no, de todos
    const sourceArray = unusedVerbs.length > 0 ? unusedVerbs : allVerbData;
    if (sourceArray.length === 0) {
         console.error("Error crítico: No hay verbos en sourceArray.");
         feedback.textContent = "Error: No hay verbos disponibles.";
         return;
    }
    const v = sourceArray[Math.floor(Math.random() * sourceArray.length)];

    if (!v || !v.conjugations || !v.infinitive_en) {
         console.error("Error: Verbo seleccionado al azar es inválido o incompleto.", v);
         setTimeout(prepareNextQuestion, 50); // Intentar de nuevo
         return;
    }
    // Añadir a usados (si no estaba ya por el fallback)
    if (!usedVerbs.includes(v.infinitive_es)){
         usedVerbs.push(v.infinitive_es);
    }


    // --- Selección aleatoria (Pronombre ORIGINAL y DE MUESTRA) ---
    // const basePronouns = ['yo', 'tú', 'él', 'nosotros', 'vosotros', 'ellos']; // Ya definida globalmente como 'pronouns'
    const originalPronoun = pronouns[Math.floor(Math.random() * pronouns.length)]; // Clave para JSON

    let displayPronoun = originalPronoun; // Pronombre a mostrar (puede cambiar)
    const elVariations = ['él', 'ella', 'usted'];
    const nosotrosVariations = ['nosotros', 'nosotras'];
    const vosotrosVariations = ['vosotros', 'vosotras']; // Asegúrate si quieres variar 'vosotros'
    const ellosVariations = ['ellos', 'ellas', 'ustedes'];

    if (originalPronoun === 'él') {
        displayPronoun = elVariations[Math.floor(Math.random() * elVariations.length)];
    } else if (originalPronoun === 'nosotros') {
        displayPronoun = nosotrosVariations[Math.floor(Math.random() * nosotrosVariations.length)];
    } else if (originalPronoun === 'vosotros') {
         // Habilita la siguiente línea si quieres que 'vosotros' varíe a 'vosotras'
         // displayPronoun = vosotrosVariations[Math.floor(Math.random() * vosotrosVariations.length)];
    } else if (originalPronoun === 'ellos') {
        displayPronoun = ellosVariations[Math.floor(Math.random() * ellosVariations.length)];
    }

    // --- Obtener datos (Usar originalPronoun para lookup) ---
    const tenseKey = currentOptions.tense;
    const conjugationsForTense = v.conjugations[tenseKey];

    if (!conjugationsForTense) {
         console.error(`Error: No se encontraron conjugaciones para el tiempo '${tenseKey}' en el verbo '${v.infinitive_es}'. Revisar verbos.json.`);
         feedback.textContent = `Error interno: Faltan datos para ${v.infinitive_es} en ${tenseKey}.`;
         setTimeout(prepareNextQuestion, 50);
         return;
    }

    const correctAnswerES = conjugationsForTense[originalPronoun]; // <-- **USA EL ORIGINAL AQUÍ**

    if (correctAnswerES === undefined || correctAnswerES === null) {
         console.error(`Error: No se encontró conjugación para el pronombre ORIGINAL '${originalPronoun}' en el tiempo '${tenseKey}' del verbo '${v.infinitive_es}'. Revisar verbos.json.`);
         feedback.textContent = `Error interno: Faltan datos para ${v.infinitive_es} / ${tenseKey} / ${originalPronoun}.`;
         setTimeout(prepareNextQuestion, 50);
         return;
    }

    const infinitiveEN = v.infinitive_en;
    // const infinitiveES = v.infinitive_es; // No se usa directamente en la lógica siguiente

    // --- Guardar datos ---
    currentQuestion = {
        verb: v,
        pronoun: originalPronoun,
        displayPronoun: displayPronoun, // Guardar también el que se muestra
        answer: correctAnswerES,
        expectedEN: infinitiveEN.toLowerCase(),
        hintLevel: 0
    };
    console.log(`Pregunta: ${displayPronoun} - ${correctAnswerES} (${v.infinitive_es})`); // Log simple

    // --- Limpieza ---
    ansES.value = '';
    ansEN.value = '';
    startTime = Date.now();

    // --- Configurar UI y Mostrar Pregunta ---
    let promptText = "";
    if (currentOptions.mode === 'productive') {
        // **USA EL PRONOMBRE DE MUESTRA Y SINTAXIS CORRECTA**
        promptText = `"${infinitiveEN}" – <span class="pronoun" id="pronoun-${displayPronoun}">${displayPronoun}</span>`;
        qPrompt.innerHTML = promptText; // innerHTML para que funcione el <span>
        esContainer.style.display = 'block';
        enContainer.style.display = 'none';
        setTimeout(() => ansES.focus(), 0);

    } else { // modo 'receptivo'
        promptText = `"${correctAnswerES}"`;
        qPrompt.textContent = promptText;
        esContainer.style.display = 'none';
        enContainer.style.display = 'block';
        setTimeout(() => ansEN.focus(), 0);
    }
}

function checkAnswer() {
  const rt    = (Date.now() - startTime) / 1000;
  const bonus = Math.max(1, 2 - Math.max(0, rt - 5) * 0.1); // 💡 NUEVO
  // Buscar las irregularidades del verbo actual en el tiempo actual
  const irregularities = currentQuestion.verb.types[currentOptions.tense] || [];
  let correct  = false;
  let accentBonus = 0;
  const rawAnswerES = ansES.value.trim();
  let irregularBonus = 0;
  if (irregularities.length > 0 && !irregularities.includes('regular')) {
    irregularBonus = 5 * irregularities.length;  // 5 puntos por cada tipo de irregularidad
  }
  // 1.a) Comprobación de la respuesta
  if (currentOptions.mode === 'productive') {
    let ans = ansES.value.trim().toLowerCase();
    let cor = currentQuestion.answer.toLowerCase();
    if (currentOptions.ignoreAccents) {
      ans = removeAccents(ans);
      cor = removeAccents(cor);
    }
    correct = ans === cor;

    // Solo se asigna el bonus de tilde si la respuesta es correcta y lleva tilde
    if (correct && !currentOptions.ignoreAccents) {
      if (/[áéíóúÁÉÍÓÚ]/.test(currentQuestion.answer)) {
        accentBonus = 5; // ajusta el valor si quieres
      }
    }
  } else {
    // lectura del texto completo, e.g. "they eat" o "she eats"
    const ans = ansEN.value.trim().toLowerCase();

    // construye la forma inglesa: base del verbo + posible -s en third person
    const infinitive = currentQuestion.verb.infinitive_en.replace(/^to\s+/, ''); 
    const isThirdSingular = currentQuestion.pronoun === 'él';
    const verbForm = isThirdSingular
      ? (infinitive.endsWith('s') ? infinitive : infinitive + 's')
      : infinitive;

    const validPronouns = pronounMap[currentQuestion.pronoun];
    const expectedForms = validPronouns.map(pr => `${pr.toLowerCase()} ${verbForm}`);

    correct = expectedForms.includes(ans);
  }

  if (correct) {
    soundCorrect.play();
    streak++;
    multiplier = Math.min(5, multiplier + 0.5);
    // Añadir bonus de acentos a los puntos
    const pts = Math.round(10 * multiplier * bonus) + accentBonus + irregularBonus;
    score += pts;
    let feedbackText = `✅ ¡Correcto!<br>Time: ${rt.toFixed(1)}s ×${bonus.toFixed(1)}`;
    if (accentBonus > 0) {
       feedbackText += ` +${accentBonus} accent bonus!`; // <-- Mostrar bonus
    }


    updateScore();
    setTimeout(prepareNextQuestion, 1500);
	
    const irregularityEmojis = {
      "first_person_irregular": "🧏‍♀️",
      "stem_changing": "🌱",
      "multiple_irregularities": "🎭",
      "y_change": "➰",
      "irregular_root": "🌳",
      "stem_change_3rd_person": "🧍",
      "totally_irregular": "🤯",
      "irregular_participle": "🧩",
      "regular": "✅"
    };
    const irregularityNames = {
      "first_person_irregular": "First person",
      "stem_changing": "Stem change",
      "multiple_irregularities": "Multiple changes",
      "y_change": "Y change",
      "irregular_root": "Irregular root",
      "stem_change_3rd_person": "3rd person stem change",
      "totally_irregular": "Totally irregular",
      "irregular_participle": "Irregular participle",
      "regular": "Regular"
    };
   const irregularityDescriptions = irregularities
     .filter(type => type !== 'regular')
     .map(type => `${irregularityEmojis[type] || ''} ${type.replace(/_/g, ' ')}`)
     .join('<br>');

    // luego en el feedback:
	if (irregularBonus > 0) {
       feedbackText += `<br>+${irregularBonus} irregularity bonus!`;
       feedbackText += `<br><small>${irregularityDescriptions}</small>`;
    }
	feedbackText += `<br>Points: ${pts}`;
    feedback.innerHTML = feedbackText;
    feedback.classList.add('vibrate'); // 💡 NUEVO

  } else {
    // 3) RESPUESTA INCORRECTA
    soundWrong.play();
    streak = 0;
    multiplier = 1.0;

    // 4) MODO 5 VIDAS: resto vida y, si 0, game over
    if (selectedGameMode === 'lives') {
      remainingLives--;

      if (remainingLives <= 0) {
        soundGameOver.play();  // Reproducir el sonido de game over
		gameTitle.textContent = '💀 ¡Estás MUERTO!';
        const name = prompt('💀 ¿Cómo te llamas? 💀');
        if (name) {
          const key = `rankingHkuVerbGame_${selectedGameMode}`;
          const R   = JSON.parse(localStorage.getItem(key) || '[]');
          R.push({ name, score });
          R.sort((a, b) => b.score - a.score);
          localStorage.setItem(key, JSON.stringify(R.slice(0, 5)));
          updateRanking();
        }
        checkButton.disabled = true;
        skipButton.disabled  = true;
        endButton.disabled   = true;  // evita volver a pulsar Finish
        quitToSettings();
        return;
      } else {
        updateGameTitle();
      }
    }

    updateScore();
    if (currentOptions.mode === 'productive') {
      if (currentQuestion.hintLevel === 0) {
        feedback.innerHTML = 
          `❌ Incorrect. <em>Clue 1:</em> infinitive is ` +
          `<strong>${currentQuestion.verb.infinitive_es}</strong>.`;
        currentQuestion.hintLevel = 1;
      } else if (currentQuestion.hintLevel === 1) {
        const conj    = currentQuestion.verb.conjugations[currentOptions.tense];
        const botones = Object.entries(conj)
            .filter(([pr]) => pr !== currentQuestion.pronoun)
            .map(([, form]) => `<span class="hint-btn">${form}</span>`)
            .join('');
        feedback.innerHTML =
          `❌ Incorrect. <em>Pista 2:</em> ` + botones;
      }        
      ansES.value = '';
      setTimeout(() => ansES.focus(), 0);
    }
  }
}
function startTimerMode() {
  feedback.innerHTML = '';
  feedback.classList.remove('vibrate');
  score = 0; streak = 0; multiplier = 1.0;
  updateScore();
  setupScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  updateGameTitle();

  soundStart.play();

  setTimeout(() => {
    music.volume = 0;                // reinicia a 0
    music.play();
    fadeIn(music, targetVolume);     // sube en 2 s
    musicToggle.style.display = 'block';
    volumeSlider.style.display = 'block';
    volumeSlider.value = targetVolume;
    volumeSlider.disabled = false;
  }, 3000);

  prepareNextQuestion();

  // ⏳ Reloj contrarreloj
  let timeLeft = countdownTime;
  const clock = document.createElement('div');
  clock.id = 'timer-clock';
  clock.textContent = `⏳ ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
  clock.id = 'timer-clock';
  clock.style.fontSize = '40px';
  clock.style.color = 'white';
  clock.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  clock.style.padding = '10px 20px';
  clock.style.borderRadius = '12px';
  clock.style.zIndex = '999';
  clock.style.fontFamily = 'inherit';
  clock.style.transition = 'color 0.3s ease, transform 0.3s ease';
  const questionArea = document.getElementById('question-area');
  questionArea.parentNode.insertBefore(clock, questionArea);

  countdownTimer = setInterval(() => {
    timeLeft--;
    clock.textContent = `⏳ ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;

    if (timeLeft <= 10) {
      clock.style.color = '#ff4c4c';
      clock.style.transform = 'scale(1.2)';
    }

    if (timeLeft <= 0) {
      clearInterval(countdownTimer);
      clock.remove();
	  soundGameOver.play();  // Reproducir el sonido de game over
      const name = prompt('⏱️ Time is up! Your name?');
      if (name) {
        const key = `rankingHkuVerbGame_${selectedGameMode}`;
        const R = JSON.parse(localStorage.getItem(key) || '[]');
        R.push({ name, score });
        R.sort((a, b) => b.score - a.score);
        localStorage.setItem(key, JSON.stringify(R.slice(0, 5)));
      }
      quitToSettings();
    }
  }, 1000);
}
function skipQuestion() {
  // 1) Rompemos la racha
  streak = 0;
  multiplier = 1.0;
  updateScore();

  // 2) Mostramos la solución completa
  const solucion = currentQuestion.answer;
  feedback.innerHTML = 
    `⏭ Skipped. The right conjugation was <strong>"${solucion}"</strong>.`;

  // 3) Pasamos a la siguiente pregunta
  soundSkip.play(); // Reproduce el sonido del skip
  setTimeout(prepareNextQuestion, 1000);
}

function quitToSettings() {
  clearInterval(countdownTimer);
  const existingClock = document.getElementById('timer-clock');
  if (existingClock) existingClock.remove();
  music.pause();
  music.currentTime = 0;
  musicToggle.textContent = '🔇';
  musicToggle.style.display = 'none';
  volumeSlider.disabled = true;
  musicPlaying = false;


  gameScreen.style.display = 'none';
  setupScreen.style.display = 'block';

  // Resetea el formulario y las variables
  setupForm.reset();
  selectedGameMode = 'infinite';

  // Elimina el resaltado de TODOS los botones de modo
  document.querySelectorAll('#game-modes .mode-button').forEach(btn => {
    btn.classList.toggle('selected-mode', btn.dataset.mode === 'infinite');
  })
  document.querySelectorAll('.config-button').forEach(btn => {
    btn.classList.toggle('selected-mode', btn.dataset.mode === 'productive');
  });
  // Rehabilita los botones que pudimos desactivar
  checkButton.disabled = false;
  skipButton.disabled  = false;
  endButton.disabled   = false;

  // Asegura que vuelvan a verse los botones de modo
  document.getElementById('game-modes').style.display = 'flex';

  updateRanking();
  remainingLives = 5;
}
  setupForm.addEventListener('submit', async e => {
  e.preventDefault();
  currentOptions = {
    mode: document.querySelector('.config-button.selected-mode').dataset.mode,
    tense: tenseSelect.value,
    ignoreAccents: document.getElementById('ignore-accents').checked
};
  if (!await loadVerbs()) return;
  feedback.innerHTML = '';
  feedback.classList.remove('vibrate');
  score = 0; streak = 0; multiplier = 1.0;
  updateScore();
  setupScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  updateGameTitle();
  updateRanking();
if (selectedGameMode === 'lives') {
  remainingLives = 5;
}
updateGameTitle();
  if (selectedGameMode === 'timer') {
    const countdownDiv = document.createElement('div');
    countdownDiv.id = 'countdown-overlay';
    countdownDiv.style.position = 'fixed';
    countdownDiv.style.top = '50%';
    countdownDiv.style.left = '50%';
    countdownDiv.style.transform = 'translate(-50%, -50%)';
    countdownDiv.style.fontSize = '80px';
    countdownDiv.style.fontWeight = 'bold';
    countdownDiv.style.color = '#fff';
    countdownDiv.style.zIndex = '9999';
    countdownDiv.style.fontFamily = 'inherit';
    document.body.appendChild(countdownDiv);

    let countdown = 3;
    countdownDiv.textContent = countdown;
    const preTimer = setInterval(() => {
      countdown--;
      if (countdown === 0) {
        clearInterval(preTimer);
        document.body.removeChild(countdownDiv);
        startTimerMode(); // ⏲️ inicia modo contrarreloj
      } else {
        countdownDiv.textContent = countdown;
      }
    }, 1000);
    return; // 👉 evita iniciar el juego normalmente en modo contrarreloj
  }

  soundStart.play();

  // 👇 Espera 3 segundos para empezar la música, PERO el juego arranca de inmediato
  setTimeout(() => {
    music.volume = 0;                // reinicia a 0
    music.play();
    fadeIn(music, targetVolume);     // sube en 2 s
    musicToggle.style.display = 'block';
    volumeSlider.style.display = 'block';
    volumeSlider.value = targetVolume;
    volumeSlider.disabled = false;
  }, 3000);

  prepareNextQuestion(); 
});

  checkButton.addEventListener('click', checkAnswer);
  skipButton.addEventListener('click', skipQuestion);
  endButton.addEventListener('click', () => {
    const name = prompt('¿Cómo te llamas?');
    if (name) {
      const key = `rankingHkuVerbGame_${selectedGameMode}`;
      const R   = JSON.parse(localStorage.getItem(key) || '[]');
      R.push({ name, score });
      R.sort((a,b)=>b.score - a.score);
      localStorage.setItem(key, JSON.stringify(R.slice(0,5)));
      updateRanking();
    }
    quitToSettings();
  });

  ansES.addEventListener('keypress', e => { if (e.key === 'Enter') checkAnswer(); });
  ansEN.addEventListener('keypress', e => { if (e.key === 'Enter') checkAnswer(); });
// ---> AÑADIR ESTA NUEVA FUNCIÓN <---
function renderVerbTypeButtons() {
  const container = document.getElementById('verb-type-buttons');
  container.innerHTML = ''; // Limpiar botones anteriores

  irregularityTypes.forEach(type => {
    const button = document.createElement('button');
    button.type = 'button'; // Importante para que no envíe el formulario
    button.classList.add('verb-type-button');
    button.dataset.value = type.value; // Guardar el valor interno (regular, stem_changing, etc.)
    button.dataset.times = type.times.join(','); // Guardar tiempos aplicables

    // Contenido del botón (nombre y pista)
    button.innerHTML = `
      <span class="verb-type-name">${type.name}</span>
      ${type.hint ? `<br><span class="verb-type-hint">${type.hint}</span>` : ''}
    `; // Añadir pista si existe

    // Marcar TODOS por defecto (petición 4)
    button.classList.add('selected');

    // Añadir manejador de clic para seleccionar/deseleccionar
    button.addEventListener('click', () => {
      soundClick.play(); // Sonido clic
      button.classList.toggle('selected'); // Alternar clase 'selected'
    });

    container.appendChild(button);
  });
}
// ---> FIN NUEVA FUNCIÓN <---
function updateGameTitle() {
  let title = `Mode: ${currentOptions.mode} | Tense: ${currentOptions.tense}`;
  if (selectedGameMode === 'lives') {
    title += ` | 💖 ${remainingLives}`;
  }                       // 🇧🇷 Cierra el if
  gameTitle.textContent = title;
}                         // cierra updateGameTitle()
function typewriterEffect(textElement, text, interval) {
  let index = 0;
  const typeInterval = setInterval(() => {
    textElement.textContent += text[index];
    index++;
    if (index === text.length) {
      clearInterval(typeInterval);
    }
  }, interval);
}

function showExample(mode) {
  const exampleText = document.getElementById('example-text');
  exampleText.textContent = 'Conjugate + tú';  // Mostrar "Conjugate tú" de forma estática

  const animatedText = document.getElementById('animated-text');
  animatedText.textContent = ''; // Limpiar cualquier texto anterior

  if (mode === 'produce') {
    // Después de un retraso, mostrar "conjugas" con efecto de máquina de escribir
    setTimeout(() => {
      typewriterEffect(animatedText, 'CONJUGAS', 200);  // Animar la palabra "conjugas"
    }, 400);  // Retraso de 0.5 segundos después de mostrar "Conjugate tú"
  } else if (mode === 'recall') {
    exampleText.textContent = 'Recuerdas: You remember'; // Mostrar el ejemplo de Recall
  }
}

document.querySelectorAll('.mode-button').forEach(button => {
  button.addEventListener('click', () => {
    const mode = button.getAttribute('data-mode');
    showExample(mode); // Mostrar ejemplo cuando se hace clic en un botón
  });
});
});                      // cierra DOMContentLoaded', …)