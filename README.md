
<div align="center">
<img width="1200" height="475" alt="Melody Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🍓 Melody Project Manager 🍭
### 可愛三麗鷗風格的 Notion 式專案管理工具
</div>

## 🎀 核心功能統整

本專案結合了強大的生產力功能與極致的視覺美學，提供以下核心體驗：

### 1. 多維度專案檢視 (Multi-View)
*   **總覽儀表板 (Dashboard)**：整合進度環形圖、小叮嚀便條、以及任務快覽。
*   **Notion 拖曳清單**：支援 Notion 風格的任務排序，滑鼠懸停顯示 `grab` 手感，隨意調整優先順序。
*   **視覺甘特圖 (Gantt)**：精確到天的任務進度條，一眼掌握專案時程。
*   **專業看板 (Kanban)**：流暢的任務狀態拖曳轉換（待處理 -> 進行中 -> 已完成）。
*   **日曆視圖 (Calendar)**：月曆模式查看每日任務排程。
*   **Markdown 筆記 (Notes)**：支援 GFM 語法的強大筆記區域與資源連結庫。

### 2. 智慧任務提醒系統 (Smart Notification)
*   **Windows 系統原生通知**：任務到期時，會直接發送作業系統層級的通知彈窗（即使瀏覽器縮小中）。
*   **待機補發機制**：若提醒當下電腦處於休眠或網頁未開啟，重新打開網頁後會立即補發錯過的提醒。
*   **排程資源清理**：提醒觸發後會自動記錄於 `History` 並從即時排程中移除，不佔用額外運算資源。

### 3. 主題與同步 (Theme & Sync)
*   **雙重主題模式**：支援明亮的 **Melody 粉嫩模式** 與護眼的 **Kuromi 暗色模式**。
*   **雲端本地雙同步**：無縫串接 Firebase Firestore，未登入時自動切換至 LocalStorage 儲存，確保資料永不丟失。
*   **標籤過濾系統**：自定義標籤色票，支援多重標籤即時篩選。

---

## 🚀 快速上手

### 開發環境需求
*   Node.js (建議 v20 以上)
*   Firebase 帳號 (可選，用於雲端同步)

### 本地運行
1.  **安裝依賴**：
    ```bash
    npm install
    ```
2.  **環境設定**：
    確保 `lib/firebase.ts` 中的配置正確。
3.  **啟動開發伺服器**：
    ```bash
    npm run dev
    ```

### 技術棧
*   **Frontend**: React 19, TypeScript, Tailwind CSS
*   **Drag & Drop**: @dnd-kit
*   **Charts**: Recharts
*   **Backend**: Firebase Auth & Firestore
*   **Icons**: Lucide React

---
<div align="center">
Made with ❤️ and Sparkles 🍰
</div>
