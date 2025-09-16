import dynamic from "next/dynamic";

const Calculator = dynamic(() => import("@/components/Calculator"), { ssr: false });

export default function PlatformPage() {
  return <Calculator />;
}