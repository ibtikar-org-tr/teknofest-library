import { Link, type LinkProps } from "wouter";
import { useLanguage } from "@/lib/LanguageContext";
import { withLang } from "@/lib/lang";

/** wouter Link that keeps the current `lang` query param. */
export default function LangLink({ href, ...props }: LinkProps) {
  const { language } = useLanguage();
  const resolved = typeof href === "string" ? withLang(href, language) : href;
  return <Link href={resolved} {...props} />;
}
