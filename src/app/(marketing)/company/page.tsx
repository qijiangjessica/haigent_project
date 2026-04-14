import { AboutHero } from "@/components/marketing/Company/AboutHero";
import { OurMission } from "@/components/marketing/Company/OurMission";
import { OurVision } from "@/components/marketing/Company/OurVision";
import { CoreValues } from "@/components/marketing/Company/CoreValues";
import { JoinTeamCTA } from "@/components/marketing/Company/JoinTeamCTA";

export default function CompanyPage() {
  return (
    <>
      <AboutHero />
      <OurMission />
      <OurVision />
      <CoreValues />
      <JoinTeamCTA />
    </>
  );
}
