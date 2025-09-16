"use client";

import * as Icons from "lucide-react";
import { type LucideProps } from "lucide-react";
import { type ComponentType } from "react";

function toPascalCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

const fallbackIcon = Icons.HelpCircle;

type IconName = keyof typeof Icons;

type LucideIconProps = LucideProps & {
  name: string;
};

export function LucideIcon({ name, ...props }: LucideIconProps) {
  const iconKey = toPascalCase(name) as IconName;
  const Icon = (Icons as Record<string, ComponentType<LucideProps>>)[iconKey] ?? fallbackIcon;
  return <Icon {...props} />;
}

export default LucideIcon;