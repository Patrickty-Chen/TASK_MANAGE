// ============================================
// Main Application
// ============================================

const App = {
  tasks: [],
  isImportant: true,
  editingTaskId: null,
  firestoreUnsubscribe: null,
  modalSubtasks: [],
  editingSubtaskId: null,

  init() {
    Auth.init();
    this.bindEvents();
    this.setDefaultDueDate();
    // Refresh countdowns every minute
    setInterval(() => this.renderTasks(), 60000);
  },

  // --- Event Binding ---

  bindEvents() {
    document.getElementById('addTaskBtn').addEventListener('click', () => this.showAddModal());
    document.getElementById('taskForm').addEventListener('submit', (e) => this.handleSubmit(e));
    document.getElementById('cancelTaskBtn').addEventListener('click', () => this.hideModal());
    document.getElementById('taskModal').addEventListener('click', (e) => {
      if (e.target.id === 'taskModal') this.hideModal();
    });

    document.getElementById('importantBtn').addEventListener('click', () => this.setImportance(true));
    document.getElementById('notImportantBtn').addEventListener('click', () => this.setImportance(false));

    // Handle adding subtask in modal
    document.getElementById('addSubtaskBtn').addEventListener('click', () => this.addModalSubtask());

    // Keyboard shortcut: Escape to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hideModal();
    });
  },

  setImportance(important) {
    this.isImportant = important;
    const impBtn = document.getElementById('importantBtn');
    const notImpBtn = document.getElementById('notImportantBtn');
    impBtn.classList.toggle('active', important);
    notImpBtn.classList.toggle('active', !important);
  },

  setDefaultDueDate() {
    const input = document.getElementById('taskDueDate');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    input.value = tomorrow.toISOString().slice(0, 10);
  },

  // --- Modal ---

  showAddModal() {
    this.editingTaskId = null;
    document.getElementById('taskEditId').value = '';
    document.getElementById('modalTitle').textContent = '✏️ 新增任務';
    document.getElementById('submitBtn').textContent = '新增任務';
    document.getElementById('logSection').classList.add('hidden');
    document.getElementById('taskForm').reset();
    
    this.modalSubtasks = [];
    this.editingSubtaskId = null;
    document.getElementById('taskNotes').value = '';
    document.getElementById('subtaskTitleInput').value = '';
    document.getElementById('modalSubtasksList').innerHTML = '';
    document.getElementById('addSubtaskBtn').textContent = '+';
    this.setDefaultSubtaskDueDate();

    this.setImportance(true);
    this.setDefaultDueDate();
    document.getElementById('taskModal').classList.remove('hidden');
    document.getElementById('taskTitle').focus();
  },

  showEditModal(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    this.editingTaskId = taskId;
    document.getElementById('taskEditId').value = taskId;
    document.getElementById('modalTitle').textContent = '📝 編輯任務';
    document.getElementById('submitBtn').textContent = '儲存變更';

    // Pre-fill form
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDueDate').value = task.dueDate;
    document.getElementById('taskNotes').value = task.notes || '';
    this.setImportance(task.important);

    // Load subtasks
    this.modalSubtasks = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
    this.editingSubtaskId = null;
    document.getElementById('addSubtaskBtn').textContent = '+';
    this.renderModalSubtasks();
    document.getElementById('subtaskTitleInput').value = '';
    this.setDefaultSubtaskDueDate();

    // Render log
    this.renderLog(task);

    document.getElementById('taskModal').classList.remove('hidden');
    document.getElementById('taskTitle').focus();
  },

  hideModal() {
    document.getElementById('taskModal').classList.add('hidden');
    this.editingTaskId = null;
    document.getElementById('taskEditId').value = '';
    document.getElementById('taskForm').reset();
    
    this.modalSubtasks = [];
    this.editingSubtaskId = null;
    document.getElementById('taskNotes').value = '';
    document.getElementById('modalSubtasksList').innerHTML = '';
    document.getElementById('addSubtaskBtn').textContent = '+';

    this.setImportance(true);
    this.setDefaultDueDate();
    document.getElementById('logSection').classList.add('hidden');
  },

  setDefaultSubtaskDueDate() {
    const input = document.getElementById('subtaskDateInput');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    input.value = tomorrow.toISOString().slice(0, 10);
  },

  addModalSubtask() {
    const titleEl = document.getElementById('subtaskTitleInput');
    const dateEl = document.getElementById('subtaskDateInput');
    const title = titleEl.value.trim();
    const dueDate = dateEl.value;

    if (!title || !dueDate) {
      this.showToast('⚠️ 請填寫處理事項名稱與截止日');
      return;
    }

    if (this.editingSubtaskId) {
      // Update existing subtask
      const subtask = this.modalSubtasks.find(st => st.id === this.editingSubtaskId);
      if (subtask) {
        subtask.title = title;
        subtask.dueDate = dueDate;
      }
      this.editingSubtaskId = null;
      document.getElementById('addSubtaskBtn').textContent = '+';
    } else {
      // Add new subtask
      this.modalSubtasks.push({
        id: Date.now().toString(),
        title,
        dueDate,
        completed: false
      });
    }

    titleEl.value = '';
    this.setDefaultSubtaskDueDate();
    this.renderModalSubtasks();
  },

  editModalSubtask(subtaskId) {
    const subtask = this.modalSubtasks.find(st => st.id === subtaskId);
    if (!subtask) return;

    this.editingSubtaskId = subtaskId;
    document.getElementById('subtaskTitleInput').value = subtask.title;
    document.getElementById('subtaskDateInput').value = subtask.dueDate;
    document.getElementById('addSubtaskBtn').textContent = '✓';
    document.getElementById('subtaskTitleInput').focus();
  },

  removeModalSubtask(subtaskId) {
    this.modalSubtasks = this.modalSubtasks.filter(st => st.id !== subtaskId);
    if (this.editingSubtaskId === subtaskId) {
      this.editingSubtaskId = null;
      document.getElementById('subtaskTitleInput').value = '';
      this.setDefaultSubtaskDueDate();
      document.getElementById('addSubtaskBtn').textContent = '+';
    }
    this.renderModalSubtasks();
  },

  renderModalSubtasks() {
    const list = document.getElementById('modalSubtasksList');
    if (this.modalSubtasks.length === 0) {
      list.innerHTML = `<div class="log-empty">尚無處理事項</div>`;
      return;
    }

    list.innerHTML = this.modalSubtasks.map(st => `
      <div class="modal-subtask-item">
        <div class="modal-subtask-info">
          <span class="modal-subtask-title">${this.escapeHtml(st.title)}</span>
          <span class="modal-subtask-date">📅 ${Matrix.formatDate(st.dueDate)}</span>
        </div>
        <div class="modal-subtask-actions">
          <button type="button" class="btn-edit-subtask" onclick="App.editModalSubtask('${st.id}')" title="編輯子項目">✏️</button>
          <button type="button" class="btn-remove-subtask" onclick="App.removeModalSubtask('${st.id}')" title="刪除子項目">✕</button>
        </div>
      </div>
    `).join('');
  },

  // --- CRUD Operations ---

  async handleSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    const dueDate = document.getElementById('taskDueDate').value;
    const notes = document.getElementById('taskNotes').value.trim();
    const editId = document.getElementById('taskEditId').value;

    if (!title || !dueDate) return;

    if (editId) {
      await this.updateTask(editId, title, dueDate, this.isImportant, notes, this.modalSubtasks);
    } else {
      await this.addTask(title, dueDate, this.isImportant, notes, this.modalSubtasks);
    }

    this.hideModal();
  },

  async addTask(title, dueDate, important, notes = '', subtasks = []) {
    const now = new Date().toISOString();
    const task = {
      id: Date.now().toString(),
      title,
      dueDate,
      notes,
      subtasks,
      important,
      completed: false,
      createdAt: now,
      logs: [
        {
          timestamp: now,
          action: 'created',
          detail: '建立任務'
        }
      ]
    };

    this.tasks.push(task);
    this.saveToLocalStorage();
    this.renderTasks();
    
    if (DriveSync.isAuthenticated) {
      DriveSync.saveTasksToDrive(this.tasks);
    }

    this.showToast('✅ 任務已新增');
  },

  async updateTask(taskId, newTitle, newDueDate, newImportant, newNotes = '', newSubtasks = []) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    const now = new Date().toISOString();
    const changes = [];

    // Detect what changed and generate log entries
    if (task.title !== newTitle) {
      changes.push({
        timestamp: now,
        action: 'updated',
        field: 'title',
        detail: `標題變更`,
        oldValue: task.title,
        newValue: newTitle
      });
      task.title = newTitle;
    }

    if ((task.notes || '') !== newNotes) {
      changes.push({
        timestamp: now,
        action: 'updated',
        field: 'notes',
        detail: `註明變更`,
        oldValue: task.notes || '無',
        newValue: newNotes || '無'
      });
      task.notes = newNotes;
    }

    if (JSON.stringify(task.subtasks || []) !== JSON.stringify(newSubtasks || [])) {
      changes.push({
        timestamp: now,
        action: 'updated',
        field: 'subtasks',
        detail: `處理事項變更`,
        oldValue: `${(task.subtasks || []).length} 個項目`,
        newValue: `${(newSubtasks || []).length} 個項目`
      });
      task.subtasks = newSubtasks;
    }

    if (task.dueDate !== newDueDate) {
      const oldDateStr = Matrix.formatDate(task.dueDate);
      const newDateStr = Matrix.formatDate(newDueDate);
      const oldQuadrant = Matrix.classifyTask(task);

      changes.push({
        timestamp: now,
        action: 'updated',
        field: 'dueDate',
        detail: `截止日期變更`,
        oldValue: oldDateStr,
        newValue: newDateStr
      });
      task.dueDate = newDueDate;

      // Check if quadrant changed
      const newQuadrant = Matrix.classifyTask(task);
      if (oldQuadrant !== newQuadrant) {
        const qNames = {
          q1: '立即執行',
          q2: '計劃安排',
          q3: '委派處理',
          q4: '考慮刪除'
        };
        changes.push({
          timestamp: now,
          action: 'moved',
          detail: `象限移動`,
          oldValue: qNames[oldQuadrant],
          newValue: qNames[newQuadrant]
        });
      }
    }

    if (task.important !== newImportant) {
      const oldQuadrant = Matrix.classifyTask(task);

      changes.push({
        timestamp: now,
        action: 'updated',
        field: 'important',
        detail: `重要性變更`,
        oldValue: task.important ? '重要' : '不重要',
        newValue: newImportant ? '重要' : '不重要'
      });
      task.important = newImportant;

      // Check if quadrant changed
      const newQuadrant = Matrix.classifyTask(task);
      if (oldQuadrant !== newQuadrant) {
        const qNames = {
          q1: '立即執行',
          q2: '計劃安排',
          q3: '委派處理',
          q4: '考慮刪除'
        };
        // Avoid duplicate move log
        const hasMove = changes.find(c => c.action === 'moved');
        if (!hasMove) {
          changes.push({
            timestamp: now,
            action: 'moved',
            detail: `象限移動`,
            oldValue: qNames[oldQuadrant],
            newValue: qNames[newQuadrant]
          });
        }
      }
    }

    if (changes.length === 0) {
      this.showToast('ℹ️ 沒有任何變更');
      return;
    }

    // Append logs
    if (!task.logs) task.logs = [];
    task.logs.push(...changes);

    this.saveToLocalStorage();
    this.renderTasks();

    if (DriveSync.isAuthenticated) {
      DriveSync.saveTasksToDrive(this.tasks);
    }

    this.showToast('✅ 任務已更新');
  },

  async completeTask(taskId) {
    // Animate out
    const cardEl = document.querySelector(`[data-task-id="${taskId}"]`);
    if (cardEl) {
      cardEl.classList.add('completing');
      await new Promise(r => setTimeout(r, 400));
    }

    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.saveToLocalStorage();
    this.renderTasks();

    if (DriveSync.isAuthenticated) {
      DriveSync.saveTasksToDrive(this.tasks);
    }
    this.showToast('🎉 任務已完成！');
  },

  async deleteTask(taskId) {
    const cardEl = document.querySelector(`[data-task-id="${taskId}"]`);
    if (cardEl) {
      cardEl.classList.add('completing');
      await new Promise(r => setTimeout(r, 400));
    }

    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.saveToLocalStorage();
    this.renderTasks();

    if (DriveSync.isAuthenticated) {
      DriveSync.saveTasksToDrive(this.tasks);
    }
    this.showToast('🗑️ 任務已刪除');
  },

  // --- DriveSync & LocalStorage ---

  // --- LocalStorage ---

  saveToLocalStorage() {
    localStorage.setItem('eisenhower_tasks', JSON.stringify(this.tasks));
  },

  loadFromLocalStorage() {
    const data = localStorage.getItem('eisenhower_tasks');
    if (data) {
      try {
        this.tasks = JSON.parse(data);
        // Migrate tasks without logs field
        this.tasks.forEach(t => {
          if (!t.logs) {
            t.logs = [{ timestamp: t.createdAt, action: 'created', detail: '建立任務' }];
          }
        });
      } catch {
        this.tasks = [];
      }
    }
  },

  // --- Load Tasks (entry point) ---

  loadTasks() {
    this.loadFromLocalStorage();
    this.renderTasks();
    // 如果未來登入後，會由 DriveSync 接管並覆蓋此處讀取的本地資料
  },

  // --- Render ---

  renderTasks() {
    const activeTasks = this.tasks.filter(t => !t.completed);

    // Sort by effective due date
    activeTasks.sort((a, b) => new Date(Matrix.getEffectiveDueDate(a)) - new Date(Matrix.getEffectiveDueDate(b)));

    // Classify into quadrants
    const quadrants = { q1: [], q2: [], q3: [], q4: [] };
    activeTasks.forEach(task => {
      const q = Matrix.classifyTask(task);
      quadrants[q].push(task);
    });

    // Render each quadrant
    ['q1', 'q2', 'q3', 'q4'].forEach(qId => {
      const container = document.getElementById(`${qId}-tasks`);
      const countEl = document.getElementById(`${qId}-count`);
      const tasks = quadrants[qId];

      countEl.textContent = tasks.length;

      if (tasks.length === 0) {
        const emptyTexts = {
          q1: '暫無任務 ✨',
          q2: '暫無任務 📅',
          q3: '暫無任務 🤝',
          q4: '暫無任務 🧹'
        };
        container.innerHTML = `<div class="empty-state">${emptyTexts[qId]}</div>`;
        return;
      }

      container.innerHTML = tasks.map(task => this.renderTaskCard(task)).join('');

      // Bind card events — click card body to edit
      container.querySelectorAll('.task-card').forEach(card => {
        card.addEventListener('click', (e) => {
          // Don't trigger edit if clicking action buttons or subtask checkboxes
          if (e.target.closest('.task-action-btn') || e.target.closest('.card-subtask-label')) return;
          this.showEditModal(card.dataset.taskId);
        });
      });

      container.querySelectorAll('.task-action-btn.complete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.completeTask(btn.dataset.id);
        });
      });
      container.querySelectorAll('.task-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteTask(btn.dataset.id);
        });
      });

      // Bind subtask checkboxes change events
      container.querySelectorAll('.card-subtask-label input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('click', (e) => {
          e.stopPropagation();
        });
        checkbox.addEventListener('change', (e) => {
          e.stopPropagation();
          this.toggleSubtaskCompletion(checkbox.dataset.taskId, checkbox.dataset.subtaskId, checkbox.checked);
        });
      });
    });

    // Update stats
    const stats = Matrix.getStats(this.tasks);
    document.getElementById('totalTasks').textContent = stats.total;
    document.getElementById('urgentTasks').textContent = stats.urgent;
    document.getElementById('overdueTasks').textContent = stats.overdue;
    document.getElementById('todayTasks').textContent = stats.today;
  },

  renderTaskCard(task) {
    const effectiveDate = Matrix.getEffectiveDueDate(task);
    const countdown = Matrix.getCountdown(effectiveDate);
    const dateStr = Matrix.formatDate(effectiveDate);
    const logCount = (task.logs || []).length;
    const logBadge = logCount > 1
      ? `<span class="task-log-badge">${logCount - 1} 次變更</span>`
      : '';

    // Render notes if present
    const notesHtml = task.notes
      ? `<div class="task-notes">${this.escapeHtml(task.notes)}</div>`
      : '';

    // Render subtasks if present
    let subtasksHtml = '';
    if (task.subtasks && task.subtasks.length > 0) {
      const itemsHtml = task.subtasks.map(st => `
        <div class="card-subtask-item">
          <label class="card-subtask-label" data-task-id="${task.id}" data-subtask-id="${st.id}">
            <input type="checkbox" data-task-id="${task.id}" data-subtask-id="${st.id}" ${st.completed ? 'checked' : ''}>
            <span class="card-subtask-title ${st.completed ? 'completed' : ''}">${this.escapeHtml(st.title)}</span>
          </label>
          <span class="card-subtask-date">📅 ${Matrix.formatDate(st.dueDate)}</span>
        </div>
      `).join('');

      subtasksHtml = `<div class="task-subtasks-container">${itemsHtml}</div>`;
    }

    return `
      <div class="task-card" data-task-id="${task.id}">
        <div class="task-color-bar"></div>
        <div class="task-content">
          <div class="task-title">${this.escapeHtml(task.title)}</div>
          ${notesHtml}
          <div class="task-meta">
            <span class="task-countdown ${countdown.status}">${countdown.text}</span>
            <span class="task-date">📅 ${dateStr}</span>
            ${logBadge}
          </div>
          ${subtasksHtml}
        </div>
        <div class="task-actions">
          <button class="task-action-btn complete" data-id="${task.id}" title="完成">✓</button>
          <button class="task-action-btn delete" data-id="${task.id}" title="刪除">✕</button>
        </div>
      </div>
    `;
  },

  async toggleSubtaskCompletion(taskId, subtaskId, isCompleted) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return;

    subtask.completed = isCompleted;

    // Log the change
    const now = new Date().toISOString();
    if (!task.logs) task.logs = [];
    task.logs.push({
      timestamp: now,
      action: 'updated',
      field: 'subtasks',
      detail: `處理事項狀態更新`,
      oldValue: `${subtask.title}: ${!isCompleted ? '已完成' : '未完成'}`,
      newValue: `${subtask.title}: ${isCompleted ? '已完成' : '未完成'}`
    });

    this.saveToLocalStorage();
    this.renderTasks();

    if (DriveSync.isAuthenticated) {
      DriveSync.saveTasksToDrive(this.tasks);
    }

    this.showToast(`✨ 處理事項「${subtask.title}」已${isCompleted ? '完成' : '設為未完成'}`);
  },

  // --- Activity Log ---

  renderLog(task) {
    const logSection = document.getElementById('logSection');
    const timeline = document.getElementById('logTimeline');
    const logs = task.logs || [];

    if (logs.length === 0) {
      logSection.classList.add('hidden');
      return;
    }

    logSection.classList.remove('hidden');

    // Render logs in reverse chronological order (newest first)
    const reversedLogs = [...logs].reverse();
    timeline.innerHTML = reversedLogs.map(log => {
      const timeStr = this.formatLogTime(log.timestamp);

      let detailHtml = '';
      if (log.oldValue !== undefined && log.newValue !== undefined) {
        detailHtml = `
          <div class="log-detail">
            ${this.escapeHtml(log.detail)}：
            <span class="log-old">${this.escapeHtml(log.oldValue)}</span>
            <span class="log-arrow">→</span>
            <span class="log-new">${this.escapeHtml(log.newValue)}</span>
          </div>
        `;
      } else {
        detailHtml = `<div class="log-detail">${this.escapeHtml(log.detail)}</div>`;
      }

      return `
        <div class="log-entry log-${log.action}">
          <div class="log-time">${timeStr}</div>
          ${detailHtml}
        </div>
      `;
    }).join('');
  },

  formatLogTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    if (diffHours < 24) return `${diffHours} 小時前`;
    if (diffDays < 7) return `${diffDays} 天前`;

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${mins}`;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // --- Toast Notification ---

  showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2500);
  }
};

// --- Bootstrap ---
document.addEventListener('DOMContentLoaded', () => App.init());
