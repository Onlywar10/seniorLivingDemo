import { LivingOverview, livingMetadata } from "@/components/wrenhaven/LivingOverview";

export const generateMetadata = () => livingMetadata("independent");

export default function Page() {
  return <LivingOverview which="independent" />;
}
