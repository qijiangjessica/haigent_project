import { UseCasesHero } from "@/components/marketing/UseCases/UseCasesHero";
import { WorkflowsTable } from "@/components/marketing/UseCases/WorkflowsTable";
import { IndustryPacks } from "@/components/marketing/UseCases/IndustryPacks";
import { ActivateSteps } from "@/components/marketing/UseCases/ActivateSteps";
import { WhyChoose } from "@/components/marketing/UseCases/WhyChoose";
import { UseCasesCTA } from "@/components/marketing/UseCases/UseCasesCTA";

export default function UseCasesPage() {
  return (
    <>
      <UseCasesHero />
      <WorkflowsTable />
      <IndustryPacks />
      <ActivateSteps />
      <WhyChoose />
      <UseCasesCTA />
    </>
  );
}
