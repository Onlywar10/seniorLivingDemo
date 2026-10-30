import { LivingOverview, livingMetadata } from "@/components/tenfold/LivingOverview";

export const generateMetadata = () => livingMetadata("independent");

export default function Page() {
  return <LivingOverview which="independent" />;
}
