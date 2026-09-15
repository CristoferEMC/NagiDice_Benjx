// NAGI DICE - Color Dice Roller Application Logic

document.addEventListener('DOMContentLoaded', () => {
  // Color configuration dictionary
  const COLOR_DATA = {
    red: { name: 'Rojo', hex: '#ff3b30', class: 'c-red', dotColor: '#ffffff' },
    blue: { name: 'Azul', hex: '#0011ffff', class: 'c-blue', dotColor: '#ffffff' },
    green: { name: 'Verde', hex: '#34c759', class: 'c-green', dotColor: '#ffffff' },
    purple: { name: 'Morado', hex: '#af52de', class: 'c-purple', dotColor: '#ffffff' },
    yellow: { name: 'Amarillo', hex: '#ffee00ff', class: 'c-yellow', dotColor: '#ffffff' },
    black: { name: 'Negro', hex: '#000000ff', class: 'c-black', dotColor: '#ffffff' },
    white: { name: 'Blanco', hex: '#ffffff', class: 'c-white', dotColor: '#1e293b' }
  };

  // --- NAGI AVATAR IMAGE ROTATOR ---
  const nagiAvatarImg = document.querySelector('.nagi-avatar-img');
  const nagiImages = [
    'assets/nagi_pensando.png',
    'assets/nagi_feliz.png',
    'assets/nagi_sorprendido.png',
    'assets/nagi_enojado.png',
    'assets/nagi_triste.png',
    'assets/nagi_curioso.png',
    'assets/nagi_aburrido.png',
    'assets/nagi_durmiendo.png',
  ];
  let nagiImgIndex = 0;
  let nagiRotatorPaused = false;

  function setAvatarSrc(src) {
    if (!nagiAvatarImg) return;
    nagiAvatarImg.style.transition = 'opacity 0.4s ease';
    nagiAvatarImg.style.opacity = '0';
    setTimeout(() => {
      nagiAvatarImg.src = src;
      nagiAvatarImg.style.opacity = '1';
    }, 400);
  }

  function rotateNagiAvatar() {
    if (nagiRotatorPaused) return;
    nagiImgIndex = (nagiImgIndex + 1) % nagiImages.length;
    setAvatarSrc(nagiImages[nagiImgIndex]);
  }

  setInterval(rotateNagiAvatar, 3000);

  // State
  let soundEnabled = true;
  let isRolling = false;
  let rollHistory = JSON.parse(localStorage.getItem('nagi_dice_history') || '[]');

  // DOM Elements
  const colorsSidebar = document.getElementById('colorsSidebar');
  const rightSidebar = document.getElementById('rightSidebar');
  const closeColorsBtn = document.getElementById('closeColorsBtn');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const paletteToggleBtn = document.getElementById('paletteToggleBtn');
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');

  const colorBtns = document.querySelectorAll('.color-btn');
  const checkboxes = document.querySelectorAll('.chunky-checkbox input[type="checkbox"]');
  const possibleColorsText = document.getElementById('possibleColorsText');

  // --- COLOR COLUMN (PALETTE DRAWER) LOGIC ---
  // "Los colores posibles son:" depends on this column
  let columnColors = new Set(['red', 'blue', 'green', 'purple', 'yellow', 'black', 'white']);

  function toggleColumnColor(colorKey) {
    if (columnColors.has(colorKey)) {
      if (columnColors.size <= 1) {
        if (colorsSidebar) shakeElement(colorsSidebar);
        return;
      }
      columnColors.delete(colorKey);
    } else {
      columnColors.add(colorKey);
    }
    updateColumnColorsUI();
    playClickSound();
  }

  function updateColumnColorsUI() {
    colorBtns.forEach(btn => {
      const c = btn.dataset.color;
      if (columnColors.has(c)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    updatePossibleColorsText();
  }

  function updatePossibleColorsText() {
    const activeArr = Array.from(columnColors);
    if (activeArr.length === 0) {
      possibleColorsText.innerHTML = '';
      return;
    }

    const formattedList = activeArr.map((cKey) => {
      const cObj = COLOR_DATA[cKey];
      return `<span class="${cObj.class}">${cObj.name}</span>`;
    });

    if (formattedList.length === 1) {
      possibleColorsText.innerHTML = `El único color posible es: ${formattedList[0]}.`;
    } else if (formattedList.length === 2) {
      possibleColorsText.innerHTML = `Los colores posibles son: ${formattedList[0]} y ${formattedList[1]}.`;
    } else {
      const last = formattedList.pop();
      possibleColorsText.innerHTML = `Los colores posibles son: ${formattedList.join(', ')} y ${last}.`;
    }
  }

  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.color;
      toggleColumnColor(color);
    });
  });

  // Initial sync of column colors
  updateColumnColorsUI();

  // --- CHECKBOXES (DICE PROBABILITY POOL) LOGIC ---
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      playClickSound();
    });
  });

  function getCheckedColors() {
    return Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.dataset.color);
  }

  const diceStage = document.getElementById('diceStage');
  const rollBtn = document.getElementById('rollBtn');
  const diceCountSelect = document.getElementById('diceCountSelect');
  const historyList = document.getElementById('historyList');
  const historyEmpty = document.getElementById('historyEmpty');
  const undoBtn = document.getElementById('undoBtn');
  const clearBtn = document.getElementById('clearBtn');
  const soundToggle = document.getElementById('soundToggle');
  const soundIcon = document.getElementById('soundIcon');
  const nagiAvatar = document.querySelector('.nagi-avatar-img');

  // Mascot image paths
  const NAGI_PENSANDO = 'assets/nagi_pensando.png';
  const NAGI_SORPRENDIDO = 'assets/nagi_sorprendido.png';
  const NAGI_TRISTE = 'assets/nagi_triste.png';

  function setNagiState(state) {
    if (state === 'sorprendido') setAvatarSrc(NAGI_SORPRENDIDO);
    else if (state === 'triste') setAvatarSrc(NAGI_TRISTE);
    else setAvatarSrc(NAGI_PENSANDO);
  }



  // Web Audio Context initialization for sound effects
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Sound generator functions
  function playClickSound() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  function playDiceRollSound() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      // Clatter sound bursts
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(150 + Math.random() * 300, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.06);

          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.06);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start();
          osc.stop(audioCtx.currentTime + 0.06);
        }, i * 90);
      }
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Sound SVGs
  const SOUND_ON_SVG = `<svg viewBox="0 0 24 24" fill="none" class="sound-svg" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="white"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`;
  const SOUND_OFF_SVG = `<svg viewBox="0 0 24 24" fill="none" class="sound-svg" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="white"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;

  // Sound Toggle Handler
  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.innerHTML = soundEnabled ? SOUND_ON_SVG : SOUND_OFF_SVG;
    if (soundEnabled) {
      playClickSound();
    }
  });

  // --- DICE RENDERING ENGINE ---
  // Returns HTML for pips matching number 1-6
  function getPipsHTML(val) {
    const map = {
      1: [3],
      2: [2, 4],
      3: [2, 3, 4],
      4: [1, 2, 4, 5],
      5: [1, 2, 3, 4, 5],
      6: [1, 2, 4, 5, 6, 7]
    };

    const activePips = map[val] || [3];
    let pipsHTML = '';
    activePips.forEach(pos => {
      pipsHTML += `<div class="pip pos-${pos}"></div>`;
    });
    return pipsHTML;
  }

  function renderDice(diceList, isRollingState = false) {
    diceStage.innerHTML = '';
    const count = diceList.length;

    diceList.forEach(item => {
      const diceEl = document.createElement('div');
      diceEl.className = `dice ${count > 2 ? 'small' : ''} ${isRollingState ? 'rolling' : ''}`;

      const cConfig = COLOR_DATA[item.color] || COLOR_DATA.red;
      diceEl.style.backgroundColor = cConfig.hex;
      // White die needs a visible border
      if (item.color === 'white') diceEl.style.border = '5px solid #cbd5e1';
      diceEl.innerHTML = getPipsHTML(1);
      const pips = diceEl.querySelectorAll('.pip');
      pips.forEach(p => p.style.backgroundColor = cConfig.dotColor || '#ffffff');

      diceStage.appendChild(diceEl);
    });
  }

  function getRandomActiveColor() {
    const pool = getCheckedColors();
    if (pool.length === 0) {
      const allColors = Object.keys(COLOR_DATA);
      return allColors[Math.floor(Math.random() * allColors.length)];
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function generateDiceRollData() {
    const count = parseInt(diceCountSelect.value, 10);
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push({ color: getRandomActiveColor() });
    }
    return result;
  }

  // Initial dice render on stage
  let currentDiceData = generateDiceRollData();
  renderDice(currentDiceData);

  // --- CUSTOM SELECT CONTROLLER ---
  const customSelectWrapper = document.getElementById('customDiceSelectWrapper');
  const diceSelectTrigger = document.getElementById('diceSelectTrigger');
  const diceSelectLabel = document.getElementById('diceSelectLabel');
  const diceSelectOptions = document.querySelectorAll('.custom-select-option');

  if (diceSelectTrigger && customSelectWrapper) {
    diceSelectTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = customSelectWrapper.classList.toggle('open');
      diceSelectTrigger.setAttribute('aria-expanded', isOpen);
      playClickSound();
    });

    diceSelectOptions.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = opt.dataset.value;
        diceCountSelect.value = val;
        diceSelectLabel.textContent = opt.textContent;
        diceSelectOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        customSelectWrapper.classList.remove('open');
        diceSelectTrigger.setAttribute('aria-expanded', 'false');

        // Trigger change event to update stage
        diceCountSelect.dispatchEvent(new Event('change'));
      });
    });

    document.addEventListener('click', () => {
      customSelectWrapper.classList.remove('open');
      diceSelectTrigger.setAttribute('aria-expanded', 'false');
    });
  }

  // Re-render when count changes
  diceCountSelect.addEventListener('change', () => {
    playClickSound();
    currentDiceData = generateDiceRollData();
    renderDice(currentDiceData);
  });

  // --- ROLL ACTION ENGINE ---
  rollBtn.addEventListener('click', () => {
    if (isRolling) return;

    isRolling = true;

    playDiceRollSound();

    // 1. Trigger rolling animation on stage
    const initialFrame = generateDiceRollData();
    renderDice(initialFrame, true);

    // Rapid visual changes during roll
    const rollInterval = setInterval(() => {
      const frameData = generateDiceRollData();
      renderDice(frameData, true);
    }, 90);

    // 2. Finalize result after 600ms
    setTimeout(() => {
      clearInterval(rollInterval);
      const finalResult = generateDiceRollData();
      renderDice(finalResult, false);

      // Save to history
      addHistoryEntry(finalResult);
      isRolling = false;
    }, 600);
  });

  // --- ROLL HISTORY MANAGEMENT ---
  function addHistoryEntry(diceResult) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = {
      id: Date.now(),
      time: timeStr,
      items: diceResult
    };

    rollHistory.unshift(entry); // Add to top
    if (rollHistory.length > 50) rollHistory.pop(); // Cap history
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    if (rollHistory.length === 0) {
      historyEmpty.style.display = 'block';
      historyList.innerHTML = '';
      return;
    }

    historyEmpty.style.display = 'none';
    historyList.innerHTML = '';

    rollHistory.forEach(entry => {
      const itemEl = document.createElement('div');
      itemEl.className = 'history-item';

      const badgeGroup = document.createElement('div');
      badgeGroup.className = 'history-item-badge';

      entry.items.forEach(d => {
        const dot = document.createElement('span');
        dot.className = 'history-dice-dot';
        const cConfig = COLOR_DATA[d.color];
        dot.style.backgroundColor = cConfig.hex;
        dot.style.border = d.color === 'white' ? '2px solid #cbd5e1' : '2px solid white';
        badgeGroup.appendChild(dot);
      });

      itemEl.appendChild(badgeGroup);

      historyList.appendChild(itemEl);
    });
  }

  function saveHistory() {
    localStorage.setItem('nagi_dice_history', JSON.stringify(rollHistory));
  }

  undoBtn.addEventListener('click', () => {
    if (rollHistory.length > 0) {
      playClickSound();
      rollHistory.shift();
      saveHistory();
      renderHistory();
    }
  });

  clearBtn.addEventListener('click', () => {
    if (rollHistory.length > 0) {
      playClickSound();
      rollHistory = [];
      saveHistory();
      renderHistory();
    }
  });

  // Initial History Render
  renderHistory();

  // --- MODAL DRAWERS ---
  function openDrawer(sidebarEl) {
    closeAllDrawers();
    if (sidebarEl) {
      sidebarEl.classList.add('drawer-open');
    }
    if (sidebarBackdrop) {
      sidebarBackdrop.classList.add('active');
    }
    playClickSound();
  }

  function closeAllDrawers() {
    if (colorsSidebar) colorsSidebar.classList.remove('drawer-open');
    if (rightSidebar) rightSidebar.classList.remove('drawer-open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
  }

  if (paletteToggleBtn) {
    paletteToggleBtn.addEventListener('click', () => openDrawer(colorsSidebar));
  }
  if (historyToggleBtn) {
    historyToggleBtn.addEventListener('click', () => openDrawer(rightSidebar));
  }
  if (closeColorsBtn) {
    closeColorsBtn.addEventListener('click', () => {
      closeAllDrawers();
      playClickSound();
    });
  }
  if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener('click', () => {
      closeAllDrawers();
      playClickSound();
    });
  }
  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeAllDrawers);
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDrawers();
    }
  });
});
