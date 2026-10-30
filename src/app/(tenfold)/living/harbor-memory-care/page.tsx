import { LivingOverview, livingMetadata } from "@/components/tenfold/LivingOverview";

export const generateMetadata = () => livingMetadata("harbor");

export default function Page() {
  return <LivingOverview which="harbor" />;
}
