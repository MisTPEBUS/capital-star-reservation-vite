# Capital Star Reservation Vite

手機與平板優先的 Vite + React + Tailwind 前端專案。此版本不串 API，資料全部放在 `src/data/mockData.ts`。

## 功能範圍

- Section 1：乘客會員資訊，包含識別碼
- Section 2：選擇預約條件，上車地點、日期、時間
- Section 3：班次清單，包含時間、班次名稱、預約剩餘人數
- Section 4：點選預約按鈕後顯示預約成功彈跳視窗

## 專案結構

```txt
src/
├─ assets/              # 巴士圖片
├─ components/          # 頁面元件
├─ data/mockData.ts     # 假資料
├─ types/reservation.ts # 型別定義
├─ App.tsx
├─ main.tsx
└─ index.css
```

## 執行方式

```bash
npm install
npm run dev
```

## 建置

```bash
npm run build
```

## API 串接方向

之後可將 `mockData.ts` 替換為 API 呼叫：

- 會員資訊：`GET /api/v1/users/me`
- 路線與站點：`GET /api/v1/routes`
- 班次查詢：`GET /api/v1/schedules?routeId=...&pickupStopId=...&date=...`
- 建立預約：`POST /api/v1/reservations`
