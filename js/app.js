/**
 * แบบบันทึก ชั่วโมง นศท. จิตอาสา - โรงเรียนพานทองสภาชนูปถัมภ์ 2569
 * Main Interactive Application Logic
 */

// Application State
var state = {
  currentSectionId: 0,
  history: [0], // Section navigation stack
  formData: {}, // User input keyed by item ID & entry ID
  uploadedFiles: {}, // Base64 data URLs for file uploads
  submissions: [], // Saved records
  studentTimes: {}, // Arrival times per student: { [name]: '06:30' }
  sheetYearFilter: 'all', // 'all', 1, 2, 3
  activeTab: 'form'
};

// Section Definitions mapped from FORM_DATA
const SECTIONS_MAP = {};
let SECTIONS_LIST = [];

/**
 * Initialize Application
 */
document.addEventListener('DOMContentLoaded', () => {
  initSections();
  loadSubmissions();
  renderCurrentSection();
  updateStats();
  renderSheetTable();
});

/**
 * Convert ISO YYYY-MM-DD to Thai Buddhist date format: DD/MM/YYYY
 */
function toThaiDateStr(isoDate) {
  if (!isoDate) return '';
  if (isoDate.includes('/')) return isoDate;
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const bYear = parseInt(parts[0], 10) + 543;
    return `${parts[2]}/${parts[1]}/${bYear}`;
  }
  return isoDate;
}

/**
 * Parse FORM_DATA into structured sections
 */
function initSections() {
  let currentSec = {
    id: 0,
    title: FORM_DATA.title || 'แบบบันทึก ชั่วโมง นศท. จิตอาสา',
    desc: FORM_DATA.description || '',
    items: []
  };
  SECTIONS_LIST = [currentSec];
  SECTIONS_MAP[0] = currentSec;

  FORM_DATA.items.forEach(item => {
    if (item.type === 8) { // PageBreak section delimiter
      currentSec = {
        id: item.id,
        title: item.title,
        desc: item.desc || '',
        items: []
      };
      SECTIONS_LIST.push(currentSec);
      SECTIONS_MAP[item.id] = currentSec;
    } else {
      currentSec.items.push(item);
    }
  });
}

/**
 * Determine the expected path length for dynamic progress bar
 */
function getProgressInfo() {
  const rootType = state.formData[1099954104] || state.formData[542090476];
  let totalSteps = 3;
  let currentStep = 1;

  if (rootType === 'บันทึกเวรจราจร') {
    totalSteps = 4;
    if (state.currentSectionId === 0) currentStep = 1;
    else if (state.currentSectionId === 177281254) currentStep = 2;
    else if ([652199777, 1133090821, 1852025788, 831262077, 940610485].includes(state.currentSectionId)) currentStep = 3;
    else if (state.currentSectionId === 1524199313) currentStep = 4;
  } else if (rootType === 'ส่วนตัว') {
    totalSteps = 3;
    if (state.currentSectionId === 0) currentStep = 1;
    else if (state.currentSectionId === 709900502) currentStep = 2;
    else if (state.currentSectionId === 1400834594) currentStep = 3;
  } else {
    currentStep = 1;
    totalSteps = 3;
  }

  const percent = Math.min(100, Math.round((currentStep / totalSteps) * 100));
  return { currentStep, totalSteps, percent };
}

/**
 * Check if current section is the final step
 */
function isFinalSection(sectionId) {
  return sectionId === 1524199313 || sectionId === 1400834594;
}

/**
 * Render Current Section Questions and Content
 */
function renderCurrentSection() {
  const section = SECTIONS_MAP[state.currentSectionId];
  if (!section) return;

  const headerTitleEl = document.getElementById('formHeaderTitle');
  const headerDescEl = document.getElementById('formHeaderDesc');

  if (state.currentSectionId === 0) {
    headerTitleEl.textContent = 'แบบบันทึก ชั่วโมง นศท. จิตอาสา';
    headerDescEl.textContent = 'ใช้สำหรับบบันทึกชั่วโมงจิตอาสา นักศึกษาวิชาทหาร โรงเรียนพานทองสภาชนูปถัมภ์ 2569';
  } else {
    headerTitleEl.textContent = section.title;
    headerDescEl.textContent = section.desc || 'กรอกข้อมูลตามหัวข้อด้านล่างให้ครบถ้วน';
  }

  const progress = getProgressInfo();
  document.getElementById('progressText').textContent = `หน้า ${progress.currentStep} จาก ${progress.totalSteps}`;
  document.getElementById('progressBarFill').style.width = `${progress.percent}%`;

  const btnBack = document.getElementById('btnBack');
  const btnNext = document.getElementById('btnNext');
  const btnSubmit = document.getElementById('btnSubmit');

  btnBack.style.display = state.history.length > 1 ? 'inline-flex' : 'none';

  if (isFinalSection(state.currentSectionId)) {
    btnNext.style.display = 'none';
    btnSubmit.style.display = 'inline-flex';
  } else {
    btnNext.style.display = 'inline-flex';
    btnSubmit.style.display = 'none';
  }

  const container = document.getElementById('sectionContent');
  container.innerHTML = '';

  section.items.forEach(item => {
    const cardEl = renderItemCard(item);
    if (cardEl) {
      container.appendChild(cardEl);
    }
  });

  window.scrollTo({ top: 120, behavior: 'smooth' });
}

/**
 * Render a single Form Item Card
 */
function renderItemCard(item) {
  if (item.type === 6) {
    const infoCard = document.createElement('div');
    const isDuty = item.title.includes('วิชญะ') || item.title.includes('เลิศสุกฤษฎิ์');
    infoCard.className = `info-note-card ${isDuty ? 'duty-info' : ''}`;
    infoCard.innerHTML = `
      <div class="info-note-title">
        <span>${isDuty ? 'ℹ️' : '📌'}</span>
        <span>${escapeHtml(item.title)}</span>
      </div>
      ${item.desc ? `<div class="info-note-desc">${escapeHtml(item.desc)}</div>` : ''}
    `;
    return infoCard;
  }

  const card = document.createElement('div');
  card.className = 'question-card';
  card.id = `item-card-${item.id}`;

  const header = document.createElement('div');
  header.className = 'question-header';
  header.innerHTML = `
    <div class="question-title">
      <span>${escapeHtml(item.title)}</span>
      ${item.required ? '<span class="required-star">*</span>' : ''}
    </div>
    ${item.desc ? `<div class="question-desc">${escapeHtml(item.desc)}</div>` : ''}
  `;
  card.appendChild(header);

  const inputContainer = document.createElement('div');
  inputContainer.className = 'question-input-wrapper';

  switch (item.type) {
    case 0:
      inputContainer.appendChild(renderShortTextInput(item));
      break;
    case 1:
      inputContainer.appendChild(renderLongTextInput(item));
      break;
    case 2:
      inputContainer.appendChild(renderRadioOptions(item));
      break;
    case 4:
      inputContainer.appendChild(renderCheckboxGrid(item));
      break;
    case 9:
      inputContainer.appendChild(renderDateInput(item));
      break;
    case 10:
      inputContainer.appendChild(renderTimeInput(item));
      break;
    case 13:
      inputContainer.appendChild(renderFileUploadInput(item));
      break;
    default:
      inputContainer.appendChild(renderShortTextInput(item));
      break;
  }

  const errorEl = document.createElement('div');
  errorEl.className = 'error-message';
  errorEl.id = `error-msg-${item.id}`;
  errorEl.style.display = 'none';
  errorEl.innerHTML = '<span>⚠️</span><span>จำเป็นต้องตอบคำถามนี้</span>';
  card.appendChild(inputContainer);
  card.appendChild(errorEl);

  return card;
}

/**
 * Short Text Input (Type 0)
 */
function renderShortTextInput(item) {
  const input = document.createElement('input');
  input.type = item.title.includes('ชั่วโมง') ? 'number' : 'text';
  if (item.title.includes('ชั่วโมง')) {
    input.step = '0.5';
    input.min = '0.1';
    input.max = '24';
  }
  input.className = 'text-input';
  input.placeholder = item.title.includes('ชั่วโมง') ? 'เช่น 0.5 หรือ 3' : 'คำตอบของคุณ';
  const val = state.formData[item.id] !== undefined ? state.formData[item.id] : (item.entryId && state.formData[item.entryId] !== undefined ? state.formData[item.entryId] : '');
  input.value = val;

  input.addEventListener('input', (e) => {
    const v = e.target.value.trim();
    state.formData[item.id] = v;
    if (item.entryId) state.formData[item.entryId] = v;
    clearItemError(item.id);
  });

  return input;
}

/**
 * Long Text Input (Type 1)
 */
function renderLongTextInput(item) {
  const textarea = document.createElement('textarea');
  textarea.className = 'textarea-input';
  textarea.placeholder = 'คำตอบของคุณ (ถ้ามี)';
  const val = state.formData[item.id] !== undefined ? state.formData[item.id] : (item.entryId && state.formData[item.entryId] !== undefined ? state.formData[item.entryId] : '');
  textarea.value = val;

  textarea.addEventListener('input', (e) => {
    const v = e.target.value.trim();
    state.formData[item.id] = v;
    if (item.entryId) state.formData[item.entryId] = v;
  });

  return textarea;
}

/**
 * Radio Options (Type 2)
 */
function renderRadioOptions(item) {
  const list = document.createElement('div');
  list.className = 'radio-options-list';

  const currentValue = state.formData[item.id] || (item.entryId ? state.formData[item.entryId] : '') || '';

  item.options.forEach((opt) => {
    const itemRow = document.createElement('div');
    const isOther = opt.isOther;
    const isSelected = isOther 
      ? currentValue && !item.options.some(o => !o.isOther && o.label === currentValue)
      : currentValue === opt.label;

    itemRow.className = `radio-option-item ${isSelected ? 'selected' : ''}`;

    if (!isOther) {
      itemRow.innerHTML = `
        <span class="custom-radio"></span>
        <span class="radio-label">${escapeHtml(opt.label)}</span>
      `;
      itemRow.addEventListener('click', () => {
        state.formData[item.id] = opt.label;
        if (item.entryId) state.formData[item.entryId] = opt.label;
        list.querySelectorAll('.radio-option-item').forEach(el => el.classList.remove('selected'));
        itemRow.classList.add('selected');
        clearItemError(item.id);
      });
    } else {
      itemRow.innerHTML = `
        <span class="custom-radio"></span>
        <div class="other-input-wrapper">
          <span class="radio-label" style="flex: none;">อื่นๆ:</span>
          <input type="text" class="other-text-input" placeholder="โปรดระบุ" value="${isSelected ? escapeHtml(currentValue) : ''}">
        </div>
      `;
      const otherInput = itemRow.querySelector('.other-text-input');

      itemRow.addEventListener('click', () => {
        list.querySelectorAll('.radio-option-item').forEach(el => el.classList.remove('selected'));
        itemRow.classList.add('selected');
        const v = otherInput.value.trim();
        state.formData[item.id] = v;
        if (item.entryId) state.formData[item.entryId] = v;
        otherInput.focus();
        if (v) clearItemError(item.id);
      });

      otherInput.addEventListener('input', (e) => {
        list.querySelectorAll('.radio-option-item').forEach(el => el.classList.remove('selected'));
        itemRow.classList.add('selected');
        const v = e.target.value.trim();
        state.formData[item.id] = v;
        if (item.entryId) state.formData[item.entryId] = v;
        if (v) clearItemError(item.id);
      });
    }

    list.appendChild(itemRow);
  });

  return list;
}

/**
 * Checkbox Grid (Type 4: Students Attendance Check)
 */
function renderCheckboxGrid(item) {
  const wrapper = document.createElement('div');
  wrapper.className = 'checkbox-grid-container';

  if (!Array.isArray(state.formData[item.id])) {
    state.formData[item.id] = (item.entryId && Array.isArray(state.formData[item.entryId])) ? state.formData[item.entryId] : [];
  }
  const currentSelection = state.formData[item.id];

  const toolbar = document.createElement('div');
  toolbar.className = 'student-section-toolbar';
  toolbar.innerHTML = `
    <div class="student-search-box">
      <span class="search-icon">🔍</span>
      <input type="text" class="student-search-input" placeholder="ค้นหาชื่อ..." data-target-grid="grid-${item.id}">
    </div>
    <div class="quick-select-actions">
      <div class="quick-time-setter" title="เวลามาเริ่มต้นสำหรับทุกคน">
        <span class="quick-time-label">⏰ เวลาเริ่มต้น:</span>
        <input type="time" class="quick-time-input" id="batch-time-${item.id}" value="06:30" onchange="updateAllTimesInGrid('${item.id}', this.value)" title="ปรับเวลามาของทุกคนในตารางนี้">
      </div>
      <button type="button" class="btn-quick-select" onclick="selectAllInGrid('${item.id}', true)">เลือกทั้งหมด</button>
      <button type="button" class="btn-quick-select" onclick="selectAllInGrid('${item.id}', false)">ล้าง</button>
    </div>
  `;
  wrapper.appendChild(toolbar);

  const grid = document.createElement('div');
  grid.className = 'students-grid';
  grid.id = `grid-${item.id}`;

  let otherOpt = null;

  item.options.forEach(opt => {
    if (opt.isOther) {
      otherOpt = opt;
      return;
    }

    const isChecked = currentSelection.includes(opt.label);
    const card = document.createElement('div');
    card.className = `student-card-item ${isChecked ? 'checked' : ''}`;
    card.dataset.studentName = opt.label;

    if (isChecked && !state.studentTimes[opt.label]) {
      state.studentTimes[opt.label] = '06:30';
    }
    const currentTime = state.studentTimes[opt.label] || '06:30';

    let yearBadgeHtml = '';
    if (opt.label.includes('ปี 1') || opt.label.includes('ปี1') || item.title.includes('ปี1') || item.title.includes('ปี 1')) {
      yearBadgeHtml = '<span class="student-year-badge badge-year-1">ปี 1</span>';
    } else if (opt.label.includes('ปี 2') || opt.label.includes('ปี2') || item.title.includes('ปี2') || item.title.includes('ปี 2')) {
      yearBadgeHtml = '<span class="student-year-badge badge-year-2">ปี 2</span>';
    } else if (opt.label.includes('ปี 3') || opt.label.includes('ปี3') || item.title.includes('ปี3') || item.title.includes('ปี 3')) {
      yearBadgeHtml = '<span class="student-year-badge badge-year-3">ปี 3</span>';
    }

    let photoHtml = '';
    if (opt.imagePath) {
      photoHtml = `
        <div class="student-photo-wrapper">
          <img src="${opt.imagePath}" alt="${escapeHtml(opt.label)}" loading="lazy">
          <button type="button" class="photo-zoom-btn" onclick="openImageModal('${opt.imagePath}', '${escapeHtml(opt.label)}'); event.stopPropagation();" title="ดูรูปขนาดใหญ่">🔍</button>
        </div>
      `;
    } else {
      photoHtml = `
        <div class="student-photo-wrapper">
          <div class="student-photo-fallback">👤</div>
        </div>
      `;
    }

    card.innerHTML = `
      ${photoHtml}
      <div class="student-name-label">${escapeHtml(opt.label)}</div>
      ${yearBadgeHtml}
      <div class="checkbox-indicator">
        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
      </div>
      <div class="student-time-container" onclick="event.stopPropagation()">
        <span class="student-time-label">⏰ มาเวลา:</span>
        <input type="time" class="student-time-input" value="${currentTime}" title="เลือกเวลาที่ นศท. มาปฏิบัติหน้าที่">
      </div>
    `;

    const timeInput = card.querySelector('.student-time-input');
    if (timeInput) {
      timeInput.addEventListener('click', (e) => e.stopPropagation());
      timeInput.addEventListener('mousedown', (e) => e.stopPropagation());
      timeInput.addEventListener('input', (e) => {
        e.stopPropagation();
        state.studentTimes[opt.label] = e.target.value;
      });
      timeInput.addEventListener('change', (e) => {
        e.stopPropagation();
        state.studentTimes[opt.label] = e.target.value;
      });
    }

    card.addEventListener('click', () => {
      toggleStudentCheckbox(item.id, opt.label, card);
    });

    grid.appendChild(card);
  });

  wrapper.appendChild(grid);

  const searchInput = toolbar.querySelector('.student-search-input');
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.trim().toLowerCase();
    grid.querySelectorAll('.student-card-item').forEach(c => {
      const name = c.dataset.studentName.toLowerCase();
      c.style.display = name.includes(term) ? 'flex' : 'none';
    });
  });

  if (otherOpt) {
    const otherEntryCard = document.createElement('div');
    otherEntryCard.className = 'other-student-card';
    const otherVal = state.formData[`${item.id}_other`] || (item.entryId ? state.formData[`${item.entryId}_other`] : '') || '';
    const hasOther = !!otherVal;
    const otherTime = state.studentTimes[`${item.id}_other`] || '06:30';

    otherEntryCard.innerHTML = `
      <input type="checkbox" id="chk-other-${item.id}" class="other-student-checkbox" ${hasOther ? 'checked' : ''}>
      <div class="other-input-wrapper">
        <label for="chk-other-${item.id}" class="radio-label" style="cursor: pointer; flex: none;">อื่นๆ:</label>
        <input type="text" class="other-text-input" placeholder="ใส่ชื่อ-สกุล สำหรับคนที่ยังไม่มีชื่อในระบบ" value="${escapeHtml(otherVal)}">
        <div class="other-time-wrapper" id="other-time-box-${item.id}" style="${hasOther ? 'display: inline-flex;' : 'display: none;'}">
          <span class="student-time-label">⏰ เวลามา:</span>
          <input type="time" class="student-time-input other-time-input" value="${otherTime}">
        </div>
      </div>
    `;

    const chk = otherEntryCard.querySelector('.other-student-checkbox');
    const txt = otherEntryCard.querySelector('.other-text-input');
    const timeBox = otherEntryCard.querySelector(`#other-time-box-${item.id}`);
    const timeIn = otherEntryCard.querySelector('.other-time-input');

    if (timeIn) {
      timeIn.addEventListener('input', (e) => {
        state.studentTimes[`${item.id}_other`] = e.target.value;
      });
      timeIn.addEventListener('change', (e) => {
        state.studentTimes[`${item.id}_other`] = e.target.value;
      });
    }

    chk.addEventListener('change', () => {
      if (chk.checked) {
        txt.focus();
        if (timeBox) timeBox.style.display = 'inline-flex';
        state.formData[`${item.id}_other`] = txt.value.trim();
        if (item.entryId) state.formData[`${item.entryId}_other`] = txt.value.trim();
        state.studentTimes[`${item.id}_other`] = (timeIn && timeIn.value) ? timeIn.value : '06:30';
      } else {
        txt.value = '';
        if (timeBox) timeBox.style.display = 'none';
        state.formData[`${item.id}_other`] = '';
        if (item.entryId) state.formData[`${item.entryId}_other`] = '';
        delete state.studentTimes[`${item.id}_other`];
      }
      clearItemError(item.id);
    });

    txt.addEventListener('input', () => {
      const v = txt.value.trim();
      if (v) {
        chk.checked = true;
        if (timeBox) timeBox.style.display = 'inline-flex';
        state.formData[`${item.id}_other`] = v;
        if (item.entryId) state.formData[`${item.entryId}_other`] = v;
        if (!state.studentTimes[`${item.id}_other`]) {
          state.studentTimes[`${item.id}_other`] = (timeIn && timeIn.value) ? timeIn.value : '06:30';
        }
        clearItemError(item.id);
      } else {
        chk.checked = false;
        if (timeBox) timeBox.style.display = 'none';
        state.formData[`${item.id}_other`] = '';
        if (item.entryId) state.formData[`${item.entryId}_other`] = '';
      }
    });

    wrapper.appendChild(otherEntryCard);
  }

  return wrapper;
}

/**
 * Toggle student attendance checkbox
 */
function toggleStudentCheckbox(itemId, studentName, cardEl) {
  if (!Array.isArray(state.formData[itemId])) {
    state.formData[itemId] = [];
  }
  const arr = state.formData[itemId];
  const idx = arr.indexOf(studentName);

  if (idx === -1) {
    arr.push(studentName);
    cardEl.classList.add('checked');

    // Default time is automatically 06:30 (or toolbar batch time if user changed it)
    const batchTimeEl = document.getElementById(`batch-time-${itemId}`);
    const defaultTime = (batchTimeEl && batchTimeEl.value) ? batchTimeEl.value : '06:30';
    if (!state.studentTimes[studentName]) {
      state.studentTimes[studentName] = defaultTime;
    }
    const timeInput = cardEl.querySelector('.student-time-input');
    if (timeInput) {
      timeInput.value = state.studentTimes[studentName];
    }
  } else {
    arr.splice(idx, 1);
    cardEl.classList.remove('checked');
  }

  const it = FORM_DATA.items.find(i => i.id == itemId);
  if (it && it.entryId) {
    state.formData[it.entryId] = [...arr];
  }

  clearItemError(itemId);
  clearDaySectionErrors();
}

/**
 * Select All or Clear Students in a grid
 */
function selectAllInGrid(itemId, selectAll) {
  const grid = document.getElementById(`grid-${itemId}`);
  if (!grid) return;

  if (!Array.isArray(state.formData[itemId])) {
    state.formData[itemId] = [];
  }

  const batchTimeEl = document.getElementById(`batch-time-${itemId}`);
  const defaultTime = (batchTimeEl && batchTimeEl.value) ? batchTimeEl.value : '06:30';

  const cards = grid.querySelectorAll('.student-card-item');
  cards.forEach(card => {
    if (card.style.display !== 'none') {
      const name = card.dataset.studentName;
      const idx = state.formData[itemId].indexOf(name);
      if (selectAll) {
        if (idx === -1) state.formData[itemId].push(name);
        card.classList.add('checked');
        if (!state.studentTimes[name]) {
          state.studentTimes[name] = defaultTime;
        }
        const timeInput = card.querySelector('.student-time-input');
        if (timeInput) {
          timeInput.value = state.studentTimes[name];
        }
      } else {
        if (idx !== -1) state.formData[itemId].splice(idx, 1);
        card.classList.remove('checked');
      }
    }
  });

  const it = FORM_DATA.items.find(i => i.id == itemId);
  if (it && it.entryId) {
    state.formData[it.entryId] = [...state.formData[itemId]];
  }

  clearItemError(itemId);
  clearDaySectionErrors();
}

/**
 * Update arrival time for all checked students in a grid
 */
function updateAllTimesInGrid(itemId, newTime) {
  if (!newTime) newTime = '06:30';
  const grid = document.getElementById(`grid-${itemId}`);
  if (!grid) return;

  const cards = grid.querySelectorAll('.student-card-item.checked');
  cards.forEach(card => {
    const name = card.dataset.studentName;
    state.studentTimes[name] = newTime;
    const timeInput = card.querySelector('.student-time-input');
    if (timeInput) {
      timeInput.value = newTime;
    }
  });
}

/**
 * Date Input (Type 9)
 */
function renderDateInput(item) {
  const input = document.createElement('input');
  input.type = 'date';
  input.className = 'text-input';

  const todayStr = new Date().toISOString().split('T')[0];
  const currentVal = state.formData[item.id] || (item.entryId ? state.formData[item.entryId] : '') || todayStr;
  input.value = currentVal;
  state.formData[item.id] = currentVal;
  if (item.entryId) state.formData[item.entryId] = currentVal;

  input.addEventListener('change', (e) => {
    state.formData[item.id] = e.target.value;
    if (item.entryId) state.formData[item.entryId] = e.target.value;
    clearItemError(item.id);
  });

  return input;
}

/**
 * Time Input (Type 10)
 */
function renderTimeInput(item) {
  const input = document.createElement('input');
  input.type = 'time';
  input.className = 'text-input';

  let currentVal = state.formData[item.id] || (item.entryId ? state.formData[item.entryId] : '');
  if (!currentVal) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    currentVal = `${hours}:${mins}`;
  }
  input.value = currentVal;
  state.formData[item.id] = currentVal;
  if (item.entryId) state.formData[item.entryId] = currentVal;

  input.addEventListener('change', (e) => {
    state.formData[item.id] = e.target.value;
    if (item.entryId) state.formData[item.entryId] = e.target.value;
    clearItemError(item.id);
  });

  return input;
}

/**
 * File Upload Input (Type 13)
 */
function renderFileUploadInput(item) {
  const wrapper = document.createElement('div');
  wrapper.className = 'file-upload-wrapper';

  const dropZone = document.createElement('div');
  dropZone.className = 'file-upload-box';
  dropZone.innerHTML = `
    <div class="file-upload-icon">📁</div>
    <div class="file-upload-text">คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์รูป/วิดีโอมาวางที่นี่</div>
    <div class="file-upload-hint">รองรับไฟล์รูปภาพ JPG, PNG หรือ คลิปวิดีโอ (ถ่ายจากกล้องมือถือได้)</div>
    <input type="file" id="file-${item.id}" class="hidden-file-input" accept="image/*,video/*">
  `;

  const fileInput = dropZone.querySelector('.hidden-file-input');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('drag-over'); });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(item.id, e.dataTransfer.files[0], wrapper);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(item.id, e.target.files[0], wrapper);
    }
  });

  wrapper.appendChild(dropZone);

  if (state.uploadedFiles[item.id]) {
    wrapper.appendChild(createFilePreview(item.id, state.uploadedFiles[item.id], wrapper));
  }

  return wrapper;
}

/**
 * Process selected file to Base64 preview
 */
function handleFileSelected(itemId, file, wrapperEl) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const fileData = {
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type,
      dataUrl: e.target.result
    };
    state.uploadedFiles[itemId] = fileData;
    state.formData[itemId] = file.name;

    const it = FORM_DATA.items.find(i => i.id == itemId);
    if (it && it.entryId) state.formData[it.entryId] = file.name;

    const oldPrev = wrapperEl.querySelector('.file-preview-card');
    if (oldPrev) oldPrev.remove();

    wrapperEl.appendChild(createFilePreview(itemId, fileData, wrapperEl));
    clearItemError(itemId);
  };
  reader.readAsDataURL(file);
}

/**
 * Create File Preview Card
 */
function createFilePreview(itemId, fileData, wrapperEl) {
  const card = document.createElement('div');
  card.className = 'file-preview-card';

  const isVideo = fileData.type.startsWith('video');
  const mediaHtml = isVideo
    ? `<video src="${fileData.dataUrl}" muted></video>`
    : `<img src="${fileData.dataUrl}" alt="หลักฐาน" onclick="openImageModal('${fileData.dataUrl}', '${escapeHtml(fileData.name)}')">`;

  card.innerHTML = `
    <div class="file-preview-thumb">${mediaHtml}</div>
    <div class="file-preview-info">
      <div class="file-preview-name">${escapeHtml(fileData.name)}</div>
      <div class="file-preview-size">${fileData.size}</div>
    </div>
    <button type="button" class="btn-remove-file" title="ลบไฟล์">&times;</button>
  `;

  card.querySelector('.btn-remove-file').addEventListener('click', () => {
    delete state.uploadedFiles[itemId];
    delete state.formData[itemId];
    const it = FORM_DATA.items.find(i => i.id == itemId);
    if (it && it.entryId) delete state.formData[it.entryId];
    card.remove();
  });

  return card;
}

/**
 * Clear day section error banners
 */
function clearDaySectionErrors() {
  const section = SECTIONS_MAP[state.currentSectionId];
  if (!section) return;
  section.items.forEach(it => {
    if (it.type === 4) {
      clearItemError(it.id);
    }
  });
}

/**
 * Validation Logic
 */
function validateCurrentSection() {
  const section = SECTIONS_MAP[state.currentSectionId];
  if (!section) return true;

  const isDayAttendanceSection = [652199777, 1133090821, 1852025788, 831262077, 940610485].includes(state.currentSectionId);

  if (isDayAttendanceSection) {
    let totalCheckedInDay = 0;
    section.items.forEach(item => {
      if (item.type === 4) {
        const arr = state.formData[item.id] || (item.entryId ? state.formData[item.entryId] : []) || [];
        totalCheckedInDay += arr.length;
        const otherVal = state.formData[`${item.id}_other`] || (item.entryId ? state.formData[`${item.entryId}_other`] : '') || '';
        if (otherVal.trim().length > 0) totalCheckedInDay += 1;
      }
    });

    if (totalCheckedInDay === 0) {
      const firstItem = section.items.find(it => it.type === 4);
      if (firstItem) {
        const cardEl = document.getElementById(`item-card-${firstItem.id}`);
        const errorEl = document.getElementById(`error-msg-${firstItem.id}`);
        if (cardEl) cardEl.classList.add('has-error');
        if (errorEl) {
          errorEl.innerHTML = '<span>⚠️</span><span>กรุณาเช็คยอดนักเรียนอย่างน้อย 1 นาย (หรือระบุในช่องอื่นๆ)</span>';
          errorEl.style.display = 'flex';
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return false;
    } else {
      clearDaySectionErrors();
      return true;
    }
  }

  let isValid = true;
  let firstInvalidEl = null;

  section.items.forEach(item => {
    if (item.type === 6) return;

    const cardEl = document.getElementById(`item-card-${item.id}`);
    const errorEl = document.getElementById(`error-msg-${item.id}`);

    if (item.required) {
      let isAnswered = false;

      if (item.type === 4) {
        const arr = state.formData[item.id] || (item.entryId ? state.formData[item.entryId] : []) || [];
        const otherVal = state.formData[`${item.id}_other`] || (item.entryId ? state.formData[`${item.entryId}_other`] : '') || '';
        if (arr.length > 0 || otherVal.trim().length > 0) isAnswered = true;
      } else if (item.type === 13) {
        if (state.uploadedFiles[item.id]) isAnswered = true;
      } else {
        const val = state.formData[item.id] !== undefined ? state.formData[item.id] : (item.entryId ? state.formData[item.entryId] : undefined);
        if (val !== undefined && val !== null && String(val).trim().length > 0) isAnswered = true;
      }

      if (!isAnswered) {
        isValid = false;
        if (cardEl) cardEl.classList.add('has-error');
        if (errorEl) {
          errorEl.innerHTML = '<span>⚠️</span><span>จำเป็นต้องตอบคำถามนี้</span>';
          errorEl.style.display = 'flex';
        }
        if (!firstInvalidEl && cardEl) firstInvalidEl = cardEl;
      } else {
        if (cardEl) cardEl.classList.remove('has-error');
        if (errorEl) errorEl.style.display = 'none';
      }
    }
  });

  if (!isValid && firstInvalidEl) {
    firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return isValid;
}

function clearItemError(itemId) {
  const cardEl = document.getElementById(`item-card-${itemId}`);
  const errorEl = document.getElementById(`error-msg-${itemId}`);
  if (cardEl) cardEl.classList.remove('has-error');
  if (errorEl) errorEl.style.display = 'none';
}

/**
 * Determine Next Section ID
 */
function getNextSectionId() {
  const curId = state.currentSectionId;

  if (curId === 0) {
    const val = state.formData[1099954104] || state.formData[542090476];
    if (val === 'ส่วนตัว') return 709900502;
    if (val === 'บันทึกเวรจราจร') return 177281254;
    return 177281254;
  }

  if (curId === 177281254) {
    const day = state.formData[1086910467] || state.formData[1480586712];
    switch (day) {
      case 'จันทร์': return 940610485;
      case 'อังคาร': return 831262077;
      case 'พุธ': return 1852025788;
      case 'พฤหัสบดี': return 1133090821;
      case 'ศุกร์': return 652199777;
      default: return 652199777;
    }
  }

  if ([652199777, 1133090821, 1852025788, 831262077, 940610485].includes(curId)) {
    return 1524199313;
  }

  if (curId === 709900502) {
    return 1400834594;
  }

  return null;
}

/**
 * Navigation
 */
function navigateNextStep() {
  if (!validateCurrentSection()) return;

  const nextId = getNextSectionId();
  if (nextId) {
    state.history.push(nextId);
    state.currentSectionId = nextId;
    renderCurrentSection();
  }
}

function navigatePreviousStep() {
  if (state.history.length > 1) {
    state.history.pop();
    state.currentSectionId = state.history[state.history.length - 1];
    renderCurrentSection();
  }
}

/**
 * Handle Form Submission
 */
function handleFormSubmit(e) {
  e.preventDefault();
  if (!validateCurrentSection()) return;

  const rootType = state.formData[1099954104] || state.formData[542090476];
  const submissionId = 'SUB-' + Date.now();
  const timestamp = new Date().toLocaleString('th-TH');

  let record = {
    id: submissionId,
    timestamp: timestamp,
    type: rootType
  };

  if (rootType === 'บันทึกเวรจราจร') {
    const day = state.formData[1086910467] || state.formData[1480586712] || '';
    // Look up by Item ID 613759637 or Entry ID 443391774
    const rawDate = state.formData[613759637] || state.formData[443391774] || new Date().toISOString().split('T')[0];
    const thaiDate = toThaiDateStr(rawDate);
    const period = state.formData[841301894] || state.formData[1662358854] || 'เช้า';

    record.day = day;
    record.location = 'จุดจราจรโรงเรียนพานทองสภาชนูปถัมภ์';
    record.date = rawDate;
    record.thaiDate = thaiDate;
    record.dutyPeriod = period;
    
    // Calculation: morning = 0.5, afternoon = 0.5, both = 1.0
    if (period === 'ทั้งเช้าและบ่าย') {
      record.hours = 1.0;
    } else {
      record.hours = 0.5;
    }

    record.remarks = state.formData[1102195174] || state.formData[1009813930] || '';
    record.evidence = state.uploadedFiles[1608139282] || null;

    // Collect checked students across all year levels in this day
    const students = [];
    const studentTimes = {};
    const section = SECTIONS_MAP[state.history[2]];
    if (section) {
      section.items.forEach(it => {
        if (it.type === 4) {
          const arr = state.formData[it.id] || (it.entryId ? state.formData[it.entryId] : []) || [];
          const yearMatch = it.title.match(/ปี\s*[1-3]/);
          const yearTag = yearMatch ? yearMatch[0].replace(/\s+/g, '') : '';

          arr.forEach(name => {
            let fullName = name;
            if (yearTag && !name.includes('ปี')) {
              fullName = `${name} (${yearTag})`;
            }
            students.push(fullName);

            const t = state.studentTimes[name] || state.studentTimes[fullName] || '06:30';
            studentTimes[name] = t;
            studentTimes[fullName] = t;
          });

          const other = state.formData[`${it.id}_other`] || (it.entryId ? state.formData[`${it.entryId}_other`] : '');
          if (other) {
            const otherFullName = `(อื่นๆ) ${other}${yearTag ? ` (${yearTag})` : ''}`;
            students.push(otherFullName);
            const otherTime = state.studentTimes[`${it.id}_other`] || state.studentTimes[other] || '06:30';
            studentTimes[other] = otherTime;
            studentTimes[otherFullName] = otherTime;
          }
        }
      });
    }
    record.students = students;
    record.studentTimes = studentTimes;
    record.studentCount = students.length;
  } else {
    // Individual Personal Volunteer
    record.year = state.formData[2063459380] || state.formData[1313992104] || '';
    record.title = state.formData[1015676808] || state.formData[311943921] || '';
    record.name = state.formData[1890253995] || state.formData[1841605987] || '';
    record.location = state.formData[2105482791] || state.formData[294114977] || '';
    record.date = state.formData[617508250] || state.formData[1146088584] || new Date().toISOString().split('T')[0];
    record.thaiDate = toThaiDateStr(record.date);
    record.startTime = state.formData[326708749] || state.formData[528671485] || '';
    record.hours = parseFloat(state.formData[1406466955] || state.formData[248615752]) || 0.5;
    record.evidence = state.uploadedFiles[1773690123] || null;
    record.remarks = state.formData[175403568] || state.formData[2035729294] || '';
    record.students = [`${record.title} ${record.name} (${record.year})`];
  }

  saveSubmission(record);
  showSuccessReceipt(record);
}

/**
 * Save Submission to LocalStorage and server
 */
function saveSubmission(record) {
  state.submissions.unshift(record);
  saveSubmissionsToStorage();

  fetch('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  }).catch(() => {});

  updateStats();
  renderSheetTable();
  renderRecordsTable();
}

function saveSubmissionsToStorage() {
  try {
    localStorage.setItem('nst_volunteer_records_v1', JSON.stringify(state.submissions));
    localStorage.setItem('nst_initialized', 'true');
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
}

/**
 * Seed initial Monday duty records from user's sheets on first visit
 */
function seedInitialTrafficData() {
  const initialMondayStudents = [
    'ก้องเกียรติ', 'จิรพัฒน์', 'จิระวัฒน์', 'ธนวรรธน์', 'ธนายุ', 'ธวัชชัย สุจริยะ',
    'พงศธร', 'รุ่งโรจน์', 'อธิปัต กงยัง', 'กานต์จณากร', 'ถิรวิทย์', 'พงศ์พิสุทธิ์',
    'เลิศสุกฤษฎิ์', 'สิริณัฏฐ์', 'กนกวรรณ'
  ];

  const studentTimes = {};
  initialMondayStudents.forEach(st => {
    studentTimes[st] = '06:30';
  });

  return {
    id: 'SUB-INIT-261069',
    timestamp: '26/10/2569, 07:30:00',
    type: 'บันทึกเวรจราจร',
    day: 'จันทร์',
    location: 'จุดจราจรโรงเรียนพานทองสภาชนูปถัมภ์',
    date: '2026-10-26',
    thaiDate: '26/10/2569',
    dutyPeriod: 'เช้า',
    hours: 0.5,
    remarks: 'บันทึกเวรจราจรประจำวันจันทร์ (ข้อมูลเริ่มต้นจากชีต)',
    students: initialMondayStudents,
    studentTimes: studentTimes,
    studentCount: initialMondayStudents.length
  };
}

/**
 * Load Submissions
 */
function loadSubmissions() {
  try {
    const raw = localStorage.getItem('nst_volunteer_records_v1');
    const isInit = localStorage.getItem('nst_initialized');
    if (raw) {
      state.submissions = JSON.parse(raw);
    } else if (!isInit) {
      state.submissions = [seedInitialTrafficData()];
      saveSubmissionsToStorage();
    } else {
      state.submissions = [];
    }
  } catch (e) {
    state.submissions = [];
  }

  fetch('/api/submissions')
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        state.submissions = data;
        saveSubmissionsToStorage();
        updateStats();
        renderSheetTable();
        renderRecordsTable();
      }
    })
    .catch(() => {});
}

/**
 * Render Receipt Summary on Success Screen
 */
function showSuccessReceipt(record) {
  document.getElementById('formView').style.display = 'none';
  document.getElementById('successView').style.display = 'block';
  document.getElementById('sheetView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'none';

  const container = document.getElementById('receiptSummaryContent');
  let html = `
    <div class="receipt-row">
      <span class="receipt-label">รหัสอ้างอิง:</span>
      <span class="receipt-val">${record.id}</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">เวลาที่ส่ง:</span>
      <span class="receipt-val">${record.timestamp}</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">ประเภท:</span>
      <span class="receipt-val">${record.type}</span>
    </div>
  `;

  if (record.type === 'บันทึกเวรจราจร') {
    html += `
      <div class="receipt-row">
        <span class="receipt-label">กลุ่มวัน / ช่วงเวลา:</span>
        <span class="receipt-val">วัน${record.day} (${record.dutyPeriod})</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">วันที่ปฏิบัติหน้าที่:</span>
        <span class="receipt-val">${record.thaiDate || record.date}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">จำนวน นศท. ที่เช็คชื่อ:</span>
        <span class="receipt-val">${record.students.length} นาย (คนละ ${record.hours} ชม.)</span>
      </div>
      <div class="receipt-row" style="flex-direction: column; gap: 0.35rem; align-items: flex-start;">
        <span class="receipt-label">รายชื่อผู้ปฏิบัติหน้าที่:</span>
        <div style="font-size: 0.82rem; color: var(--primary); display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
          ${record.students.map(s => {
            const t = (record.studentTimes && record.studentTimes[s]) || '06:30';
            return `<span class="table-student-tag">${escapeHtml(s)} <span class="student-tag-time">⏰ ${t} น.</span></span>`;
          }).join('')}
        </div>
      </div>
    `;
  } else {
    html += `
      <div class="receipt-row">
        <span class="receipt-label">ผู้ทำจิตอาสา:</span>
        <span class="receipt-val">${record.title} ${record.name} (${record.year})</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">สถานที่:</span>
        <span class="receipt-val">${record.location}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">วันที่ / เวลา:</span>
        <span class="receipt-val">${record.thaiDate || record.date} (เริ่ม ${record.startTime} น.)</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">จำนวนชั่วโมง:</span>
        <span class="receipt-val">${record.hours} ชั่วโมง</span>
      </div>
    `;
  }

  container.innerHTML = html;
}

/**
 * Start a New Submission
 */
function startNewSubmission() {
  state.currentSectionId = 0;
  state.history = [0];
  state.formData = {};
  state.uploadedFiles = {};
  state.studentTimes = {};

  document.getElementById('formView').style.display = 'block';
  document.getElementById('successView').style.display = 'none';
  document.getElementById('sheetView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'none';

  renderCurrentSection();
}

/**
 * Confirm and Reset Form
 */
function confirmResetForm() {
  if (confirm('ต้องการล้างคำตอบทั้งหมดในแบบฟอร์มใช่หรือไม่?')) {
    startNewSubmission();
  }
}

/**
 * Switch Navigation Tab
 */
function switchTab(tab) {
  state.activeTab = tab;
  const formTabBtn = document.getElementById('tabBtnForm');
  const sheetTabBtn = document.getElementById('tabBtnSheet');
  const dashTabBtn = document.getElementById('tabBtnDashboard');

  const formView = document.getElementById('formView');
  const successView = document.getElementById('successView');
  const sheetView = document.getElementById('sheetView');
  const dashView = document.getElementById('dashboardView');

  [formTabBtn, sheetTabBtn, dashTabBtn].forEach(b => b.classList.remove('active'));
  [formView, successView, sheetView, dashView].forEach(v => v.style.display = 'none');

  if (tab === 'sheet') {
    sheetTabBtn.classList.add('active');
    sheetView.style.display = 'block';
    renderSheetTable();
  } else if (tab === 'dashboard') {
    dashTabBtn.classList.add('active');
    dashView.style.display = 'block';
    renderRecordsTable();
  } else {
    formTabBtn.classList.add('active');
    formView.style.display = 'block';
  }
}

/**
 * =========================================================================
 * GOOGLE SHEETS VIEW & MATRIX CALCULATION
 * =========================================================================
 */

/**
 * Calculate Traffic Duty Hours Matrix per student and per date
 * DYNAMICALLY extracted from state.submissions (no hardcoded dates).
 * Rule:
 * - เช้า = 0.5
 * - บ่าย = 0.5
 * - ลงทั้งเช้าและบ่าย (ในวันเดียวกัน) = 0.5 + 0.5 = 1.0 (1 ชม.)
 */
function computeTrafficMatrix() {
  const dateSet = new Set();
  const trafficSubs = state.submissions.filter(r => r.type === 'บันทึกเวรจราจร');

  // ONLY extract dates from active submissions!
  trafficSubs.forEach(r => {
    const dStr = r.thaiDate || toThaiDateStr(r.date);
    if (dStr && dStr.trim().length > 0) {
      dateSet.add(dStr.trim());
    }
  });

  // Sort dates chronologically: DD/MM/YYYY
  const datesList = Array.from(dateSet).sort((a, b) => {
    const parse = (s) => {
      const p = s.split('/');
      return p.length === 3 ? `${p[2]}${p[1]}${p[0]}` : s;
    };
    return parse(a).localeCompare(parse(b));
  });

  // Matrix: studentHoursMap[studentId]
  const matrix = {};

  STUDENT_ROSTER.forEach(s => {
    matrix[s.id] = {
      student: s,
      dates: {},
      totalHours: 0
    };
    datesList.forEach(d => {
      matrix[s.id].dates[d] = { morning: false, afternoon: false, hours: 0 };
    });
  });

  // Populate hours from submissions
  trafficSubs.forEach(sub => {
    const dStr = sub.thaiDate || toThaiDateStr(sub.date);
    if (!dStr || !dateSet.has(dStr)) return;

    const period = sub.dutyPeriod || 'เช้า';
    const isMorning = period === 'เช้า' || period === 'ทั้งเช้าและบ่าย';
    const isAfternoon = period === 'บ่าย' || period === 'ทั้งเช้าและบ่าย';

    (sub.students || []).forEach(stName => {
      const cleanName = stName.replace(/\s*\(.*?\)/g, '').trim();
      const matched = STUDENT_ROSTER.find(s => 
        cleanName === s.shortName || cleanName === s.name || cleanName === `${s.prefix} ${s.name}` || s.name.includes(cleanName) || cleanName.includes(s.shortName)
      );

      if (matched && matrix[matched.id]) {
        const cell = matrix[matched.id].dates[dStr];
        if (cell) {
          const sTime = (sub.studentTimes && (sub.studentTimes[stName] || sub.studentTimes[cleanName])) || '06:30';
          if (isMorning) {
            cell.morning = true;
            cell.morningTime = sTime;
          }
          if (isAfternoon) {
            cell.afternoon = true;
            cell.afternoonTime = sTime;
          }

          // Rule: morning + afternoon = 1, otherwise 0.5
          if (cell.morning && cell.afternoon) {
            cell.hours = 1.0;
          } else if (cell.morning || cell.afternoon) {
            cell.hours = 0.5;
          }
        }
      }
    });
  });

  // Calculate total accumulated hours
  Object.values(matrix).forEach(row => {
    let sum = 0;
    Object.values(row.dates).forEach(d => {
      sum += (d.hours || 0);
    });
    row.totalHours = sum;
  });

  return { datesList, matrix };
}

/**
 * Delete all traffic duty records for a specific date column
 */
function deleteTrafficDate(dateStr) {
  if (confirm(`คุณต้องการลบข้อมูลการบันทึกเวรจราจรทั้งหมดของวันที่ ${dateStr} ใช่หรือไม่?`)) {
    state.submissions = state.submissions.filter(r => {
      const dStr = r.thaiDate || toThaiDateStr(r.date);
      return !(r.type === 'บันทึกเวรจราจร' && dStr === dateStr);
    });
    saveSubmissionsToStorage();
    renderSheetTable();
    renderRecordsTable();
    updateStats();
  }
}

/**
 * Filter by Year in Sheets View
 */
function setSheetYearFilter(year, btn) {
  state.sheetYearFilter = year;
  const pills = btn.parentElement.querySelectorAll('.sheet-tab-pill');
  pills.forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderSheetTable();
}

/**
 * Render the Google Sheets-style Traffic Duty Matrix
 */
function renderSheetTable() {
  const container = document.getElementById('sheetTableContainer');
  if (!container) return;

  const { datesList, matrix } = computeTrafficMatrix();
  const dayFilter = document.getElementById('sheetDaySelect') ? document.getElementById('sheetDaySelect').value : 'all';
  const searchTerm = (document.getElementById('sheetSearchInput') ? document.getElementById('sheetSearchInput').value : '').trim().toLowerCase();

  // Update Stats for Sheets View
  let activeStudentsCount = 0;
  let totalDutyHoursSum = 0;
  Object.values(matrix).forEach(m => {
    if (m.totalHours > 0) activeStudentsCount++;
    totalDutyHoursSum += m.totalHours;
  });

  const stTotalEl = document.getElementById('sheetTotalStudents');
  const stActiveEl = document.getElementById('sheetActiveStudents');
  const stDaysEl = document.getElementById('sheetTotalDutyDays');
  const stHoursEl = document.getElementById('sheetTotalDutyHours');

  if (stTotalEl) stTotalEl.textContent = STUDENT_ROSTER.length;
  if (stActiveEl) stActiveEl.textContent = activeStudentsCount;
  if (stDaysEl) stDaysEl.textContent = datesList.length;
  if (stHoursEl) stHoursEl.textContent = totalDutyHoursSum.toFixed(1);

  // Define groups
  const groups = [
    { title: 'นศท. ชาย ชั้นปีที่ 1', year: 1, gender: 'ชาย' },
    { title: 'นศท. หญิง ชั้นปีที่ 1', year: 1, gender: 'หญิง' },
    { title: 'นศท. ชาย ชั้นปีที่ 2', year: 2, gender: 'ชาย' },
    { title: 'นศท. หญิง ชั้นปีที่ 2', year: 2, gender: 'หญิง' },
    { title: 'นศท. ชั้นปีที่ 3', year: 3, gender: null }
  ];

  // Build Table HTML
  let html = `
    <table class="waffle-sheet-table">
      <thead>
        <tr>
          <th class="sheet-header-cell sticky-col-1" style="width: 50px;">ลำดับ</th>
          <th class="sheet-header-cell sticky-col-2" style="width: 85px;">เวร</th>
          <th class="sheet-header-cell sticky-col-3" style="width: 190px;">ชื่อ - สกุล</th>
          <th class="sheet-header-cell sticky-col-4" style="width: 90px; text-align: center;">รวม ชม.</th>
          ${datesList.map(d => `
            <th class="sheet-header-cell" style="min-width: 105px; text-align: center;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                <span>${d}</span>
                <button type="button" class="btn-del-date" onclick="deleteTrafficDate('${d}')" title="ลบข้อมูลของวันที่ ${d}">&times;</button>
              </div>
            </th>
          `).join('')}
        </tr>
      </thead>
      <tbody>
  `;

  let renderedRowCount = 0;

  groups.forEach(group => {
    if (state.sheetYearFilter !== 'all' && state.sheetYearFilter !== group.year) {
      return;
    }

    const studentsInGroup = STUDENT_ROSTER.filter(s => {
      if (s.year !== group.year) return false;
      if (group.gender && s.gender !== group.gender) return false;
      if (dayFilter !== 'all' && s.day !== dayFilter) return false;
      if (searchTerm) {
        const full = `${s.prefix} ${s.name} ${s.shortName}`.toLowerCase();
        if (!full.includes(searchTerm)) return false;
      }
      return true;
    });

    if (studentsInGroup.length === 0) return;

    // Group Header Separator Row
    const totalCols = 4 + datesList.length;
    html += `
      <tr class="sheet-group-separator">
        <td colspan="${totalCols}">🎖️ ${group.title} (${studentsInGroup.length} นาย)</td>
      </tr>
    `;

    // Render Student Rows
    studentsInGroup.forEach((student, sIdx) => {
      renderedRowCount++;
      const rowData = matrix[student.id];
      const totalHours = rowData ? rowData.totalHours : 0;

      let badgeClass = 'day-badge-mon';
      if (student.day === 'อังคาร') badgeClass = 'day-badge-tue';
      else if (student.day === 'พุธ') badgeClass = 'day-badge-wed';
      else if (student.day === 'พฤหัสบดี') badgeClass = 'day-badge-thu';
      else if (student.day === 'ศุกร์') badgeClass = 'day-badge-fri';

      let sumClass = 'hours-zero';
      if (totalHours > 0) sumClass = 'hours-sum-active';

      html += `
        <tr>
          <td class="sheet-cell sticky-col-1">${sIdx + 1}</td>
          <td class="sheet-cell sticky-col-2">
            <span class="day-tag-badge ${badgeClass}">${student.day}</span>
          </td>
          <td class="sheet-cell sticky-col-3">${student.prefix} ${student.name}</td>
          <td class="sheet-cell sticky-col-4 ${sumClass}">${totalHours > 0 ? totalHours : 0}</td>
          ${datesList.map(d => {
            const cell = rowData && rowData.dates[d];
            const h = cell ? cell.hours : 0;
            if (h === 1.0) {
              const timeDesc = `เช้า (มา ${cell.morningTime || '06:30'} น.) + บ่าย (มา ${cell.afternoonTime || '15:30'} น.)`;
              return `<td class="sheet-cell hours-full" title="${timeDesc} = รวม 1 ชม.">1</td>`;
            } else if (h === 0.5) {
              const timeDesc = cell.morning 
                ? `เวรเช้า (มา ${cell.morningTime || '06:30'} น.)` 
                : `เวรบ่าย (มา ${cell.afternoonTime || '15:30'} น.)`;
              return `<td class="sheet-cell hours-half" title="${timeDesc} = 0.5 ชม.">0.5</td>`;
            } else {
              return `<td class="sheet-cell" style="text-align: center; color: #b7b7b7;"></td>`;
            }
          }).join('')}
        </tr>
      `;
    });
  });

  if (renderedRowCount === 0) {
    html += `
      <tr>
        <td colspan="${4 + datesList.length}" style="text-align: center; padding: 2.5rem; color: var(--text-secondary);">
          ไม่พบข้อมูลนักเรียนตามเงื่อนไขที่เลือก
        </td>
      </tr>
    `;
  }

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

/**
 * Export Google Sheets Matrix directly to Excel / CSV with Thai UTF-8 BOM
 */
function exportSheetToCSV() {
  const { datesList, matrix } = computeTrafficMatrix();

  const headers = ['ลำดับ', 'ชั้นปี', 'เพศ', 'เวร', 'ชื่อ - สกุล', 'รวม ชม.', ...datesList];

  const rows = [];
  let counter = 1;

  STUDENT_ROSTER.forEach(s => {
    const rowData = matrix[s.id];
    const total = rowData ? rowData.totalHours : 0;
    const dateVals = datesList.map(d => {
      const h = rowData && rowData.dates[d] ? rowData.dates[d].hours : 0;
      return h > 0 ? h : '';
    });

    rows.push([
      counter++,
      `"ปี ${s.year}"`,
      `"${s.gender}"`,
      `"${s.day}"`,
      `"${s.prefix} ${s.name}"`,
      total,
      ...dateVals
    ].join(','));
  });

  const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ตารางชั่วโมงเวรจราจร_นศท_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * =========================================================================
 * GENERAL DASHBOARD & LOGS
 * =========================================================================
 */

function updateStats() {
  const total = state.submissions.length;
  let traffic = 0;
  let personal = 0;
  let hours = 0;

  state.submissions.forEach(r => {
    if (r.type === 'บันทึกเวรจราจร') {
      traffic++;
      hours += (parseFloat(r.hours) || 0.5) * (r.studentCount || 1);
    } else {
      personal++;
      hours += parseFloat(r.hours) || 0;
    }
  });

  const elTotal = document.getElementById('statTotalSubmissions');
  const elTraffic = document.getElementById('statTrafficCount');
  const elPersonal = document.getElementById('statPersonalCount');
  const elHours = document.getElementById('statTotalHours');
  const elBadge = document.getElementById('badgeSubmissionsCount');

  if (elTotal) elTotal.textContent = total;
  if (elTraffic) elTraffic.textContent = traffic;
  if (elPersonal) elPersonal.textContent = personal;
  if (elHours) elHours.textContent = hours.toFixed(1);
  if (elBadge) elBadge.textContent = total;
}

function renderRecordsTable() {
  const tbody = document.getElementById('recordsTableBody');
  if (!tbody) return;

  const searchVal = (document.getElementById('filterSearchInput') ? document.getElementById('filterSearchInput').value : '').trim().toLowerCase();
  const typeFilter = document.getElementById('filterTypeSelect') ? document.getElementById('filterTypeSelect').value : 'all';
  const dayFilter = document.getElementById('filterDaySelect') ? document.getElementById('filterDaySelect').value : 'all';

  const filtered = state.submissions.filter(r => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    if (dayFilter !== 'all' && r.day !== dayFilter) return false;
    if (searchVal) {
      const matchName = (r.students || []).some(s => s.toLowerCase().includes(searchVal));
      const matchDate = (r.date || '').toLowerCase().includes(searchVal);
      const matchRem = (r.remarks || '').toLowerCase().includes(searchVal);
      if (!matchName && !matchDate && !matchRem) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>ยังไม่มีรายการบันทึกข้อมูลตามเงื่อนไขที่เลือก</p>
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  filtered.forEach((r, idx) => {
    const isTraffic = r.type === 'บันทึกเวรจราจร';
    const studentsHtml = (r.students || []).map(s => {
      const t = (r.studentTimes && r.studentTimes[s]) || (isTraffic ? '06:30' : '');
      return `<span class="table-student-tag">${escapeHtml(s)}${t ? ` <span class="student-tag-time">⏰ ${t}</span>` : ''}</span>`;
    }).join('');

    let evidenceHtml = '-';
    if (r.evidence && r.evidence.dataUrl) {
      evidenceHtml = `<img src="${r.evidence.dataUrl}" class="table-thumb" alt="หลักฐาน" onclick="openImageModal('${r.evidence.dataUrl}', 'หลักฐาน: ${escapeHtml(r.id)}')">`;
    }

    html += `
      <tr>
        <td><strong>#${filtered.length - idx}</strong></td>
        <td>
          <div style="font-weight: 600;">${r.thaiDate || r.date || '-'}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">${r.timestamp}</div>
        </td>
        <td>
          <span style="font-weight: 600; color: ${isTraffic ? '#1976d2' : '#f57c00'};">
            ${isTraffic ? '🚦 ' : '👤 '}${r.type}
          </span>
        </td>
        <td>
          <div>${isTraffic ? 'วัน' + (r.day || '-') + ' (' + (r.dutyPeriod || '-') + ')' : (r.location || '-')}</div>
        </td>
        <td style="max-width: 250px;">${studentsHtml}</td>
        <td>
          <strong style="color: var(--primary);">${r.hours || 0.5} ชม.</strong>
        </td>
        <td>${evidenceHtml}</td>
        <td style="max-width: 150px; font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(r.remarks || '-')}</td>
        <td>
          <button type="button" class="btn btn-clear" style="color: var(--error); padding: 0.2rem 0.5rem;" onclick="deleteSubmission('${r.id}')" title="ลบรายการ">🗑️</button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function applyFilters() {
  renderRecordsTable();
}

function deleteSubmission(id) {
  if (confirm('ยืนยันที่จะลบรายการบันทึกนี้ใช่หรือไม่?')) {
    state.submissions = state.submissions.filter(r => r.id !== id);
    saveSubmissionsToStorage();
    fetch(`/api/submissions/${id}`, { method: 'DELETE' }).catch(() => {});
    updateStats();
    renderSheetTable();
    renderRecordsTable();
  }
}

function confirmClearAllData() {
  if (confirm('คำเตือน: คุณต้องการล้างประวัติการบันทึกทั้งหมดใช่หรือไม่? (การกระทำนี้ไม่สามารถย้อนกลับได้)')) {
    state.submissions = [];
    saveSubmissionsToStorage();
    fetch('/api/submissions/all', { method: 'DELETE' }).catch(() => {});
    updateStats();
    renderSheetTable();
    renderRecordsTable();
  }
}

function exportToCSV() {
  if (state.submissions.length === 0) {
    alert('ไม่มีข้อมูลให้ส่งออก');
    return;
  }

  const headers = [
    'รหัสบันทึก',
    'วันเวลาที่ส่ง',
    'ประเภทจิตอาสา',
    'วันที่ทำจิตอาสา',
    'กลุ่มวัน / ช่วงเวลา',
    'สถานที่',
    'รายชื่อผู้ทำจิตอาสา',
    'จำนวนชั่วโมง',
    'หมายเหตุ'
  ];

  const rows = state.submissions.map(r => {
    return [
      `"${r.id}"`,
      `"${r.timestamp}"`,
      `"${r.type}"`,
      `"${r.thaiDate || r.date || ''}"`,
      `"${r.day ? 'วัน' + r.day + ' (' + (r.dutyPeriod || '') + ')' : ''}"`,
      `"${r.location || ''}"`,
      `"${(r.students || []).map(s => {
        const t = r.studentTimes && r.studentTimes[s];
        return t ? `${s} (มา ${t} น.)` : s;
      }).join(', ')}"`,
      `"${r.hours || 0.5}"`,
      `"${(r.remarks || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `แบบบันทึก_ชั่วโมง_นศท_จิตอาสา_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function openImageModal(imgSrc, caption) {
  const modal = document.getElementById('imageModal');
  const target = document.getElementById('modalImageTarget');
  const cap = document.getElementById('modalImageCaption');

  target.src = imgSrc;
  cap.textContent = caption || 'รูปภาพ';
  modal.classList.add('active');
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  modal.classList.remove('active');
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
