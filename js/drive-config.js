// ============================================
// Google Drive API Configuration
// ============================================

const driveConfig = {
  // 您的 Google Drive API Key (請從 Google Cloud Console 取得)
  apiKey: "AIzaSyCImVm-icMPQzxCAMBGDbVy2WJySO7_omk",
  
  // 您的 Google OAuth Client ID
  clientId: "853805693247-igt4sc63pkqnapdafg1fb1610ekjaq3m.apps.googleusercontent.com"
};

// 偵測是否已填寫 API Key 和 Client ID
const isDriveConfigured = driveConfig.apiKey.length > 20 && driveConfig.clientId.length > 20;

if (!isDriveConfigured) {
  console.log('💾 Google Drive 未設定，使用本地模式 (LocalStorage)');
}
