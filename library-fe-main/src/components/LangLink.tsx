import { Link } from "wouter";
import type { ReactNode, MouseEventHandler, CSSProperties } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { withLang } from "@/lib/lang";

type LangLinkProps = {
  href: string;
  children?: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  style?: CSSProperties;
  replace?: boolean;
  state?: unknown;
};

/** wouter Link that keeps the current `lang` query param. */
export default function LangLink({ href, ...props }: LangLinkProps) {
  const { language } = useLanguage();
  return <Link href={withLang(href, language)} {...props} />;
}
