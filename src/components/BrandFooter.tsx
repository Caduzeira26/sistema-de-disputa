import Image from "next/image";

/** "Powered by" footer for the tool's own screens — never on printable tournament sheets. */
export function BrandFooter() {
  return (
    <footer className="mt-10 flex items-center justify-center gap-2 border-t border-slate-200 py-4 text-xs text-slate-400">
      <span>Desenvolvido por</span>
      <Image src="/digitamoney-icon-v2.png" alt="" width={560} height={560} className="h-7 w-7" />
      <span className="font-medium text-slate-500">Digita Money</span>
    </footer>
  );
}
