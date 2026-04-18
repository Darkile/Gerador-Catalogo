"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PdfPreviewModal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-6xl rounded-lg bg-white p-4 shadow-2xl">
        <Button
          type="button"
          variant="ghost"
          className="absolute right-3 top-3"
          onClick={onClose}
          aria-label="Fechar pré-visualização"
        >
          <X className="h-4 w-4" />
        </Button>
        {children}
      </div>
    </div>
  );
}
