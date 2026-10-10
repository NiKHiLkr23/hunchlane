"use client";
import { HomeDashboard } from "@/components/home-dashboard";
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <HomeDashboard runs={[]} connectionError onRetry={retry}/>;
}
