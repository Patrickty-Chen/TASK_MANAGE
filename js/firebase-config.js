// ============================================
// Firebase Configuration
// ============================================
// 
// 🔧 請將下方的 "YOUR_xxx" 替換為你的 Firebase 專案設定
// 如果尚未設定，應用程式會自動切換為「本地模式」(localStorage)
//

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Auto-detect if Firebase is configured
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

let db = null;
let auth = null;

if (isFirebaseConfigured) {
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    console.log('✅ Firebase 已初始化');
  } catch (error) {
    console.error('❌ Firebase 初始化失敗:', error);
  }
} else {
  console.log('💾 Firebase 未設定，使用本地模式');
}
