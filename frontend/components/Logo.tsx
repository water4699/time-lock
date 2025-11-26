interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function Logo({ width = 60, height = 60, className }: LogoProps) {
  return (
    <img
      src="/study-logo.svg"
      alt="Study Schedule Logo"
      width={width}
      height={height}
      className={className}
      style={{ width: width, height: height }}
    />
  );
}
