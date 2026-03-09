import ProductsHero from "@/components/marketing/Products/ProductsHero";
import AgentsGrid from "@/components/marketing/Products/AgentsGrid";
import { ProductFeatures } from "@/components/marketing/Products/ProductFeatures";
import HowItWorks from "@/components/marketing/Products/HowItWorks";
import { ProductBenefits } from "@/components/marketing/Products/ProductBenefits";
import { ProductUseCases } from "@/components/marketing/Products/ProductUseCases";
import { ProductsCTA } from "@/components/marketing/Products/ProductsCTA";

export default function ProductsPage() {
  return (
    <>
      <ProductsHero />
      <AgentsGrid />
      <ProductFeatures />
      <HowItWorks />
      <ProductBenefits />
      <ProductUseCases />
      <ProductsCTA />
    </>
  );
}
