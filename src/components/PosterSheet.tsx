import type { ReactNode } from "react";

/**
 * One A4 portrait page (210 × 297 mm) for printable posters. On screen it's
 * previewed at the same proportions; when printing, the page margin is zeroed
 * and the sheet fills the paper (the border is the poster's frame).
 */
export function PosterSheet({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{"@page { size: A4 portrait; margin: 0; } @media print { html, body { margin: 0; background: #fff; } }"}</style>
      <section className="mx-auto box-border flex aspect-[210/297] w-full max-w-2xl flex-col items-center justify-between gap-4 rounded-2xl border-2 border-slate-900 bg-white p-8 text-center print:m-0 print:aspect-auto print:h-[296mm] print:w-[210mm] print:max-w-none print:gap-0 print:overflow-hidden print:rounded-none print:border-[3mm] print:p-[12mm]">
        {children}
      </section>
    </>
  );
}
