"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  // Prevent background document scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop overlay background */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/55 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal card content container */}
      <div
        className={`relative w-full bg-card text-card-foreground rounded-3xl border border-border/80 shadow-2xl shadow-black/5 dark:shadow-black/40 p-6 overflow-hidden animate-slide-up transition-all duration-300 ${sizeClasses[size]}`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content body */}
        <div className="mt-4 max-h-[75vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}
