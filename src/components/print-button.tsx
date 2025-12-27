"use client";

export function PrintButton() {
  return (
    <button
      className="print-button no-print"
      onClick={() => window.print()}
      type="button"
    >
      Drucken
    </button>
  );
}
