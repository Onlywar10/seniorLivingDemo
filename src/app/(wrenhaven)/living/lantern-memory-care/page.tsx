import { LivingOverview, livingMetadata } from "@/components/wrenhaven/LivingOverview";

export const generateMetadata = () => livingMetadata("lantern");

export default function Page() {
  return <LivingOverview which="lantern" />;
}
