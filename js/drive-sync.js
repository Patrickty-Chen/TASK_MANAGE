// ============================================
// Google Drive Sync Module
// ============================================

const DriveSync = {
  gapiInited: false,
  gisInited: false,
  tokenClient: null,
  isAuthenticated: false,
  fileId: null,
  userInfo: null,

  // --- Initialization ---

  initGapi() {
    if (!isDriveConfigured) return;
    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          apiKey: driveConfig.apiKey,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
        });
        this.gapiInited = true;
        this.checkReady();
      } catch (e) {
        console.error('GAPI Init Error:', e);
      }
    });
  },

  initGis() {
    if (!isDriveConfigured) return;
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: driveConfig.clientId,
      scope: 'https://www.googleapis.com/auth/drive.appdata',
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.error) {
          console.error('Token Error:', tokenResponse.error);
          App.showToast('❌ 登入失敗');
          return;
        }
        this.isAuthenticated = true;
        this.fetchUserInfo(tokenResponse.access_token);
        this.syncWithDrive();
      },
    });
    this.gisInited = true;
    this.checkReady();
  },

  checkReady() {
    if (this.gapiInited && this.gisInited) {
      console.log('✅ Google API 準備就緒');
    }
  },

  // --- Auth Actions ---

  signIn() {
    if (!this.tokenClient) return;
    // 每次要求 token 時，如果之前已經有授權，可以直接拿到；否則會彈出視窗
    this.tokenClient.requestAccessToken({ prompt: 'consent' });
  },

  signOut() {
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token, () => {
        gapi.client.setToken('');
        this.isAuthenticated = false;
        this.fileId = null;
        this.userInfo = null;
        Auth.showLoginButton();
        App.loadFromLocalStorage(); // 回到本地模式
        App.renderTasks();
        App.showToast('👋 已登出 Google Drive');
      });
    }
  },

  async fetchUserInfo(accessToken) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await response.json();
      this.userInfo = data;
      Auth.showUserInfo({
        displayName: data.name,
        email: data.email,
        photoURL: data.picture
      });
      App.showToast('✅ 登入成功');
    } catch (e) {
      console.error('Fetch user info error', e);
    }
  },

  // --- Drive Operations ---

  async syncWithDrive() {
    try {
      // 1. 尋找 appDataFolder 中是否已經有 tasks.json
      const response = await gapi.client.drive.files.list({
        spaces: 'appDataFolder',
        q: "name='tasks.json'",
        fields: 'files(id, name)'
      });

      const files = response.result.files;
      if (files && files.length > 0) {
        // 檔案存在，讀取內容
        this.fileId = files[0].id;
        await this.loadTasksFromDrive();
      } else {
        // 檔案不存在，建立新檔案（把目前 localStorage 的內容丟上去）
        App.showToast('☁️ 建立雲端檔案中...');
        await this.createFileInDrive(App.tasks);
      }
    } catch (e) {
      console.error('Sync Error:', e);
      App.showToast('❌ 同步失敗');
    }
  },

  async loadTasksFromDrive() {
    if (!this.fileId) return;
    try {
      App.showToast('⏳ 讀取雲端資料...');
      const response = await gapi.client.drive.files.get({
        fileId: this.fileId,
        alt: 'media'
      });
      
      const driveTasks = response.result;
      if (Array.isArray(driveTasks)) {
        // 合併邏輯：保留本地原本有，但雲端沒有的任務
        const localTasks = App.tasks || [];
        const mergedTasks = [...driveTasks];
        const driveTaskIds = new Set(driveTasks.map(t => t.id));
        
        let hasNewLocalTasks = false;
        for (const localTask of localTasks) {
          if (!driveTaskIds.has(localTask.id)) {
            mergedTasks.push(localTask);
            hasNewLocalTasks = true;
          }
        }
        
        App.tasks = mergedTasks;
        App.saveToLocalStorage(); // 快取到本地
        App.renderTasks();
        App.showToast('✅ 已從雲端同步');
        
        // 如果有合併本地任務，立刻上傳回雲端
        if (hasNewLocalTasks) {
          App.showToast('⬆️ 上傳本地任務中...');
          this.saveTasksToDrive(App.tasks);
        }
      }
    } catch (e) {
      console.error('Load Tasks Error:', e);
      App.showToast('❌ 讀取雲端資料失敗');
    }
  },

  async createFileInDrive(tasksData) {
    const fileMetadata = {
      'name': 'tasks.json',
      'parents': ['appDataFolder']
    };
    const fileContent = JSON.stringify(tasksData);
    
    // Google Drive API 建立檔案需要使用 Multipart upload 或者是分兩步，
    // 這裡我們直接呼叫 REST API 來傳送
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(fileMetadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      close_delim;

    try {
      const request = gapi.client.request({
        'path': '/upload/drive/v3/files',
        'method': 'POST',
        'params': {'uploadType': 'multipart'},
        'headers': {
          'Content-Type': 'multipart/related; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody
      });

      const response = await request;
      this.fileId = response.result.id;
      App.showToast('✅ 雲端檔案建立成功');
    } catch (e) {
      console.error('Create File Error:', e);
    }
  },

  async saveTasksToDrive(tasksData) {
    if (!this.isAuthenticated || !this.fileId) return;
    
    const fileContent = JSON.stringify(tasksData);
    
    try {
      // 更新檔案內容需要使用 PATCH
      const request = gapi.client.request({
        'path': '/upload/drive/v3/files/' + this.fileId,
        'method': 'PATCH',
        'params': {'uploadType': 'media'},
        'body': fileContent
      });
      
      await request;
      console.log('Saved to Drive');
    } catch (e) {
      console.error('Save to Drive Error:', e);
      App.showToast('❌ 雲端儲存失敗');
    }
  }
};

// Global callbacks for GAPI/GSI scripts
window.gapiLoaded = function() {
  DriveSync.initGapi();
};
window.gisLoaded = function() {
  DriveSync.initGis();
};
