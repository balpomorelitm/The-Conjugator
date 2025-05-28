let typeInterval; // Variable global para controlar el intervalo de la animación

/**
 * Simulates a typewriter effect on an HTML element.
 * @param {HTMLElement} element - The target element to display the typing.
 * @param {string} text - The text to type out.
 * @param {number} [speed=150] - The delay between characters in milliseconds.
 */
function typeWriter(element, text, speed = 120) {
  if (element._twInterval) clearInterval(element._twInterval);
  element.innerHTML = '';
  let i = 0, cursorVisible = true;
  const cursorSpan = document.createElement('span');
  cursorSpan.className = 'typing-cursor';

  element.appendChild(document.createTextNode(''));

  element._twInterval = setInterval(() => {
    if (element.contains(cursorSpan)) {
      element.removeChild(cursorSpan);
    }

    if (i < text.length) {
      element.firstChild.nodeValue += text.charAt(i++);
      element.appendChild(cursorSpan);
    } else {
      cursorSpan.style.visibility = cursorVisible ? 'visible' : 'hidden';
      cursorVisible = !cursorVisible;
      if (!element.contains(cursorSpan)) element.appendChild(cursorSpan);
    }
  }, speed);
}

function handleReflexiveToggle() {
    const toggleReflexiveBtn = document.getElementById('toggle-reflexive');
	
    if (!toggleReflexiveBtn) return;

    toggleReflexiveBtn.classList.toggle('selected');
    if (typeof soundClick !== 'undefined') soundClick.play();
}

const soundClick = document.getElementById('sound-click');
document.addEventListener('DOMContentLoaded', async () => {
  let selectedGameMode = 'infinite'; 
  let allVerbData = [];
  let currentQuestion = {};
  let currentOptions = {};
  let score = 0, streak = 0, multiplier = 1.0, startTime = 0;
  let bestStreak = 0;
  let countdownTimer;
  let countdownTime = 240; // 4 minutes = 240 seconds
  let remainingLives = 5;
  let targetVolume=0.2;
  let timerTimeLeft = 0;            
	function formatTime(sec) {
	  const m = Math.floor(sec / 60);
	  const s = sec % 60;
	  return `${m}:${s.toString().padStart(2,'0')}`;
	}


	function showTimeChange(amount) {
	  const clockEl = document.getElementById('timer-clock');
	  const el      = document.getElementById('time-change');
	  if (!clockEl || !el) return;

	  // Texto y color
	  el.textContent = `${amount > 0 ? '+' : ''}${amount}s`;
	  el.style.color = amount < 0 ? 'red' : 'lightgreen';

	  // Mostrar con clase y ocultar tras 2s
	  clockEl.classList.add('show-time-change');
	  clearTimeout(clockEl._timeChangeTimeout);
	  clockEl._timeChangeTimeout = setTimeout(() => {
		clockEl.classList.remove('show-time-change');
	  }, 2000);

	  // Vibración
	  el.classList.remove('vibrate');
	  void el.offsetWidth;         
	  el.classList.add('vibrate');
	}
  let totalPlayedSeconds = 0;       
  let totalQuestions = 0;           
  let totalCorrect = 0;  
  let initialRawVerbData = [];  
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
  const helpButton = document.getElementById('help-button'); 
  const tooltip = document.getElementById('tooltip');       
  const titleElement = document.querySelector('.glitch-title');
  const verbTypeLabels = Array.from(document.querySelectorAll('label[data-times]'));
  const soundCorrect = new Audio('sounds/correct.mp3');
  const soundWrong = new Audio('sounds/wrong.mp3');
  const soundClick = new Audio('sounds/click.mp3');
  const soundStart = new Audio('sounds/start-verb.mp3');
  const soundSkip = new Audio('sounds/skip.mp3');
  const music = new Audio('sounds/music.mp3');
  const soundGameOver = new Audio('sounds/gameover.mp3');
  const soundbubblepop = new Audio('sounds/soundbubblepop.mp3');
  const soundLifeGained = new Audio('sounds/soundLifeGained.mp3');
  music.loop = true;
  setInterval(() => {
    titleElement.classList.add('glitch-active');
    setTimeout(() => {
      titleElement.classList.remove('glitch-active');
    }, 600); // Glitch dura 0.5s
  }, 3000); // Cada 4s se activa el glitch

	const titleEl = document.querySelector('.glitch-title, #main-title');
	if (titleEl) {
	  const letters = Array.from(titleEl.textContent);

	  // Variables para “consumir” sólo la primera T y la primera C
	  let seenT = false;
	  let seenC = false;

	  titleEl.innerHTML = letters
		.map(ch => {
		  if (ch === ' ') {
			return '<span class="letter space">&nbsp;</span>';
		  }
		  // Creamos dinamicamente la clase extra si corresponde
		  let extraClass = '';
		  if (ch === 'T' && !seenT) {
			extraClass = ' big-letter';
			seenT = true;
		  }
		  if (ch === 'C' && !seenC) {
			extraClass += ' big-letter';
			seenC = true;
		  }
		  return `<span class="letter${extraClass}">${ch}</span>`;
		})
		.join('');
	}
    let loaded = false;
    try {
      const resp = await fetch(`verbos.json?cb=${Date.now()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      initialRawVerbData = await resp.json();
      console.log(`Loaded ${initialRawVerbData.length} verbs from JSON`);
      loaded = true;
    } catch (err) {
      console.error('Could not fetch verbos.json:', err);
      alert('Error cargando datos de los verbos.');
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
    nosotras: ['we'], 
    vosotras: ['you'], 
    ellas: ['they'], 
    ustedes: ['you'] 
};

const pronounGroups = [
  { label: 'yo',                   values: ['yo'] },
  { label: 'tú',                   values: ['tú'] },
  { label: 'él / ella / usted',    values: ['él'] },
  { label: 'nosotros / nosotras',  values: ['nosotros'] },
  { label: 'vosotros / vosotras',  values: ['vosotros'] },
  { label: 'ellos / ellas / ustedes', values: ['ellos'] }
];

function updatePronounDropdownCount() {
  const btns     = document.querySelectorAll('.pronoun-group-button');
  const selected = document.querySelectorAll('.pronoun-group-button.selected').length;
  document.getElementById('pronoun-dropdown-count')
          .textContent = `(${selected}/${btns.length})`;
}

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

  let totalCorrectAnswersForLife = 0; // Para Mecánica 1
  let correctAnswersToNextLife = 10;  // Objetivo inicial para Mecánica 1
  let nextLifeIncrement = 10;         // El 'n' inicial para la progresión de Mecánica 1

  let currentStreakForLife = 0;       // Para Mecánica 2
  let streakGoalForLife = 5;          // Objetivo inicial para Mecánica 2
  let lastStreakGoalAchieved = 0;     // Para recordar la última meta de racha alcanzada

  let isPrizeVerbActive = false;      // Para Mecánica 3

function playHeaderIntro() {
  console.log("playHeaderIntro fired")
  const header = document.querySelector('.main-header');
  header.classList.remove('animate');
  void header.offsetWidth;
  header.classList.add('animate');
}
playHeaderIntro();

function updateVerbDropdownCount() {
  const buttons = document.querySelectorAll('#verb-buttons .verb-button');
  const selected = Array.from(buttons)
                        .filter(b => b.classList.contains('selected'))
                        .length;
  const total = buttons.length;
  document.getElementById('verb-dropdown-count')
          .textContent = `(${selected}/${total})`;
}
if (loaded) {
  // Pintamos los verbos y preparamos su dropdown
  renderVerbButtons();
  initVerbDropdown();

  

  renderTenseButtons();
  initTenseDropdown();

  renderPronounButtons();
  initPronounDropdown();

  renderVerbTypeButtons();
  filterVerbTypes();
  renderSetupRecords();
}
  const dropdownBtn     = document.getElementById('verb-dropdown-button');
  const dropdownMenu    = document.getElementById('verb-dropdown-menu');
  const selectAllBtn    = document.getElementById('select-all-verbs');
  const allButtons      = () => Array.from(document.querySelectorAll('.verb-button'));
  

  
  document.querySelectorAll('input[type="checkbox"], input[type="radio"], select')
    .forEach(el => {
      el.addEventListener('change', () => {
        soundClick.play();
      });
    });

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

	function initTenseDropdown() {
	  // 1) Capturamos elementos
	  const dropdownBtn       = document.getElementById('tense-dropdown-button');
	  const dropdownMenu      = document.getElementById('tense-dropdown-menu');
	  const selectAllTenses   = document.getElementById('select-all-tenses');
	  const allTenseButtons   = () => Array.from(document.querySelectorAll('.tense-button'));

	  // 2) Función que actualiza el contador (X/total)
	  function updateTenseDropdownCount() {
		const total    = allTenseButtons().length;
		const selected = allTenseButtons().filter(btn => btn.classList.contains('selected')).length;
		document.getElementById('tense-dropdown-count').textContent = `(${selected}/${total})`;
	  }

	  // 3) Toggle de mostrar/ocultar el menú
	  dropdownBtn.addEventListener('click', e => {
		e.stopPropagation();               // que no cierre al mismo tiempo el listener global
		dropdownMenu.classList.toggle('hidden');
	  });

	  // 4) Botón “Seleccionar Todo”
	  selectAllTenses.addEventListener('click', () => {
		allTenseButtons().forEach(btn => btn.classList.add('selected'));
		filterVerbTypes();                // tu función existente de filtrado
		updateTenseDropdownCount();
	  });


	  // 6) Iniciamos el contador con el estado actual
	  updateTenseDropdownCount();

	  // 7) Cerrar al hacer clic fuera
	  document.addEventListener('click', e => {
		if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
		  dropdownMenu.classList.add('hidden');
		}
	  });
	}
	
function updateCurrentPronouns() {
  // toma todos los botones de grupo, filtra los seleccionados,
  // parsea el dataset.values y los aplana en un solo array
  const selectedBtns = Array.from(document.querySelectorAll('.pronoun-group-button'))
                            .filter(b => b.classList.contains('selected'));
  const flat = selectedBtns.flatMap(b => JSON.parse(b.dataset.values));
  // Sobrescribe el array global pronouns:
  window.pronouns = flat;
}
  
function filterVerbTypes() {
  const selTenses = Array.from(document.querySelectorAll('.tense-button.selected'))
                         .map(btn => btn.dataset.value);
  document.querySelectorAll('.verb-type-button').forEach(button => {
    const app = button.dataset.times.split(',');
    const ok = app.some(t => selTenses.includes(t));
      button.disabled = !ok;
      button.classList.toggle('disabled', !ok);
      if (!ok) button.classList.remove('selected');
      else button.classList.add('selected'); // Mantener seleccionado si está habilitado (o según lógica previa)
    });
  }

  const gameModeButtons = document.querySelectorAll('#game-modes .mode-button');
  gameModeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedGameMode = btn.dataset.mode;
      soundClick.play();
      gameModeButtons.forEach(b => b.classList.remove('selected-mode'));
      btn.classList.add('selected-mode');
      document.getElementById('setup-screen').style.display = 'block';
      filterVerbTypes();
      console.log('Selected mode:', selectedGameMode);
    });
  });

  const configButtons = document.querySelectorAll('.config-button');
  configButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentOptions.mode = btn.dataset.mode;
      soundClick.play();
      configButtons.forEach(b => b.classList.remove('selected-mode'));
      btn.classList.add('selected-mode');
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

let musicPlaying = true;

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

	function renderVerbButtons() {
	  const container = document.getElementById('verb-buttons');
	  container.innerHTML = '';

	  // ① Clonamos y ordenamos alfabéticamente por infinitive_es
	  const verbsSorted = [...initialRawVerbData].sort((a, b) =>
		a.infinitive_es.localeCompare(b.infinitive_es, 'es', { sensitivity: 'base' })
	  );

	  // ② Creamos cada botón
	  verbsSorted.forEach(v => {
		const btn = document.createElement('button');
		btn.type          = 'button';
		btn.classList.add('verb-button', 'selected');
		btn.dataset.value = v.infinitive_es;
		btn.innerHTML = `
		  <span class="tick"></span>
		  <span class="label">${v.infinitive_es} — ${v.infinitive_en}</span>
		`;
		container.appendChild(btn);
	  });
	}
	
	// Recorre cada group-button y marca .active si TODOS sus verbos están seleccionados
	function updateGroupButtons() {
	  const container = document.getElementById('verb-buttons');
	  const allBtns   = Array.from(container.querySelectorAll('.verb-button'));

	  document.querySelectorAll('#verb-groups-panel .group-button')
		.forEach(gb => {
		  const grp = gb.dataset.group;
		  // Filtramos los botones de verbo que pertenecen a este grupo
		  const matched = allBtns.filter(b => {
			const inf = b.dataset.value;
			if (grp === 'all')        return true;
			if (grp === 'reflexive')  return inf.endsWith('se');
			return inf.endsWith(grp);
		  });
		  // Está activo si hay al menos uno y TODOS están .selected
		  const allOn = matched.length > 0 && matched.every(b => b.classList.contains('selected'));
		  gb.classList.toggle('active', allOn);
		});
	}
	function initVerbDropdown() {
	  const ddBtn          = document.getElementById('verb-dropdown-button');
	  const menu           = document.getElementById('verb-dropdown-menu');
	  const deselectAllBtn = document.getElementById('deselect-all-verbs');
	  const groupsBtn      = document.getElementById('verb-groups-button');
	  const groupsPanel    = document.getElementById('verb-groups-panel');
	  const searchInput    = document.getElementById('verb-search');
	  const container      = document.getElementById('verb-buttons');

	  const allBtns = () => Array.from(container.querySelectorAll('.verb-button'));

	  // Función para alternar el texto del botón
	  function updateDeselectAllButton() {
		const anySelected = allBtns().some(b => b.classList.contains('selected'));
		deselectAllBtn.textContent = anySelected
		  ? 'Deseleccionar Todo'
		  : 'Seleccionar Todo';
	  }

	  // 0) Abrir/Cerrar el menú
	  ddBtn.addEventListener('click', e => {
		e.stopPropagation();
		menu.classList.toggle('hidden');
		groupsPanel.classList.add('hidden');
	  });

	  // 1) Toggle Selección total / Deselección total
	  deselectAllBtn.addEventListener('click', () => {
		const anySelected = allBtns().some(b => b.classList.contains('selected'));
		// si hay alguno, quitamos todos; si no, marcamos todos
		allBtns().forEach(b => b.classList.toggle('selected', !anySelected));
		updateVerbDropdownCount();
		updateDeselectAllButton();
		updateGroupButtons();
	  });

	  // 2) Abrir/Ocultar panel de Grupos
	  groupsBtn.addEventListener('click', e => {
		e.stopPropagation();
		groupsPanel.classList.toggle('hidden');
	  });

		// 3) Filtrar por grupos con TOGGLE y marcar el propio botón
		groupsPanel.querySelectorAll('.group-button').forEach(gb => {
		  gb.addEventListener('click', e => {
			e.preventDefault();
			const grp = gb.dataset.group; // "all" | "reflexive" | "ar" | "er" | "ir"

			// ① Recoger solo los botones de verbo que pertenecen a este grupo
			const matched = allBtns().filter(b => {
			  const inf = b.dataset.value;
			  if (grp === 'all') return true;
			  if (grp === 'reflexive') return inf.endsWith('se');
			  return inf.endsWith(grp);
			});

			// ② Decidir si los apagamos (si todos ya estaban seleccionados) o los encendemos
			const allCurrentlyOn = matched.every(b => b.classList.contains('selected'));
			matched.forEach(b => 
			  b.classList.toggle('selected', !allCurrentlyOn)
			);

			// ③ Marcar el propio botón de grupo como activo/inactivo
			gb.classList.toggle('active', !allCurrentlyOn);

			// ④ Actualizar contador y texto “todo”
			updateVerbDropdownCount();
			updateDeselectAllButton();
			updateGroupButtons();
		});
	  });

	  // 4) Búsqueda en vivo (solo visibilidad)
	  searchInput.addEventListener('input', () => {
		const q = searchInput.value.trim().toLowerCase();
		allBtns().forEach(b => {
		  b.style.display = b.textContent.toLowerCase().includes(q) ? '' : 'none';
		});
	  });

	  // 5) Delegación de clicks para toggle individual
	  container.addEventListener('click', e => {
		const btn = e.target.closest('.verb-button');
		if (!btn) return;
		soundClick.play();
		btn.classList.toggle('selected');
		updateVerbDropdownCount();
		updateDeselectAllButton();
		updateGroupButtons();
	  });

	  // 6) Cerrar menú y panel de grupos al click fuera
	  document.addEventListener('click', e => {
		if (!ddBtn.contains(e.target) && !menu.contains(e.target)) {
		  menu.classList.add('hidden');
		  groupsPanel.classList.add('hidden');
		}
	  });

	  // 7) Inicializar contador y texto del botón la primera vez
	  updateVerbDropdownCount();
	  updateDeselectAllButton();
	  updateGroupButtons();
	}
	
	function renderPronounButtons() {
	  const container = document.getElementById('pronoun-buttons');
	  container.innerHTML = '';

	  pronounGroups.forEach(group => {
		const btn = document.createElement('button');
		btn.type              = 'button';
		btn.classList.add('pronoun-group-button');
		btn.dataset.values    = JSON.stringify(group.values);
		btn.textContent       = group.label;
		btn.classList.add('selected');  // todos activos por defecto
		container.appendChild(btn);
	  });
	}

	function initPronounDropdown() {
	  const ddBtn     = document.getElementById('pronoun-dropdown-button');
	  const ddMenu    = document.getElementById('pronoun-dropdown-menu');
	  const selectAll = document.getElementById('select-all-pronouns');
	  const allBtns   = () => Array.from(document.querySelectorAll('.pronoun-group-button'));

	  // 1) Abrir/cerrar menú
	  ddBtn.addEventListener('click', e => {
		e.stopPropagation();
		ddMenu.classList.toggle('hidden');
	  });

	  // 2) “Seleccionar Todo” grupos
	  selectAll.addEventListener('click', () => {
		allBtns().forEach(b => b.classList.add('selected'));
		updatePronounDropdownCount();
	  });

	  // 3) Toggle individual de cada grupo
	  allBtns().forEach(b => {
		b.addEventListener('click', () => {
		  soundClick.play();
		  b.classList.toggle('selected');
		  updatePronounDropdownCount();
		  updateCurrentPronouns();
		});
	  });

	  // 4) Inicia el contador al abrir
	  updatePronounDropdownCount();
	  updateCurrentPronouns();

	  // 5) Cerrar al hacer clic fuera
	  document.addEventListener('click', e => {
		if (!ddBtn.contains(e.target) && !ddMenu.contains(e.target)) {
		  ddMenu.classList.add('hidden');
		}
	  });
	}
  
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
      .limit(10)
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
                ? `<span class="record-streak">· Max🔥: ${streak}</span>`
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


async function loadVerbs() {
  // 0) Carga JSON
  try {
    const resp = await fetch(`verbos.json?cb=${Date.now()}`);
    if (!resp.ok) throw new Error('Network response was not ok');
    initialRawVerbData = await resp.json();
  } catch (error) {
    console.error("Error fetching raw verb data:", error);
    alert("Could not load verb data file.");
    return false;
  }

  // 1) Filtrado por tipos de irregularidad
  const selectedTypeBtns = Array.from(
    document.querySelectorAll('.verb-type-button.selected')
  );
  const selectedTypes = selectedTypeBtns.map(b => b.dataset.value);
  if (selectedTypes.length === 0) {
    alert('Please select at least one verb type.');
    return false;
  }

  // 2) Filtrado por tiempos seleccionados
  let filtered = initialRawVerbData.filter(v =>
    currentOptions.tenses.some(t =>
      (v.types[t] || []).some(type => selectedTypes.includes(type))
    )
  );

  // 3) Filtrado final según selección MANUAL en el dropdown de verbos
  //    (es decir, respetar solo los que tengan .verb-button.selected)
  const manualSel = Array.from(
    document.querySelectorAll('#verb-buttons .verb-button.selected')
  ).map(b => b.dataset.value);

  if (manualSel.length > 0) {
    filtered = filtered.filter(v => manualSel.includes(v.infinitive_es));
  }

  // 4) Comprobación
  if (filtered.length === 0) {
    alert('No verbs available for the selected criteria.');
    allVerbData = [];
    return false;
  }

  allVerbData = filtered;
  console.log(`Using ${allVerbData.length} verbs after all filters.`);
  return true;
}

  function updateRanking() {
    rankingBox.innerHTML = '<h3>🏆 Top 5</h3>';
  
    db.collection("records")
      .where("mode", "==", selectedGameMode)
      .orderBy("score", "desc")
      .limit(10)
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
      + `  <strong>🔥 Streak:</strong> ${streak}`
      + ` = <strong>×${multiplier.toFixed(1)}</strong>`;
    
    const maxStreakForFullFire = 15;
    const container = document.getElementById('score-container');
    const containerHeight = container.clientHeight;  // altura real incluyendo padding
    const fireHeight = Math.min(
      (streak / maxStreakForFullFire) * containerHeight,
      containerHeight
    );
    flameEl.style.height = `${fireHeight}px`;
    flameEl.style.opacity = streak > 0 ? '1' : '0';

    const streakElement = document.getElementById('streak-display');
    if (streak >= 2 && streak <= 8) {
        streakElement.classList.add('vibrate');
    } else {
        streakElement.classList.remove('vibrate');
    }
}

let usedVerbs = [];  

	/*const pronounButtons = document.querySelectorAll('#pronoun-buttons .pronoun-group-button');
	const selectedPronouns = Array.from(pronounButtons)
	  .filter(btn => btn.classList.contains('selected'))
	  .map(btn => btn.getAttribute('data-pronoun'));
	const pronounsToShow = selectedPronouns.length > 0
	  ? selectedPronouns
	  : pronouns;*/
  
function prepareNextQuestion() {
  const oldNote = document.getElementById('prize-note');
  if (oldNote) oldNote.remove();
  if (!allVerbData || allVerbData.length === 0) {
    console.error("No valid verb data.");
    feedback.textContent = "Error: Could not load verb data.";
    return;
  }

  const unusedVerbs = allVerbData.filter(v => !usedVerbs.includes(v.infinitive_es));
  if (unusedVerbs.length === 0) usedVerbs = [];
  const sourceArray = unusedVerbs.length > 0 ? unusedVerbs : allVerbData;

     const v = sourceArray[Math.floor(Math.random() * sourceArray.length)];
     if (!v || !v.conjugations || !v.infinitive_en) {
       console.error("Selected verb is invalid:", v);
       setTimeout(prepareNextQuestion, 50);
       return;
     }

     if (!usedVerbs.includes(v.infinitive_es)){
          usedVerbs.push(v.infinitive_es);
     }
     
   // ←──— INSERCIÓN A partir de aquí ───—
   // Paso 1: lee los botones de pronombre activos
   const selectedBtns = Array
     .from(document.querySelectorAll('.pronoun-group-button'))
     .filter(btn => btn.classList.contains('selected'));
 
   // aplana sus valores JSON en un solo array
   const allowedPronouns = selectedBtns.flatMap(btn =>
     JSON.parse(btn.dataset.values)
   );
 
   // Paso 2: construye pronList con fallback a la lista global
   const pronList = allowedPronouns.length > 0
     ? allowedPronouns
     : pronouns;   // ['yo','tú','él','nosotros','vosotros','ellos']
 
   // Paso 3: elige el pronombre interno de pronList
   const originalPronoun = pronList[
     Math.floor(Math.random() * pronList.length)
   ];
	  const displayPronoun = (function() {
		const map = {
		  él:       ['él','ella','usted'],
		  nosotros: ['nosotros','nosotras'],
		  ellos:    ['ellos','ellas','ustedes']
		};
		const arr = map[originalPronoun] || [originalPronoun];
		return arr[Math.floor(Math.random() * arr.length)];
	  })();
  const tKey = currentOptions.tenses[Math.floor(Math.random() * currentOptions.tenses.length)];
  const tenseObj = tenses.find(t => t.value === tKey);
  const tenseLabel = tenseObj ? tenseObj.name : tKey;

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

  const rawEN = v.infinitive_en.toLowerCase();                   // p.ej. "to remember / to recall"
  const expectedEN = rawEN
    .split(/\s*\/\s*/)                                           // ["to remember", "to recall"]
    .map(s => s.replace(/^to\s+/, '').trim());                  // ["remember","recall"]

  currentQuestion = {
    verb: v,
    pronoun: originalPronoun,
    displayPronoun,
    answer: correctES,
    expectedEN,                                                  // ahora es array
    tenseKey: tKey,
    hintLevel: 0
  };
  startTime = Date.now();
  ansES.value = '';
  ansEN.value = '';
    isPrizeVerbActive = false; // Reset por defecto
	qPrompt.classList.remove('prize-verb-active'); // Quitar estilo especial

	if (selectedGameMode === 'lives' && (currentOptions.mode === 'productive_easy' || currentOptions.mode === 'productive')) {
	  let prizeChance = 0;
	  if (currentOptions.mode === 'productive_easy') { // Conjugate
		prizeChance = 1/40;
	  } else if (currentOptions.mode === 'productive') { // Produce
		prizeChance = 1/3;
	  }

	  const isVerbReflexive = currentQuestion.verb.infinitive_es.endsWith('se');
	  const typesForCurrentTense = currentQuestion.verb.types[currentQuestion.tenseKey] || [];
	  const isVerbIrregular = typesForCurrentTense.some(type => type !== 'regular') || typesForCurrentTense.length === 0; // Asume que si no tiene 'regular', es irregular.

	  if (Math.random() < prizeChance && (isVerbIrregular || isVerbReflexive)) {
		isPrizeVerbActive = true;
		// Aplicar estilo visual especial (ver punto 🧩3)
		qPrompt.classList.add('prize-verb-active'); // Añadir clase para CSS
		 const prizeNote = document.createElement('div');
		 prizeNote.id = 'prize-note';
		 prizeNote.textContent = '🎁Lucky life if you conjugate this one correctly🎁!';
		 qPrompt.parentNode.insertBefore(prizeNote, qPrompt.nextSibling);
		// TODO: Modificar promptText para indicar que es premio
		console.log("VERBO PREMIO ACTIVADO!");
	  }
	}

  let promptText;
  if (currentOptions.mode === 'productive') {
     promptText = `<span class="tense-label">${tenseLabel}:</span> `
                + `"${v.infinitive_en}" – `
                + `<span class="pronoun" id="${displayPronoun}">${displayPronoun}</span>`;
    qPrompt.innerHTML = promptText;
    esContainer.style.display = 'block';
    enContainer.style.display = 'none';
    ansES.focus();
  } else if (currentOptions.mode === 'productive_easy') {
    promptText = `<span class="tense-label">${tenseLabel}:</span> `
               + `"${v.infinitive_es}" – `
               + `<span class="pronoun" id="${displayPronoun}">${displayPronoun}</span>`;
    qPrompt.innerHTML = promptText;
    esContainer.style.display = 'block';
    enContainer.style.display = 'none';
    ansES.focus();
  } else {
  // sólo la forma en español, p.ej. “come”
    promptText = `<span class="tense-label">${tenseLabel}:</span> `
               + `"${currentQuestion.answer}"`;
    qPrompt.innerHTML = promptText;
    esContainer.style.display = 'none';
    enContainer.style.display = 'block';
    ansEN.focus();
  }
}

function checkAnswer() {
  let possibleCorrectAnswers = [];
  const rt    = (Date.now() - startTime) / 1000;
  const bonus = Math.max(1, 2 - Math.max(0, rt - 5) * 0.1); 
  const irregularities = currentQuestion.verb.types[currentQuestion.tenseKey] || [];
  let correct  = false;
  let accentBonus = 0;
  const rawAnswerES = ansES.value.trim();
  let irregularBonus = 0;
  let reflexiveBonus  = 0;
  if (irregularities.length > 0 && !irregularities.includes('regular')) {
    irregularBonus = 10 * irregularities.length;  // 5 puntos por cada tipo de irregularidad
  }
  
  const isReflexive = currentQuestion.verb.infinitive_es.endsWith('se');
  if (isReflexive && toggleReflexiveBtn.classList.contains('selected')) {
  reflexiveBonus = 10;
  }

  if (currentOptions.mode === 'productive' || currentOptions.mode === 'productive_easy') {
    let ans = ansES.value.trim().toLowerCase();
    let cor = currentQuestion.answer.toLowerCase();
    if (currentOptions.ignoreAccents) {
      ans = removeAccents(ans);
      cor = removeAccents(cor);
    }
    correct = ans === cor;

    if (correct && !currentOptions.ignoreAccents) {
      if (/[áéíóúÁÉÍÓÚ]/.test(currentQuestion.answer)) {
        accentBonus = 8; 
      }
    }
  } else {
    const ans = ansEN.value.trim().toLowerCase();
    const tense = currentQuestion.tenseKey;        // p.ej. 'present'
    const spanishForm = currentQuestion.answer;    
    const verbData = currentQuestion.verb;
	
    if (ans === '' && currentQuestion.hintLevel === 0) {
        feedback.innerHTML = `💡 The English infinitive is <strong>${verbData.infinitive_en}</strong>.`;
		timerTimeLeft = Math.max(0, timerTimeLeft - 3);
        currentQuestion.hintLevel = 1; // Marcar que la pista ha sido solicitada/dada
        ansEN.focus();
        return; 
    }

    const allForms = verbData.conjugations[tense];
    if (!allForms) {
        console.error(`Modo Receptivo: Faltan conjugaciones para ${verbData.infinitive_es} en ${tense}`);
		timerTimeLeft = Math.max(0, timerTimeLeft - 3);
        feedback.innerHTML = "Error: Datos del verbo incompletos para esta pregunta.";
        return;
    }
    // Paso 3A: quedarnos solo con los pronombres que estén activos (window.pronouns)
    const spPronouns = Object
      .entries(allForms)
      .filter(([p, form]) =>
        pronouns.includes(p) && form === spanishForm
      )
      .map(([p]) => p);         
	const pronounGroupMap = {
	  yo:       ['I'],
	  tú:       ['you'],
	  él:       ['he','she','you'],
	  ella:     ['he','she','you'],
	  usted:    ['you'],      
	  nosotros: ['we'],
	  nosotras: ['we'],

	  vosotros: ['you all'],
	  vosotras: ['you all'],
	  ellos:    ['they','you all'],
	  ellas:    ['they','you all'],
	  ustedes:  ['you all']
	};

    const engProns = Array.from(new Set(
        spPronouns.flatMap(sp => pronounGroupMap[sp] || [])
    ));

    if (engProns.length === 0 && spPronouns.length > 0) {
        console.warn(`Modo Receptivo: No se mapearon pronombres ingleses para la forma '${spanishForm}' (pronombres ES: ${spPronouns.join(', ')}). Usando infinitivo como pista.`);
        if (ans !== '') { 
            timerTimeLeft = Math.max(0, timerTimeLeft - 3);
			feedback.innerHTML = `❌ Incorrecto. La pista es el infinitivo: <strong>${verbData.infinitive_en}</strong>.`;
            currentQuestion.hintLevel = 1;
            ansEN.value = '';
            ansEN.focus();
        }
        return;
    } else if (engProns.length === 0 && spPronouns.length === 0) {
       console.error(`Modo Receptivo: No se encontraron pronombres en español para la forma '<span class="math-inline">\{spanishForm\}' del verbo '</span>{verbData.infinitive_es}'.`);
       feedback.innerHTML = `Error: No se pudo procesar la pregunta. La pista es el infinitivo: <strong>${verbData.infinitive_en}</strong>.`;
       currentQuestion.hintLevel = 1;
       ansEN.value = '';
       ansEN.focus();
       return;
    }

	const formsForCurrentTenseEN = verbData.conjugations_en[tense];

	if (!formsForCurrentTenseEN) {
		console.error(`Receptive Mode: Missing ENGLISH conjugations for ${verbData.infinitive_en} in tense ${tense}`);
		feedback.innerHTML = `Error: English conjugation data is missing for the tense '${tense}'.`; // English
		return;
	}

	possibleCorrectAnswers = engProns.flatMap(englishPronoun => {
	  // 1) Determinamos la clave para indexar el JSON de EN:
	  let formKey;
	  if (englishPronoun === 'I') {
		formKey = 'I';
	  } else if (englishPronoun === 'you all') {
		formKey = 'you';
	  } else {
		formKey = englishPronoun.toLowerCase();
	  }

	  // 2) Recuperamos la forma conjugada en inglés
	  const verbEN = formsForCurrentTenseEN[formKey];
	  if (!verbEN) return [];

	  const base = verbEN.toLowerCase();

	  // 3) Para cada infinitivo (sinónimos) en expectedEN:
	  return currentQuestion.expectedEN.flatMap(inf => {
		// inf es p.ej. "remember" o "recall" o "be at"
		const parts = inf.split(' ');
		const suffix = parts.length > 1
		  ? ' ' + parts.slice(1).join(' ')
		  : '';
		// 4) Construir la respuesta según el pronombre
		if (englishPronoun === 'I') {
		  return [
			`I ${base}${suffix}`,
			`i ${base}${suffix}`
		  ];
		}
		if (englishPronoun === 'you all') {
		  return [`you all ${base}${suffix}`];
		}
		const pronLower = englishPronoun.toLowerCase();
		return [`${pronLower} ${base}${suffix}`];
	  });
	});

	if (possibleCorrectAnswers.length === 0 && engProns.length > 0) {
		console.error(`Receptive Mode: Could not form any English answers for ${verbData.infinitive_en} (tense: ${tense}) with English pronouns: ${engProns.join(', ')}. Check conjugations_en in verbos.json.`);
		feedback.innerHTML = `Error: No English conjugated forms found for the tense '${tense}'.`; // English
		return;
	}

	correct = possibleCorrectAnswers.includes(ans);
}

  if (correct) {
    soundCorrect.play();
	
	if (soundCorrect) {
	  soundCorrect.pause();
	  soundCorrect.currentTime = 0;
	  soundCorrect.play().catch(()=>{/* ignora errores por autoplay */});
}
	
    streak++;
	if (streak > bestStreak) bestStreak = streak;
    multiplier = Math.min(5, multiplier + 0.5);

    
	let basePoints = 10;  
	if (currentOptions.mode === 'receptive') {  

	  basePoints = 5;  
	} else if (currentOptions.mode === 'productive') {  
  
 	 basePoints = 15;  
	}  
  
	multiplier = 1 + 0.1 * streak;  // o el incremento que prefieras
	
	const pts = Math.round(basePoints * multiplier * bonus)
			  + accentBonus
			  + irregularBonus
			  + reflexiveBonus;
	
    score += pts;
    let feedbackText = `✅ ¡Correcto!<br>Time: ${rt.toFixed(1)}s ×${bonus.toFixed(1)}`;
    if (accentBonus > 0) {
       feedbackText += ` +${accentBonus} accent bonus!`; 
    }
	
	let timeBonus;
	if (streak <= 2)       timeBonus = 5;
	else if (streak <= 4)  timeBonus = 6;
	else if (streak <= 6)  timeBonus = 7;
	else if (streak <= 8)  timeBonus = 8;
	else if (streak <= 10) timeBonus = 9;
	else                   timeBonus = 10;
	// opcional: máximo 240 s
	timerTimeLeft = Math.min(240, timerTimeLeft + timeBonus);
	showTimeChange(timeBonus);

    updateScore();
    setTimeout(prepareNextQuestion, 200);
	
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
   
   if (selectedGameMode === 'lives') {
    // ---> INICIO MECÁNICA 1 <---
    totalCorrectAnswersForLife++; // Este es el que acumula para esta mecánica específica

    if (totalCorrectAnswersForLife >= correctAnswersToNextLife) {
      remainingLives++;
      // TODO: Llamar a función para animación/sonido de ganar vida
      console.log("VIDA EXTRA por acumulación! Vidas:", remainingLives);
	  // refrescar UI de vidas y título ANTES de la animación
      updateTotalCorrectForLifeDisplay();
      updateGameTitle();
      showLifeGainedAnimation(); // Implementar esta función más adelante

      nextLifeIncrement++; // El siguiente incremento es uno más
      correctAnswersToNextLife += nextLifeIncrement; // Nuevo objetivo
    }
    updateTotalCorrectForLifeDisplay(); // Actualizar visualización
    // ---> FIN MECÁNICA 1 <---
	    // ---> INICIO MECÁNICA 2 <---
    currentStreakForLife++;
    if (currentStreakForLife >= streakGoalForLife) {
      remainingLives++;
      console.log("VIDA EXTRA por racha! Vidas:", remainingLives);
	  updateGameTitle();
	  updateStreakForLifeDisplay();
	  updateTotalCorrectForLifeDisplay();
      showLifeGainedAnimation();

      lastStreakGoalAchieved = streakGoalForLife; // Guardar el objetivo que acabamos de alcanzar
      streakGoalForLife += 2; // Siguiente objetivo
      currentStreakForLife = 0;
	  updateGameTitle();
      updateStreakForLifeDisplay();
    }
    updateStreakForLifeDisplay();
    // ---> FIN MECÁNICA 2 <---
	// ---> INICIO MECÁNICA 3 <---
    if (isPrizeVerbActive) {
      remainingLives++;
      // TODO: Llamar a función para animación/sonido de ganar vida (SONIDO ESPECIAL)
      console.log("VIDA EXTRA por VERBO PREMIO! Vidas:", remainingLives);
      showLifeGainedAnimation(true); // true indica que es por verbo premio para sonido especial

      isPrizeVerbActive = false; // Se consume el premio
      qPrompt.classList.remove('prize-verb-active'); // Quitar estilo
    }
    // ---> FIN MECÁNICA 3 <---
    }

	if (irregularBonus > 0) {
       feedbackText += `<br>+${irregularBonus} irregularity bonus!`;
       feedbackText += `<br><small>${irregularityDescriptions}</small>`;
    }
	
	if (reflexiveBonus > 0) {
  	  feedbackText += `<br>+${reflexiveBonus} 🧩reflexive bonus!`;
    }
	
	feedbackText += `<br>Points: ${pts}`;
    feedback.innerHTML = feedbackText;
    feedback.classList.add('vibrate'); 
	
    return;   
  } else {
    soundWrong.play();
    streak = 0;
    multiplier = 1.0;
	
    if (isPrizeVerbActive) {
      isPrizeVerbActive = false; // Se pierde la oportunidad del verbo premio
      qPrompt.classList.remove('prize-verb-active'); // Quitar estilo
    }
	// ⌛ Penalización por error
	timerTimeLeft = Math.max(0, timerTimeLeft - 3);
	showTimeChange(-3);
	
    if (selectedGameMode === 'lives') {
      remainingLives--;

	  currentStreakForLife = 0;


	  isPrizeVerbActive = false;
	  // Actualizar los contadores visuales a su estado inicial
	  updateTotalCorrectForLifeDisplay();
	  updateStreakForLifeDisplay();
	  // ---> FIN RESETEO <---
	  currentStreakForLife = 0;
      updateStreakForLifeDisplay();
    // ---> FIN RESETEO MECÁNICA 2 <---

	

       updateGameTitle();              
      if (remainingLives <= 0) {
        soundGameOver.play();  
		gameTitle.textContent = '💀 ¡Estás MUERTO!';
		checkButton.disabled = true;
        skipButton.disabled  = true;
		ansEN.disabled = true;
		ansES.disabled = true;

        if (name) {
		  db.collection("records").add({
        name: name,
        score: score,
        mode: selectedGameMode,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
		tense: currentOptions.tenses,
		verb: currentQuestion.verb.infinitive_es,
		streak: bestStreak
      })
      .then(() => {
        console.log("Record saved online!");
		renderSetupRecords(); 
		quitToSettings();
      })
      .catch(error => console.error("Error saving record:", error));
	}
	   return; 

        }
      } else {
        updateGameTitle();
      }
    }
    updateScore();
		if (currentOptions.mode === 'receptive') {
		let hintMessage = `💡 The English infinitive is <strong>${currentQuestion.verb.infinitive_en}</strong>.`;
		if (possibleCorrectAnswers && possibleCorrectAnswers.length > 0) {
			const exampleAnswers = possibleCorrectAnswers.slice(0, Math.min(possibleCorrectAnswers.length, 3)).map(a => `'${a}'`);
		} else {
			hintMessage += `<br>Could not determine specific example answers. Check verb data.`;
		}

		feedback.innerHTML = hintMessage;
		ansEN.value = '';
		setTimeout(() => ansEN.focus(), 0);
		return;
	} else if (currentOptions.mode === 'productive' || currentOptions.mode === 'productive_easy') {
		// Existing hint logic for productive modes (should be in English already based on your original code)
		if (currentQuestion.hintLevel === 0) {
			feedback.innerHTML =
			  `❌ Incorrect. <em>Clue 1:</em> infinitive is ` +
			  `<strong>${currentQuestion.verb.infinitive_es}</strong>.`; // This refers to Spanish infinitive, which is contextually correct for this mode
			currentQuestion.hintLevel = 1;
		} else if (currentQuestion.hintLevel === 1) {
			// Ensure tenseKey is used if currentOptions.tenses can be an array
			const conjTenseKey = currentQuestion.tenseKey;
			const conj = currentQuestion.verb.conjugations[conjTenseKey];
			const botones = Object.entries(conj || {}) // Add guard for conj
				.filter(([pr]) => pr !== currentQuestion.pronoun)
				.map(([, form]) => `<span class="hint-btn">${form}</span>`)
				.join('');
			feedback.innerHTML =
				`❌ Incorrect. <em>Clue 2:</em> ` + botones;
			// currentQuestion.hintLevel = 2; // No level 2 in original
		}
		ansES.value = '';
		setTimeout(() => ansES.focus(), 0);
	}
}
function startTimerMode() {
  document.getElementById('timer-container').style.display = 'flex';
  timerTimeLeft      = countdownTime;     
  totalPlayedSeconds = 0;
  document.getElementById('timer-clock').textContent   = `⏳ ${formatTime(timerTimeLeft)}`;
  document.getElementById('total-time').textContent    = `🏁 ${formatTime(totalPlayedSeconds)}`;
  document.getElementById('time-change').textContent   = '';  // vacío al inicio
  
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

    musicToggle.style.display = 'block';
    volumeSlider.style.display = 'block';
    volumeSlider.value = targetVolume;
    volumeSlider.disabled = false;
  }, 3000);

  prepareNextQuestion();

	countdownTimer = setInterval(() => {
	  timerTimeLeft--;
	  totalPlayedSeconds++;
	document.getElementById('timer-clock').textContent  = `⏳ ${formatTime(timerTimeLeft)}`;
	document.getElementById('total-time').textContent   = `🏁 ${formatTime(totalPlayedSeconds)}`;


	  const clk = document.getElementById('timer-clock');
	  if (timerTimeLeft <= 10) {
		clk.style.color = '#ff4c4c';
		clk.style.transform = 'scale(1.1)';
	  } else {
		clk.style.color = 'white';
		clk.style.transform = 'scale(1)';
	  }

   if (timerTimeLeft <= 0) {
	  soundGameOver.play();
      clearInterval(countdownTimer);
  
      const name = prompt('⏱️ Time is up! Your name?');
      if (name) {
        db.collection("records").add({
          name: name,
          score: score,
          mode: selectedGameMode,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          tense: currentOptions.tenses,
          verb: currentQuestion.verb.infinitive_es,
          streak: bestStreak
        })
        .then(() => {
          console.log("Record saved online!");
          renderSetupRecords();
        })
        .catch(error => console.error("Error saving record:", error));
      }

      quitToSettings();
    }
  }, 1000);
}

function updateTotalCorrectForLifeDisplay() {
  const displayElement = document.getElementById('total-correct-for-life-display');
  if (displayElement && selectedGameMode === 'lives') {
    const needed = correctAnswersToNextLife - totalCorrectAnswersForLife;
    displayElement.textContent = `🎯 ${needed} to get 1❤️`;
  } else if (displayElement) {
    displayElement.textContent = ''; // Limpiar si no es modo vidas
  }
}

function skipQuestion() {
	console.log('⏭ skipQuestion called');
	if (soundSkip) {
	  soundSkip
		.play()
		.then(() => console.log('🔈 skip sound played'))
		.catch(err => console.error('❌ skip sound error:', err));
	} else {
	  console.error('❌ soundSkip is undefined');
	}
    streak = 0;
    multiplier = 1.0;
    updateScore();
	timerTimeLeft = Math.max(0, timerTimeLeft - 3);
	showTimeChange(-3);
	
    let feedbackMessage;

    if (currentOptions.mode === 'receptive') {
		const tense = currentQuestion.tenseKey;
		const spanishForm = currentQuestion.answer;
		const verbData = currentQuestion.verb;

		const allFormsForTenseES = verbData.conjugations[tense];
		if (!allFormsForTenseES) {
			feedbackMessage = `⏭ Skipped. Error: Spanish verb data incomplete for tense '${tense}'. English Infinitive: <strong>${verbData.infinitive_en}</strong>`;
		} else {
			const spPronounsMatchingForm = Object.keys(allFormsForTenseES)
				.filter(p => allFormsForTenseES[p] === spanishForm);

			const pronounGroupMap = { /* ... your existing pronounGroupMap ... */
				yo: ['I'], tú: ['you'], él: ['he', 'she', 'you'], ella: ['he', 'she', 'you'],
				usted: ['you'], nosotros: ['we'], nosotras: ['we'], vosotros: ['you'],
				vosotras: ['you'], ellos: ['they', 'you'], ellas: ['they', 'you'], ustedes: ['you']
			};

			const engProns = Array.from(new Set(
				spPronounsMatchingForm.flatMap(sp => pronounGroupMap[sp] || [])
			));

			if (engProns.length > 0) {
				const formsForCurrentTenseEN_Skip = verbData.conjugations_en[tense];

				if (!formsForCurrentTenseEN_Skip) {
					feedbackMessage = `⏭ Skipped. Error: Missing ENGLISH conjugations for '${verbData.infinitive_en}' in tense '${tense}'. English Infinitive: <strong>${verbData.infinitive_en}</strong>`;
				} else {
					const expectedAnswersArray = engProns.flatMap(englishPronoun => {
						let formKey = englishPronoun.toLowerCase();
						if (englishPronoun === 'I') {
							formKey = 'I';
						}
						const conjugatedVerbEN = formsForCurrentTenseEN_Skip[formKey];
						if (conjugatedVerbEN) {
							return [`<strong>${englishPronoun.toLowerCase()} ${conjugatedVerbEN.toLowerCase()}</strong>`];
						}
						return [];
					});

					if (expectedAnswersArray.length > 0) {
						feedbackMessage = `⏭ Skipped. The correct answer was: ${expectedAnswersArray.join(' or ')}.`;
					} else {
						feedbackMessage = `⏭ Skipped. The English infinitive is <strong>${verbData.infinitive_en}</strong>. (Could not determine specific English conjugation for '${spanishForm}' in tense '${tense}')`;
					}
				}
			} else {
				feedbackMessage = `⏭ Skipped. The English infinitive is <strong>${verbData.infinitive_en}</strong>. (Could not determine English pronouns for '${spanishForm}')`;
			}
		}
	} else {
    // Original logic for productive modes (should be in English)
		const correctAnswer = currentQuestion.answer;
		feedbackMessage = `⏭ Skipped. The right conjugation was <strong>"${correctAnswer}"</strong>.`;
	}
	if (selectedGameMode === 'lives') {
		// 1) Reset de racha
		currentStreakForLife = 0;
		updateStreakForLifeDisplay();

		// 2) Quitar 1 vida
		remainingLives--;
		updateGameTitle();
		updateTotalCorrectForLifeDisplay();

		// 3) Comprobar GAME OVER
		if (remainingLives <= 0) {
		  soundGameOver.play();
		  gameTitle.textContent   = '💀¡Estás MUERTO!💀';
		  checkButton.disabled    = true;
		  skipButton.disabled     = true;
		  ansEN.disabled          = true;
		  ansES.disabled          = true;

		  if (name) {
			db.collection("records").add({
			  name: name,
			  score: score,
			  mode: selectedGameMode,
			  timestamp: firebase.firestore.FieldValue.serverTimestamp(),
			  tense: currentOptions.tenses,
			  verb: currentQuestion.verb.infinitive_es,
			  streak: bestStreak
			})
			.then(() => { renderSetupRecords(); quitToSettings(); })
			.catch(console.error);
		  }
		  return;  // NO llamamos a prepareNextQuestion
		}
	  }

	  // Si no es game-over, preparamos la siguiente pregunta
	  setTimeout(prepareNextQuestion, 1500);
	}

function updateStreakForLifeDisplay() {
  const el = document.getElementById('streak-for-life-display');
  if (!el || selectedGameMode !== 'lives') {
    if (el) el.textContent = '';
    return;
  }

  // Cuenta atrás: faltan “remaining” aciertos para la próxima vida
  const remaining = Math.max(streakGoalForLife - currentStreakForLife, 0);
  el.innerHTML = `🔥 <span class="math-inline">${remaining}</span> to get 1❤️`;
}

function quitToSettings() {
  document.getElementById('timer-container').style.display = 'none';
  clearInterval(countdownTimer);
  music.pause();
  music.currentTime = 0;
  musicToggle.textContent = '🔇';
  musicToggle.style.display = 'none';
  volumeSlider.disabled = true;
  musicPlaying = false;
  
  
  gameScreen.style.display = 'none';
  setupScreen.style.display = 'block';
  
  document.getElementById('setup-records').classList.remove('hidden');

    // Restablecer selecciones de botones a sus valores predeterminados
    selectedGameMode = 'infinite'; // Modo de juego por defecto
    document.querySelectorAll('#game-modes .mode-button').forEach(btn => {
        btn.classList.toggle('selected-mode', btn.dataset.mode === 'infinite');
    });
    document.querySelectorAll('.config-button').forEach(btn => {
        // Asegúrate de que 'productive' es el modo de configuración por defecto deseado
        btn.classList.toggle('selected-mode', btn.dataset.mode === 'productive');
    });
     // Actualizar currentOptions.mode al modo por defecto
    const defaultConfigButton = document.querySelector('.config-button[data-mode="productive"]');
    if (defaultConfigButton) {
        currentOptions.mode = defaultConfigButton.dataset.mode;
    }
	playHeaderIntro();
    renderTenseButtons(); // Restaura los botones de tiempo (Presente seleccionado por defecto)
	initTenseDropdown();
    renderVerbTypeButtons(); // Restaura los botones de tipo de verbo (todos seleccionados por defecto)
    filterVerbTypes(); // Aplica filtros basados en los tiempos por defecto

    // Asegurar que el botón de reflexivos esté en su estado HTML por defecto (seleccionado)
    const reflexBtn = document.getElementById('toggle-reflexive');
    if (reflexBtn && !reflexBtn.classList.contains('selected')) { // Si no está seleccionado, selecciónalo
        reflexBtn.classList.add('selected');
    } else if (reflexBtn && reflexBtn.classList.contains('selected')) {
        // Si ya está seleccionado (estado por defecto), no hagas nada o asegúralo.
    }

  loadVerbs();

    checkButton.disabled = false; skipButton.disabled = false; endButton.disabled = false;
    document.getElementById('game-modes').style.display = 'flex';
    updateRanking();
    remainingLives = 5;
}

  setupForm.addEventListener('submit', async e => {
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
const livesMechanicsDisplay = document.getElementById('lives-mechanics-display');
if (selectedGameMode === 'lives') {
  livesMechanicsDisplay.style.display = 'block';
  remainingLives = 5; // Reset
  // ... resetear variables de Mecánica 1 y 2 ...
  updateTotalCorrectForLifeDisplay();
  updateStreakForLifeDisplay();
} else {
  livesMechanicsDisplay.style.display = 'none';
}
updateGameTitle(); // Para que muestre las vidas

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

function updateGameTitle() {
  // 1) Define etiquetas amigables para cada modo
  const modeLabels = {
    'infinite':   'Infinite',
    'timer':      'Timer 4m',
    'lives':      'Lives',
    'receptive':  'Recall',
    'productive_easy': 'Conjugate',
    'productive': 'Produce'
  };

  // 2) Construye la lista de tiempos separados por comas
  const tm = currentOptions.tenses
    .map(t => t.replace('_', ' '))
    .join(', ');

  // 3) Elige la etiqueta correcta o, si no existe, el valor crudo
  const displayMode = modeLabels[currentOptions.mode] || currentOptions.mode;

  // 4) Monta el HTML del título con saltos de línea
  let html = `Mode: ${displayMode}<br>`;
  html += `Tenses: ${tm}`;

  // 5) Si es modo vidas, añade otra línea con el contador
  if (selectedGameMode === 'lives') {
    html += `<br><span id="lives-count" style="font-size: 1.5em; vertical-align: middle;">${remainingLives}</span><img src="images/heart.png" alt="life" style="width:40px; height:40px; vertical-align: middle; margin-left: 6px;">`;
  }

  // 6) Renderiza como HTML en lugar de textContent
  gameTitle.innerHTML = html;
}

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


  if (helpButton && tooltip) {
      helpButton.addEventListener('mouseover', (event) => {
          const tooltipContentHTML = `
              <div class="tooltip-row">
                  <div class="tooltip-box">
                      <h5>♾️ Infinite </h5>
                      <p>Play without time or life limits. Aim for the highest score and longest streak!</p>
                  </div>
                  <div class="tooltip-box">
                      <h5>⏱️ Timer</h5>
                      <p>Score as many points as possible within the 4-minute time limit.</p>
                  </div>
                  <div class="tooltip-box">
                      <h5>💖 Lives</h5>
                      <p>You have 5 lives. Each incorrect answer costs one life. Survive as long as you can!</p>
                  </div>
              </div>
              <div class="tooltip-row">
                  <div class="tooltip-box">
                      <h5>💭 Recall</h5>
                      <p>EASY - Given a Spanish tense and conjugation, type the English pronoun and <strong>base verb in present tense</strong>.<p><strong>Base points:</strong> +5
                      <div class="example-prompt">"SIMPLE PAST: recordé"</div>
                      <div class="typing-animation" id="recall-anim"></div>
                  </div>
                  <div class="tooltip-box">
                      <h5>⚙️ Conjugate</h5>
                      <p>NORMAL - Given a Spanish verb and pronoun, type the correct conjugated form in Spanish.<p><strong>Base points:</strong> +10
                      <div class="example-prompt">"conjugar – nosotros"</div>
                      <div class="typing-animation" id="easy-anim"></div>
                  </div>
				  <div class="tooltip-box">
				      <h5>⌨️ Produce</h5>
				      <p>HARD - Given the English verb and a Spanish pronoun, type the correct conjugation in Spanish. <p><strong>Base points:</strong> +15
	                  <div class="example-prompt">"Present: to love – yo"</div>
                      <div class="typing-animation" id="produce-anim"></div>
				  </div>
              </div>
          `;
          tooltip.innerHTML = tooltipContentHTML; 
          /*const btnRect = helpButton.getBoundingClientRect(); // Posición del botón
          const bodyRect = document.body.getBoundingClientRect(); // Posición del body
          const scrollOffsetY = window.scrollY; // Cuánto se ha hecho scroll vertical
          const scrollOffsetX = window.scrollX; // Cuánto se ha hecho scroll horizontal
		  

          let topPos = btnRect.bottom + scrollOffsetY + 10; // Más margen hacia abajo
          let leftPos = btnRect.left + scrollOffsetX - 50;  // Desplaza a la izquierda
          

          tooltip.style.top = `${topPos}px`;
          tooltip.style.left = `${leftPos}px`;*/
          tooltip.style.display = 'block';

          /*const tooltipRect = tooltip.getBoundingClientRect(); // Tamaño y posición REAL del tooltip mostrado

          // Ajustar izquierda si se sale por la derecha
          if (tooltipRect.right > window.innerWidth - 10) {
             leftPos = window.innerWidth - tooltipRect.width - 10 - bodyRect.left + scrollOffsetX;
          }
          // Ajustar arriba si se sale por abajo (preferir ponerlo arriba del botón)
          if (tooltipRect.bottom > window.innerHeight - 10) {
             topPos = btnRect.top - bodyRect.top + scrollOffsetY - tooltipRect.height - 5; // Arriba - 5px margen
          }
¡          leftPos = Math.max(10 + scrollOffsetX, leftPos);

          // Reaplica la posición ajustada
          tooltip.style.top = `${topPos}px`;
          tooltip.style.left = `${leftPos}px`;*/

          const produceAnimElement = document.getElementById('produce-anim');
          const recallAnimElement = document.getElementById('recall-anim');

          if (produceAnimElement) {
              // Usar setTimeout pequeño para asegurar que el DOM se actualice antes de animar
              setTimeout(() => typeWriter(produceAnimElement, 'amo', 300), 50);
          }
          if (recallAnimElement) {
               setTimeout(() => typeWriter(recallAnimElement, 'I remember', 300), 50);
          }
		  const easyAnimElement = document.getElementById('easy-anim');
          if (easyAnimElement) {
               setTimeout(() => typeWriter(easyAnimElement, 'conjugamos', 300), 50);
}

      }); // Fin del listener 'mouseover'

      helpButton.addEventListener('mouseout', () => {
          tooltip.style.display = 'none'; // Ocultar el tooltip
          clearInterval(typeInterval); // DETENER la animación de escritura si está en curso
          tooltip.innerHTML = ''; // Limpiar el contenido para evitar problemas
      }); // Fin del listener 'mouseout'


  } else {
      // Este console.error ahora sí debería poder encontrar los elementos
      console.error("Help button (?) or tooltip container (#tooltip) not found OR script order issue.");
  }

const leftBubbles = document.getElementById('left-bubbles');
const rightBubbles = document.getElementById('right-bubbles');
let bubblesActive = false;
let leftBubbleInterval, rightBubbleInterval;

function showLifeGainedAnimation() {
	
  // 1) SONIDO: ver si la variable existe y está lista
  if (soundLifeGained) {
    try {
      soundLifeGained.currentTime = 0;
      const playPromise = soundLifeGained.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => console.log('🔊 soundLifeGained.play() OK'))
          .catch(err => console.warn('⚠️ Error al reproducir sonido:', err));
      }
    } catch (e) {
      console.error('⚠️ Excepción al reproducir sonido:', e);
    }
  } else {
    console.warn('⚠️ soundLifeGained es null o undefined');
  }
  
  // 2) POP en contador de vidas
  const livesEl = document.getElementById('lives-count');
  console.log('❤️ Preparando pop en:', livesEl);
  if (livesEl) {
    livesEl.classList.add('just-gained');
    livesEl.addEventListener('animationend', () => {
      livesEl.classList.remove('just-gained');
    }, { once: true });
  }

  // 3) CONFETI: asegurarnos de que el canvas está visible
  const canvas = document.getElementById('life-confetti-canvas');
  console.log('🎨 Canvas encontrado:', canvas);
  if (!canvas) return;
  // mostrarlo explícitamente
  canvas.style.display = 'block';
  console.log('🎨 Canvas style after display:', getComputedStyle(canvas).display);

  
  const ctx  = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  canvas.width  = rect.width;
  canvas.height = rect.height;
  console.log('🎨 Canvas tamaño de backing:', canvas.width, canvas.height);

  // generar partículas…
  const particles = [];
  const total     = 80;
  const colors    = ['#ff5e5e', '#ffb3b3', '#ffe2e2', 'lightgreen', '#90ee90']; // Añadido verdes
    
	function drawHeart(x, y, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    const topY = y - size / 3;
    ctx.moveTo(x, topY);
    ctx.bezierCurveTo(x, y - size, x - size, y - size/3, x, y + size);
    ctx.bezierCurveTo(x + size, y - size/3, x, y - size, x, topY);
    ctx.fill();
    ctx.restore();
  }

  for (let i = 0; i < total; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 50, // Iniciar desde abajo o justo fuera de la vista
      vx: Math.random() * 8 + 2,              // entre +2 y +10 px/frame
      vy: -Math.random() * 15 - 8,    
      size: Math.random() * 10 + 5,           // Tamaños un poco más grandes
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() < 0.5 ? 'heart' : 'square', // Más corazones
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 5
    });
  }

  let start = null;
  function animate(ts){
    if(!start) start = ts;
    const elapsed = ts - start;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // Gravedad un poco más fuerte
      p.rotation += p.rotationSpeed;
      if(p.shape==='heart'){
        drawHeart(p.x,p.y,p.size,p.color);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x,p.y,p.size,p.size);
      }
    });
    if(elapsed < 2500){
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      canvas.style.display = 'none';
      console.log('🎨 Animación terminada y canvas oculto');
    }
  }
  requestAnimationFrame(animate);
}



function startBubbles() {
  if (bubblesActive) return;   // ya arrancadas
  bubblesActive = true;
  leftBubbleInterval = setInterval(() => {
    createBubble('left');
  }, 1800);
  rightBubbleInterval = setInterval(() => {
    createBubble('right');
  }, 2100);
}

function stopBubbles() {
  bubblesActive = false;
  clearInterval(leftBubbleInterval);
  clearInterval(rightBubbleInterval);
  leftBubbles.innerHTML  = '';
  rightBubbles.innerHTML = '';
}
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
  // 1) Reproducir solo el sonido
  soundbubblepop.currentTime = 0;
  soundbubblepop.play();

  // 2) Quitar la burbuja
  bubble.remove();
  });
}

window.addEventListener('resize', () => {
  if (window.innerWidth <= 1200) {
    stopBubbles();
  } else {
    startBubbles();
  }
});
if (window.innerWidth > 1200) startBubbles();
});                      // cierra DOMContentLoaded', …)

// © 2025 Pablo Torrado, University of Hong Kong.
// Licensed under CC BY-NC-ND 4.0: https://creativecommons.org/licenses/by-nc-nd/4.0/