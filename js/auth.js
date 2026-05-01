// ============================================
// Authentication Module
// ============================================

const Auth = {
  currentUser: null,

  init() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const localBadge = document.getElementById('localBadge');

    if (!isFirebaseConfigured) {
      // Local mode — hide login, show badge
      loginBtn.classList.add('hidden');
      localBadge.classList.remove('hidden');
      App.loadTasks();
      return;
    }

    // Firebase mode
    loginBtn.classList.remove('hidden');

    auth.onAuthStateChanged((user) => {
      if (user) {
        this.currentUser = user;
        this.showUserInfo(user);
        App.loadTasks();
      } else {
        this.currentUser = null;
        this.showLoginButton();
        // Still load tasks from localStorage as fallback
        App.loadTasks();
      }
    });

    loginBtn.addEventListener('click', () => this.signIn());
    logoutBtn.addEventListener('click', () => this.signOut());
  },

  async signIn() {
    if (!auth) return;
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
      App.showToast('✅ 登入成功！');
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error('Login error:', error);
        App.showToast('❌ 登入失敗，請再試一次');
      }
    }
  },

  async signOut() {
    if (!auth) return;
    try {
      await auth.signOut();
      App.showToast('👋 已登出');
    } catch (error) {
      console.error('Logout error:', error);
    }
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
