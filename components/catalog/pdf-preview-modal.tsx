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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 sm:p-4 pt-12 sm:pt-4 backdrop-blur-md">
      <div className="relative w-full max-w-6xl h-[100dvh] sm:h-auto rounded-none sm:rounded-lg bg-white p-2 sm:p-4 shadow-2xl overflow-hidden flex flex-col">
        <Button
          type="button"
          variant="ghost"
          className="absolute right-2 top-2 sm:right-3 sm:top-3 z-10 bg-white/80 backdrop-blur"
          onClick={onClose}
          aria-label="Fechar pré-visualização"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
