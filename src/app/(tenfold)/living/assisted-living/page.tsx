import { LivingOverview, livingMetadata } from "@/components/tenfold/LivingOverview";

export const generateMetadata = () => livingMetadata("assisted");

export default function Page() {
  return <LivingOverview which="assisted" />;
}
