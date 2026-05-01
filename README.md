# ⚡ 艾森豪矩陣 (Eisenhower Matrix)

智能任務管理工具 — 幫你分清輕重緩急，提升效率。

## 功能

- 📝 新增任務：輸入任務名稱、截止日期、重要性
- 🤖 智能分類：根據截止日期自動判斷緊急程度（≤ 3 天為緊急）
- 🔄 自動流動：任務隨時間接近截止日會自動移至緊急象限
- ⏰ 倒數計時：顯示每個任務的剩餘天數/小時
- ☁️ 雲端同步：使用 Firebase Firestore 儲存，支援多裝置
- 🔐 Google 登入：一鍵登入，資料跟著帳號走
- 💾 離線可用：未設定 Firebase 時自動使用 LocalStorage
- 📱 響應式設計：支援桌面、平板、手機

## 四象限

| | 🔥 緊急 (≤3天) | 🌿 不緊急 (>3天) |
|---|---|---|
| **⭐ 重要** | Q1: 立即執行 | Q2: 計劃安排 |
| **📋 不重要** | Q3: 委派處理 | Q4: 考慮刪除 |

## 快速開始（本地模式）

不需要任何設定，直接打開 `index.html` 就能使用：

```bash
# 用 Python 啟動本地伺服器
cd TASK_MANAGE
python3 -m http.server 8080

# 打開瀏覽器訪問
open http://localhost:8080
```

資料會儲存在瀏覽器的 LocalStorage 中。

## 雲端模式（Firebase 設定）

### 1. 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「新增專案」→ 輸入專案名稱（如 `eisenhower-matrix`）
3. 依照步驟完成建立（可關閉 Google Analytics）

### 2. 新增網頁應用程式

1. 在專案首頁，點擊 **</>** (Web) 圖示
2. 輸入應用程式暱稱（如 `matrix-web`）
3. 複製 `firebaseConfig` 設定值

### 3. 啟用 Authentication

1. 左側選單 → Authentication → 開始使用
2. 「Sign-in method」分頁 → 啟用「Google」
3. 填寫支援電子郵件 → 儲存

### 4. 啟用 Firestore

1. 左側選單 → Firestore Database → 建立資料庫
2. 選擇「以測試模式啟動」→ 選擇地區 → 建立

### 5. 更新設定

編輯 `js/firebase-config.js`，將 `YOUR_xxx` 替換為你的設定值：

```js
const firebaseConfig = {
  apiKey: "你的 API Key",
  authDomain: "你的專案.firebaseapp.com",
  projectId: "你的專案 ID",
  storageBucket: "你的專案.appspot.com",
  messagingSenderId: "你的 Sender ID",
  appId: "你的 App ID"
};
```

## 部署到 GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的帳號/eisenhower-matrix.git
git push -u origin main
```

然後到 GitHub → Settings → Pages → Source 選 `main` branch → Save。

## 技術棧

- HTML5 + CSS3 + Vanilla JavaScript
- Firebase Firestore（雲端資料庫）
- Firebase Authentication（Google 登入）
- CSS Glassmorphism + 微動畫
- 響應式設計

## 授權

MIT License
