"use client";

export function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
    >
      {label}
    </button>
  );
}
