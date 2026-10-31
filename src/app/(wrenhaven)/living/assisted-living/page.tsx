import { LivingOverview, livingMetadata } from "@/components/wrenhaven/LivingOverview";

export const generateMetadata = () => livingMetadata("assisted");

export default function Page() {
  return <LivingOverview which="assisted" />;
}
