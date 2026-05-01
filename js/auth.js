// ============================================
// Authentication Module (Google Identity)
// ============================================

const Auth = {
  init() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const localBadge = document.getElementById('localBadge');

    if (!isDriveConfigured) {
      // Local mode — hide login, show badge
      loginBtn.classList.add('hidden');
      localBadge.classList.remove('hidden');
      App.loadTasks();
      return;
    }

    // Drive mode
    loginBtn.classList.remove('hidden');

    loginBtn.addEventListener('click', () => this.signIn());
    logoutBtn.addEventListener('click', () => this.signOut());

    // 啟動時先嘗試載入本地任務
    App.loadTasks();
  },

  signIn() {
    DriveSync.signIn();
  },

  signOut() {
    DriveSync.signOut();
  },

  showUserInfo(user) {
    document.getElementById('loginBtn').classList.add('hidden');
    document.getElementById('localBadge').classList.add('hidden');

    const userInfo = document.getElementById('userInfo');
    userInfo.classList.remove('hidden');

    const avatar = document.getElementById('userAvatar');
    avatar.src = user.photoURL || '';
    avatar.alt = user.displayName || '用戶';

    document.getElementById('userName').textContent = user.displayName || user.email;
  },

  showLoginButton() {
    document.getElementById('userInfo').classList.add('hidden');
    document.getElementById('loginBtn').classList.remove('hidden');
    document.getElementById('localBadge').classList.add('hidden');
  }
};
