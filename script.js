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
  // ===== envolver cada letra en un <span> =====
  const titleEl = document.querySelector('.glitch-title, #main-title');
  if (titleEl) {
    const letters = Array.from(titleEl.textContent);
    titleEl.innerHTML = letters
      .map(ch => {
        if (ch === ' ') {
          // span “espacio” con entidad NBSP
          return '<span class="letter space">&nbsp;</span>';
        }
        return `<span class="letter">${ch}</span>`;
      })
      .join('');
  }
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
  const tenses = [
    { value: 'present',        name: 'Present'       },
    { value: 'past_simple',    name: 'Simple Past'   },
    { value: 'present_perfect',name: 'Present Perfect'}
];

  function renderTenseButtons() {
    const container = document.getElementById('tense-buttons');
    container.innerHTML = '';
    tenses.forEach(t => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.classList.add('tense-button');
      btn.dataset.value = t.value;
      btn.textContent = t.name;
      // por defecto solo el present está seleccionado
      if (t.value === 'present') btn.classList.add('selected');
      btn.addEventListener('click', () => {
        soundClick.play();
        btn.classList.toggle('selected');
        filterVerbTypes();  // re-filtra tipos tras cambiar los tiempos
      });
      container.appendChild(btn);
    });
}
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
  music.volume=0;             
  renderTenseButtons();
  renderVerbTypeButtons();
  filterVerbTypes(); 
  renderSetupRecords();
  
  document.querySelectorAll('input[type="checkbox"], input[type="radio"], select')
    .forEach(el => {
      el.addEventListener('change', () => {
        soundClick.play();
      });
    });

  
function filterVerbTypes() {
  const selTenses = Array.from(document.querySelectorAll('.tense-button.selected'))
                         .map(btn => btn.dataset.value);
  document.querySelectorAll('.verb-type-button').forEach(button => {
    const app = button.dataset.times.split(',');
    const ok = app.some(t => selTenses.includes(t));
	
    if (ok) {
      button.disabled = false;
      button.classList.remove('disabled');
    } else {
      button.disabled = true;
      button.classList.add('disabled');
      button.classList.remove('selected');
    }
     if (ok) {
       button.classList.add('selected');
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
function renderSetupRecords() {
  const container = document.getElementById('setup-records');
  if (!container) return;

  container.querySelectorAll('.mode-records').forEach(div => {
    const mode = div.dataset.mode;
    const ul = div.querySelector('.record-list');
    ul.innerHTML = '';

    db.collection('records')
      .where('mode', '==', mode)
      .orderBy('score', 'desc')
      .limit(5)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          ul.innerHTML = '<li>No hay récords aún</li>';
          return;
        }
        snapshot.forEach((doc, i) => {
          const { name, score, timestamp, streak } = doc.data();
          const date = timestamp?.toDate();
          // Solo la fecha, sin la parte de la hora:
          const dateStr = date
            ? date.toLocaleDateString()
            : '–';

          const medal = i === 0 ? '🥇'
                      : i === 1 ? '🥈'
                      : i === 2 ? '🥉'
                      : '';
          const li = document.createElement('li');
          li.innerHTML = `
            <div class="record-item">
              <span class="medal">${medal}</span>
              <strong>${name}:</strong> ${score} pts
              <span class="record-date">${dateStr}</span>
              ${streak
                ? `<span class="record-streak">· 🔥 Racha: ${streak}</span>`
                : ''}
            </div>
          `;
          ul.appendChild(li);
        });
      })
      .catch(error => {
        console.error('Error al cargar récords:', error);
        ul.innerHTML = '<li>Error cargando récords</li>';
      });
  });
}

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

  const filtered = rawVerbData.filter(v => {
    return currentOptions.tenses.some(tense => {
      const typesForTense = v.types[tense] || [];
      return typesForTense.some(t => selectedTypes.includes(t));
    });
  });

  if (filtered.length === 0) {
    alert('No verbs available for the selected tense and verb types.');
    return false;
  }
  allVerbData = filtered;
  console.log(`Filtered down to ${allVerbData.length} verbs for tense '${currentOptions.tenses}' and types:`, selectedTypes);
  return true; // Indicar éxito
}
// ---> FIN REEMPLAZO <---

  function updateRanking() {
    rankingBox.innerHTML = '<h3>🏆 Top 5</h3>';
  
    db.collection("records")
      .where("mode", "==", selectedGameMode)
      .orderBy("score", "desc")
      .limit(5)
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          const entry = doc.data();
          rankingBox.innerHTML += `<div>${entry.name}: ${entry.score}</div>`;
        });
    })
    .catch((error) => {
      console.error("Error loading rankings:", error);
    });
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

let usedVerbs = [];  // Array para almacenar los verbos ya seleccionados


function prepareNextQuestion() {
  // 1) Sanity checks
  if (!allVerbData || allVerbData.length === 0) {
    console.error("No valid verb data.");
    feedback.textContent = "Error: Could not load verb data.";
    return;
  }

  // 2) Pick an unused verb (and reset if we’ve cycled through)
  const unusedVerbs = allVerbData.filter(v => !usedVerbs.includes(v.infinitive_es));
  if (unusedVerbs.length === 0) usedVerbs = [];
  const sourceArray = unusedVerbs.length > 0 ? unusedVerbs : allVerbData;

  // 3) **Grab one at random** before you start referencing it
     // Pick one at random, then sanity-check it
     const v = sourceArray[Math.floor(Math.random() * sourceArray.length)];
     if (!v || !v.conjugations || !v.infinitive_en) {
       console.error("Selected verb is invalid:", v);
       setTimeout(prepareNextQuestion, 50);
       return;
     }

     if (!usedVerbs.includes(v.infinitive_es)){
          usedVerbs.push(v.infinitive_es);
     }
     usedVerbs.push(v.infinitive_es);

  // 4) Pick a pronoun and tense
  const originalPronoun = pronouns[Math.floor(Math.random() * pronouns.length)];
  const displayPronoun = (function() {
    const map = {
      él: ['él','ella','usted'],
      nosotros: ['nosotros','nosotras'],
      ellos: ['ellos','ellas','ustedes']
    };
    return (map[originalPronoun] || [originalPronoun])
           [Math.floor(Math.random() * (map[originalPronoun]?.length||1))];
  })();
  const tKey = currentOptions.tenses[Math.floor(Math.random() * currentOptions.tenses.length)];
  const tenseObj = tenses.find(t => t.value === tKey);
  const tenseLabel = tenseObj ? tenseObj.name : tKey;

  // 5) Lookup the correct form
  const forms = v.conjugations[tKey];
  if (!forms) {
    console.error(`Missing conjugations for ${v.infinitive_es} in ${tKey}`);
    setTimeout(prepareNextQuestion, 50);
    return;
  }
  const correctES = forms[originalPronoun];
  if (!correctES) {
    console.error(`Missing ${originalPronoun} form for ${v.infinitive_es} in ${tKey}`);
    setTimeout(prepareNextQuestion, 50);
    return;
  }

  // 6) Save question state
  currentQuestion = {
    verb: v,
    pronoun: originalPronoun,
    displayPronoun,
    answer: correctES,
    expectedEN: v.infinitive_en.toLowerCase(),
	tenseKey: tKey,      // <— store it here
    hintLevel: 0
  };
  startTime = Date.now();
  ansES.value = '';
  ansEN.value = '';

  // 7) Render the prompt
  let promptText;
  if (currentOptions.mode === 'productive') {
     promptText = `<span class="tense-label">${tenseLabel}:</span> `
                + `"${v.infinitive_en}" – `
                + `<span class="pronoun" id="${displayPronoun}">${displayPronoun}</span>`;
    qPrompt.innerHTML = promptText;
    esContainer.style.display = 'block';
    enContainer.style.display = 'none';
    ansES.focus();
  } else {
    promptText = `<span class="tense-label">${tenseLabel}:</span> `
               + `"${correctES}"`;
    qPrompt.innerHTML = promptText;
    esContainer.style.display = 'none';
    enContainer.style.display = 'block';
    ansEN.focus();
  }
}

function checkAnswer() {
  const rt    = (Date.now() - startTime) / 1000;
  const bonus = Math.max(1, 2 - Math.max(0, rt - 5) * 0.1); // 💡 NUEVO
  // Buscar las irregularidades del verbo actual en el tiempo actual
  const irregularities = currentQuestion.verb.types[currentQuestion.tenseKey] || [];
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
  const ans = ansEN.value.trim().toLowerCase();

  // 1) Obtenemos la cadena cruda, ej. "to do/make" o "to do or to make"
  const rawInf = currentQuestion.verb.infinitive_en;

  // 2) La dividimos en sinónimos (por "/" o " or ")
  const synonyms = rawInf.split(/\/| or /i).map(s => s.trim());

  // 3) Eliminamos el "to " para quedarnos con la raíz
  const baseVerbs = synonyms.map(s => s.replace(/^to\s+/i, ''));

  // 4) Comprobamos si es tercera persona singular
  const isThirdSingular = currentQuestion.pronoun === 'él';

  // 5) Obtenemos los pronombres válidos para este originalPronoun
  const validPronouns = pronounMap[currentQuestion.pronoun] || [];

  // 6) Construimos todas las formas posibles
  const expectedForms = [];
  validPronouns.forEach(pr => {
     baseVerbs.forEach(base => {
       let form;

       // Caso especial para “to be”
       if (
         currentQuestion.verb.infinitive_en.trim().toLowerCase() === 'to be'
       ) {
         // pr es el pronombre en inglés, ej. "I","you","he","they"
         switch (pr.toLowerCase()) {
           case 'i':
             form = 'am';
             break;
           case 'he':
           case 'she':
             form = 'is';
             break;
           default:
             form = 'are';
         }
       } else {
         // Lógica general: añade “s” en 3ª pers. singular
         form = isThirdSingular
           ? (base.endsWith('s') ? base : base + 's')
           : base;
       }

       expectedForms.push(`${pr.toLowerCase()} ${form}`);
     });
  });

  // 7) Marcamos correcto si coincide con alguna forma válida
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
    feedback.classList.add('vibrate'); 
	
    return;    // ← así detenemos aquí la función
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
		  db.collection("records").add({
        name: name,
        score: score,
        mode: selectedGameMode,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
		tense: currentOptions.tenses,
		verb: currentQuestion.verb.infinitive_es,
		streak: streak
      })
      .then(() => {
        console.log("Record saved online!");
		renderSetupRecords(); // refresca la lista con el nuevo récord
      })
      .catch(error => console.error("Error saving record:", error));
	}
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
    if (currentOptions.mode === 'receptive') {
      if (currentQuestion.hintLevel === 0) {
        // Pista 1: infinitivo en inglés
        feedback.innerHTML =
          `❌ Incorrect. <em>Clue 1:</em> infinitive is ` +
          `<strong>${currentQuestion.verb.infinitive_en}</strong>.`;
        currentQuestion.hintLevel = 1;
      } else if (currentQuestion.hintLevel === 1) {
        // Pista 2: todas las conjugaciones en español menos la del pronombre actual
        const conj = currentQuestion.verb.conjugations[currentOptions.tenses];
        const botones = Object.entries(conj)
          .filter(([pr]) => pr !== currentQuestion.pronoun)
          .map(([, form]) => `<span class="hint-btn">${form}</span>`)
          .join('');
        feedback.innerHTML =
          `❌ Incorrect. <em>Clue 2:</em> ` + botones;
        currentQuestion.hintLevel = 2;
      }
      ansEN.value = '';
      setTimeout(() => ansEN.focus(), 0);
      return;
    }
    if (currentOptions.mode === 'productive') {
      if (currentQuestion.hintLevel === 0) {
        feedback.innerHTML = 
          `❌ Incorrect. <em>Clue 1:</em> infinitive is ` +
          `<strong>${currentQuestion.verb.infinitive_es}</strong>.`;
        currentQuestion.hintLevel = 1;
      } else if (currentQuestion.hintLevel === 1) {
        const conj    = currentQuestion.verb.conjugations[currentOptions.tenses];
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
        db.collection("records").add({
          name: name,
          score: score,
          mode: selectedGameMode,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          tense: currentOptions.tenses,
          verb: currentQuestion.verb.infinitive_es,
          streak: streak
        })
        .then(() => {
          console.log("Record saved online!");
          renderSetupRecords();
        })
        .catch(error => console.error("Error saving record:", error));
      }

      // ¡OJO! quitToSettings SOLO aquí
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
  document.getElementById('setup-records').classList.remove('hidden');

  // Resetea el formulario y las variables
  setupForm.reset();
  selectedGameMode = 'infinite';
  renderTenseButtons();
  renderVerbTypeButtons();
  filterVerbTypes();

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
  e.preventDefault
  e.preventDefault();
  const selTenses = Array.from(
    document.querySelectorAll('.tense-button.selected')
  ).map(btn => btn.dataset.value);
  document.getElementById('setup-records').classList.add('hidden');
  currentOptions = {
    mode: document.querySelector('.config-button.selected-mode').dataset.mode,
    tenses:  selTenses,
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
	  db.collection("records").add({
        name: name,
        score: score,
        mode: selectedGameMode,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
		tense: currentOptions.tenses,
		verb: currentQuestion.verb.infinitive_es,
		streak: streak
      })
      .then(() => {
        console.log("Record saved online!");
		renderSetupRecords(); // refresca la lista con el nuevo récord
      })
      .catch(error => console.error("Error saving record:", error));
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
  const tm = currentOptions.tenses.map(t => t.replace('_',' ')).join(', ');
  let title = `Mode: ${currentOptions.mode} | Tenses: ${tm}`;
  if (selectedGameMode === 'lives') title += ` | 💖 ${remainingLives}`;
  gameTitle.textContent = title;
}                       // cierra updateGameTitle()
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


// 🎈 BURBUJAS DE VERBOS LATERALES
const leftBubbles = document.getElementById('left-bubbles');
const rightBubbles = document.getElementById('right-bubbles');

function createBubble(side) {
  const bubble = document.createElement('div');
  bubble.classList.add('bubble');

  const verb = allVerbData[Math.floor(Math.random() * allVerbData.length)];
  if (!verb) return;

  const tense = Math.random() < 0.5 ? 'present' : 'past_simple';
  const pronoun = Object.keys(verb.conjugations[tense] || {})[Math.floor(Math.random() * 6)];
  const conjugation = verb.conjugations[tense]?.[pronoun];

  bubble.textContent = conjugation || verb.infinitive_es;

  bubble.style.left = Math.random() * 70 + 'px'; // margen interno
  bubble.style.fontSize = (Math.random() * 6 + 14) + 'px'; // variar tamaño

  const container = side === 'left' ? leftBubbles : rightBubbles;
  container.appendChild(bubble);
  bubble.addEventListener('click', () => {
    soundBubblePop.currentTime = 0;
    soundBubblePop.play();
    bubble.classList.add('pop-animation');
  });

  // Al terminar la animación “pop”, eliminamos el elemento
  bubble.addEventListener('animationend', e => {
    if (e.animationName === 'pop') bubble.remove();
  });
  bubble.addEventListener('animationend', () => {
    bubble.remove();
  });
}

// Lanzar burbujas de cada lado
setInterval(() => createBubble('left'), 1800);
setInterval(() => createBubble('right'), 2100);

});                      // cierra DOMContentLoaded', …)