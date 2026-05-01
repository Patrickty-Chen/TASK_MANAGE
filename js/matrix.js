// ============================================
// Matrix Classification Logic
// ============================================

const Matrix = {
  // 緊急門檻：3 天內算緊急
  URGENT_THRESHOLD_DAYS: 3,

  /**
   * 取得主功能所採用的監控日期（有效截止日）
   */
  getEffectiveDueDate(task) {
    if (task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0) {
      const activeSubtasks = task.subtasks.filter(st => !st.completed);
      const subtasksToConsider = activeSubtasks.length > 0 ? activeSubtasks : task.subtasks;
      const dates = subtasksToConsider.map(st => st.dueDate).filter(Boolean);
      if (dates.length > 0) {
        dates.sort();
        return dates[0];
      }
    }
    return task.dueDate;
  },

  /**
   * 依據截止日與重要性，將任務分到 q1~q4
   */
  classifyTask(task) {
    const now = new Date();
    const effectiveDate = this.getEffectiveDueDate(task);
    const dueDate = new Date(effectiveDate + 'T23:59:59');
    const diffMs = dueDate - now;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // 已逾期 或 <= 門檻天數 都算「緊急」
    const isUrgent = diffDays <= this.URGENT_THRESHOLD_DAYS;
    const isImportant = task.important;

    if (isImportant && isUrgent)  return 'q1';
    if (isImportant && !isUrgent) return 'q2';
    if (!isImportant && isUrgent) return 'q3';
    return 'q4';
  },

  /**
   * 計算倒數計時文字與狀態
   */
  getCountdown(dueDateStr) {
    const now = new Date();
    const due = new Date(dueDateStr + 'T23:59:59');
    const diff = due - now;

    // Guard against invalid dates
    if (isNaN(diff)) {
      return { text: '日期無效', status: 'overdue' };
    }

    if (diff < 0) {
      const overdueDays = Math.ceil(Math.abs(diff) / (1000 * 60 * 60 * 24));
      return {
        text: `已逾期 ${overdueDays} 天`,
        status: 'overdue'
      };
    }

    const totalHours = diff / (1000 * 60 * 60);
    const days = Math.floor(totalHours / 24);
    const hours = Math.floor(totalHours % 24);

    if (days === 0 && hours === 0) {
      return { text: '今日到期', status: 'due-soon' };
    }

    if (days === 0) {
      return { text: `剩餘 ${hours} 小時`, status: 'due-soon' };
    }

    if (days <= this.URGENT_THRESHOLD_DAYS) {
      return { text: `剩餘 ${days} 天 ${hours} 小時`, status: 'due-soon' };
    }

    return { text: `剩餘 ${days} 天`, status: 'normal' };
  },

  /**
   * 格式化日期為易讀格式
   */
  formatDate(dueDateStr) {
    const d = new Date(dueDateStr);
    if (isNaN(d.getTime())) return '日期無效';
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekday = weekdays[d.getDay()];
    return `${month}/${day} (${weekday})`;
  },

  /**
   * 統計資訊
   */
  getStats(tasks) {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    let urgent = 0, overdue = 0, today = 0;

    tasks.forEach(task => {
      if (task.completed) return;
      const effectiveDate = this.getEffectiveDueDate(task);
      const due = new Date(effectiveDate + 'T23:59:59');
      const diffDays = (due - now) / (1000 * 60 * 60 * 24);

      if (diffDays < 0) overdue++;
      if (diffDays <= this.URGENT_THRESHOLD_DAYS) urgent++;
      if (effectiveDate === todayStr) today++;
    });

    return {
      total: tasks.filter(t => !t.completed).length,
      urgent,
      overdue,
      today
    };
  }
};

