"use client";
import { usePathname, useRouter } from "next/navigation";
import { LANGS, LANG_LABEL, type Lang } from "@/lib/i18n";

export default function LangSwitcher({ lang, label }: { lang: Lang; label: string }) {
  const path = usePathname();
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="muted hidden sm:inline">{label}</span>
      <select
        className="select !w-auto !py-1"
        value={lang}
        aria-label={label}
        onChange={(e) => {
          const next = e.target.value;
          const rest = path.split("/").slice(2).join("/");
          router.push(`/${next}${rest ? "/" + rest : ""}`);
        }}
      >
        {LANGS.map((l) => <option key={l} value={l}>{LANG_LABEL[l]}</option>)}
      </select>
    </label>
  );
}
