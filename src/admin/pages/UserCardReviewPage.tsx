import { useCallback, useState } from "react";
import { Toast, type ToastMessage } from "../../components/Toast";
import type { AdminUserCard } from "../../types/adminUserCard";
import { UserCardReviewFilters } from "../components/userCardReview/UserCardReviewFilters";
import { UserCardReviewList } from "../components/userCardReview/UserCardReviewList";
import { UserCardReviewSheet } from "../components/userCardReview/UserCardReviewSheet";
import { useUserCardReviewList } from "../hooks/useUserCardReviewList";

/** 審核管理 / 乘車卡：預設顯示審核中的卡片 */
export function UserCardReviewPage() {
  const { filters, changeStatus, search, changePage, result } = useUserCardReviewList();
  const [keywordInput, setKeywordInput] = useState("");
  const [selectedCard, setSelectedCard] = useState<AdminUserCard | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Toast 以 onClose 作為計時 effect 的依賴，需保持參照穩定
  const closeToast = useCallback(() => setToast(null), []);

  const clearKeyword = () => {
    setKeywordInput("");
    search("");
  };

  const handleReviewed = (message: string) => {
    setSelectedCard(null);
    setToast({ type: "success", message });
  };

  const handleStale = (message: string) => {
    setSelectedCard(null);
    setToast({ type: "error", message });
  };

  return (
    <div className="space-y-4">
      <UserCardReviewFilters
        status={filters.status}
        keywordInput={keywordInput}
        onStatusChange={changeStatus}
        onKeywordInputChange={setKeywordInput}
        onSearch={() => search(keywordInput)}
      />

      <UserCardReviewList
        status={filters.status}
        keyword={filters.keyword}
        page={filters.page}
        result={result}
        onPageChange={changePage}
        onClearKeyword={clearKeyword}
        onShowApproved={() => changeStatus("APPROVED")}
        onOpenCard={setSelectedCard}
      />

      <UserCardReviewSheet
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
        onReviewed={handleReviewed}
        onStale={handleStale}
      />

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
