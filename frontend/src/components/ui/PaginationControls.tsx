import React from "react";

import { Button } from "./Button";
import { useTranslation } from "react-i18next";

export const PaginationControls: React.FC<{
  page: number;
  pageSize: number;
  count: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}> = ({ page, pageSize, count, hasPrev, hasNext, onPrev, onNext }) => {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil((count || 0) / (pageSize || 1)));

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-800/50">
      <div className="text-xs text-slate-500">
        {t("pagination.page_of", { page, total: totalPages })}
        {typeof count === "number" ? ` · ${t("pagination.total", { count })}` : ""}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={!hasPrev}>
          {t("pagination.prev")}
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext}>
          {t("pagination.next")}
        </Button>
      </div>
    </div>
  );
};
