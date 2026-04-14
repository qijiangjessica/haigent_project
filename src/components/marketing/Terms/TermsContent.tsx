"use client";

import { SvgIcon } from "@/components/ui/svg-icon";

const companyInfo = {
  name: "Haigent.ai",
  address: "C/O ProCogia\n560-1575 West Georgia Street, Suite 560\nVancouver, BC V6G 2T1, Canada",
  email: "Customersupport@haigent.ai",
  website: "https://haigent.ai",
  parentCompany: "ProCogia (0965688 B.C. LTD.)",
  jurisdiction: "British Columbia, Canada",
  lastUpdated: "—",
};

export function TermsContent() {
  return (
    <section className="bg-background py-16 md:py-16 lg:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-2">Terms and Conditions</h1>
          <p className="text-sm text-muted-foreground">Last updated: {companyInfo.lastUpdated}</p>
        </div>

        <div id="company-info" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-wide mb-6">
            1. COMPANY INFORMATION
          </h2>
          <div className="space-y-6 text-foreground">
            <div>
              <p className="font-bold text-lg mb-3">{companyInfo.name}</p>
              <div className="flex items-start gap-2 text-muted-foreground">
                <SvgIcon name="hr-office" size={20} alt="Address" className="shrink-0 mt-0.5" />
                <p className="whitespace-pre-line leading-relaxed">{companyInfo.address}</p>
              </div>
            </div>
            <div className="space-y-3 pt-6 border-t border-border/50">
              <div className="flex items-center gap-2 text-base">
                <SvgIcon name="customer-service" size={16} alt="Email" className="shrink-0" />
                <a href={`mailto:${companyInfo.email}`} className="text-foreground hover:text-primary transition-colors">
                  {companyInfo.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-base">
                <SvgIcon name="global-network" size={16} alt="Website" className="shrink-0" />
                <a href={companyInfo.website} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
                  {companyInfo.website}
                </a>
              </div>
            </div>
            <div className="pt-6 border-t border-border/50 space-y-2 text-sm">
              <div>
                <span className="font-semibold text-foreground">Parent Company: </span>
                <span className="text-muted-foreground">{companyInfo.parentCompany}</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">Jurisdiction: </span>
                <span className="text-muted-foreground">{companyInfo.jurisdiction}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <div id="agreement" className="scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-wide mb-6">
              2. AGREEMENT TO TERMS
            </h2>
            <div className="space-y-4 text-base text-muted-foreground leading-relaxed">
              <p>
                These Terms and Conditions (&quot;Terms&quot;) contains a legally binding contract between you (whether an individual or an entity) and Haigent.ai, a division of ProCogia (herein referred to as &quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) with respect to your use of the Haigent.ai site and associated services, mobile applications, and platforms (herein referred to as the &quot;Service&quot;).
              </p>
              <p>
                Using or visiting our Service, you admit that you have read, comprehended and accept to be bound by these Terms. In case you disagree with any of these Terms, you are required to stop using the Service.
              </p>
            </div>
          </div>

          <div id="service" className="scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-wide mb-6">
              3. DESCRIPTION OF SERVICE
            </h2>
            <div className="space-y-4 text-base text-muted-foreground leading-relaxed">
              <p>Haigent.ai offers innovative HR and recruiting automation through its AI-based platform. Our Service includes:</p>
              <ul className="space-y-2 ml-6 list-disc">
                <li>Human resource and recruiting multinomial agent workflow orchestration software.</li>
                <li>HR workflow automation tools to reduce administrative workload.</li>
                <li>Enterprise system integration services.</li>
                <li>Professional training, implementation and consulting services.</li>
                <li>Performance tracking, analytics and reporting tools.</li>
              </ul>
              <p>
                Organizations can have AI agents working with human teams on an equal level, which is more efficient, saves time on hiring, and optimizes HR services with the help of our platform.
              </p>
            </div>
          </div>

          <div id="eligibility" className="scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-wide mb-6">
              4. USER ELIGIBILITY AND REGISTRATION
            </h2>
            <div className="space-y-6 text-base text-muted-foreground leading-relaxed">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">4.1. AGE REQUIREMENTS</h3>
                <p>The age to use the Service must be 18 years or age of majority in your country of location. Registration ensures this requirement is accurate by virtue of registering.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">4.2. ACCOUNT REGISTRATION</h3>
                <p className="mb-4">There are aspects of the Service that require creating an account. By registering, you agree to:</p>
                <ul className="space-y-2 ml-6 list-disc">
                  <li>Present valid, updated and complete information.</li>
                  <li>Take care of your account details.</li>
                  <li>Update your account within the required time.</li>
                  <li>Be responsible for all the activities carried out on your behalf.</li>
                  <li>Report to Haigent.ai the presence of unauthorized use of accounts.</li>
                </ul>
              </div>
            </div>
          </div>

          <div id="privacy" className="scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-wide mb-6">
              5. PRIVACY AND DATA PROTECTION
            </h2>
            <div className="space-y-6 text-base text-muted-foreground leading-relaxed">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">5.1. COMPLIANCE WITH CANADIAN PRIVACY LAWS</h3>
                <p>Haigent.AI complies with the Canadian privacy legislation, including PIPEDA, as well as provincial privacy laws.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">5.2. DATA COLLECTION AND USE</h3>
                <p>Using the Service is subject to our Privacy Policy, which governs the collection, use, and disclosure of personal information. Through the utilization of our Service, you agree to this gathering and treatment.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">5.3. DATA SECURITY</h3>
                <p>The technical and organizational procedures are implemented to ensure that the access, disclosure, alteration, and destruction of personal data is restricted.</p>
              </div>
            </div>
          </div>

          <div id="liability" className="scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-wide mb-6">
              6. LIMITATION OF LIABILITY
            </h2>
            <div className="space-y-6 text-base text-muted-foreground leading-relaxed">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">6.1. DISCLAIMER OF WARRANTIES</h3>
                <p className="font-medium">The Service is being offered on an &quot;as-is&quot; and &quot;as available&quot; basis. Haigent.ai does not give any type of warranty (express, implied, or statutory).</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">6.2. LIMITATION OF DAMAGES</h3>
                <p className="font-medium">Haigent.ai and ProCogia will not deal with any indirect, incidental, special, punitive, or consequential damages resulting from your use of the Service to the extent hypothesized by the law.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">6.3. MAXIMUM LIABILITY</h3>
                <p>Your liability as a whole against any claims shall in no way surpass the amount you paid to Haigent.ai within the twelve (12) months before the incident on which the liability arises.</p>
              </div>
            </div>
          </div>

          <div id="dispute" className="scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-wide mb-6">
              7. DISPUTE RESOLUTION
            </h2>
            <div className="space-y-6 text-base text-muted-foreground leading-relaxed">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">7.1. GOVERNING LAW</h3>
                <p>These Terms are governed by the laws of British Columbia, Canada, notwithstanding any conflict of laws principles.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">7.2. JURISDICTION</h3>
                <p>Any dispute which arises out of these Terms shall be under the boundaries of the exclusive jurisdiction of the courts of British Columbia, Canada.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">7.3. ALTERNATIVE DISPUTE RESOLUTION</h3>
                <p>Before parties resort to court proceedings, they settle to mediate in the British Columbia International Commercial Arbitration Centre (BCICAC).</p>
              </div>
            </div>
          </div>

          <div id="contact" className="scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-wide mb-6">
              8. CONTACT INFORMATION
            </h2>
            <div className="space-y-6 text-base text-muted-foreground leading-relaxed">
              <p>For questions regarding these Terms, please contact:</p>
              <div>
                <p className="font-bold text-foreground mb-2">{companyInfo.name}</p>
                <p className="whitespace-pre-line">
                  C/O ProCogia{"\n"}560-1575 West Georgia Street, Suite 560{"\n"}Vancouver, BC V6G 2T1, Canada
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <SvgIcon name="customer-service" size={16} alt="Email" className="shrink-0" />
                  <a href="mailto:Customersupport@haigent.ai" className="text-foreground hover:text-primary transition-colors">
                    Customersupport@haigent.ai
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div id="language" className="scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-wide mb-6">
              9. LANGUAGE
            </h2>
            <div className="text-base text-muted-foreground leading-relaxed">
              <p>These Terms are drafted in English. In case of any discrepancy between the English version and any translated version, the English version shall prevail.</p>
              <p className="mt-4 text-sm italic">
                This Terms page ensures legal clarity, user trust, and transparency, covering all essential points for your Haigent.ai AI Agent Orchestration platform and HR automation services.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
