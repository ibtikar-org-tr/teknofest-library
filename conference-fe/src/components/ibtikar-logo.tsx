type IbtikarLogoProps = {
  variant?: "long" | "square"
  className?: string
}

export function IbtikarLogo({ variant = "long", className }: IbtikarLogoProps) {
  const src = variant === "long" ? "/white_long_logo.svg" : "/square_logo.svg"
  return <img src={src} alt="Ibtikar Assembly" className={className} />
}

export const IBTIKAR_URL = "https://ibtikar.org.tr"
