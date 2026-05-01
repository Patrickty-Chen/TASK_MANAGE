// ============================================
// Google Drive API Configuration
// ============================================

const driveConfig = {
  // 請填入你的 Google API Key
  apiKey: "AIzaSyDeDmBsrxOzmcdp_RfKblZ7TlH_OJcpCrQ",
  
  // 請填入你的 OAuth 用戶端 ID
  clientId: "853805693247-igt4sc63pkqnapdafg1fb1610ekjaq3m.apps.googleusercontent.com"
};

// 偵測是否已填寫 API Key 和 Client ID
const isDriveConfigured = driveConfig.apiKey.length > 20 && driveConfig.clientId.length > 20;

if (!isDriveConfigured) {
  console.log('💾 Google Drive 未設定，使用本地模式 (LocalStorage)');
}
