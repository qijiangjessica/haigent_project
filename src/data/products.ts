export type ProductStat = {
  label: string;
  value: string;
  description?: string;
};

export type ProductBenefit = {
  name: string;
  description: string;
  bullets: string[];
  iconName: string;
};

export type ProductIntegration = {
  name: string;
  description: string;
  bullets: string[];
  iconName: string;
};

export type ProductWorkflowStep = {
  step: string;
  title: string;
  description: string;
  duration: string;
  systems: string[];
};

export type ProductSeo = {
  metaTitle: string;
  metaDescription: string;
  keywords: {
    primary: string[];
    secondary: string[];
  };
};

export type ProductIntroduction = {
  title: string;
  description: string;
};

export type ProductHowItWorksSection = {
  badge?:string;
  title: string;
  subtitle: string;
  items: string[];
};

export type ProductData = {

  slug: string;
  name: string;
  color: "destructive" | "primary" | "secondary" | "accent" | "muted";
  seo: ProductSeo;
  hero: {
    title: string;
    subtitle: string;
    primaryCta: { label: string; href: string };
    secondaryCta?: { label: string; href: string };
    heroImage?: string;
    stats: ProductStat[];
  };
  introduction: ProductIntroduction;
  benefits: {
    badge?:string;
    title: string;
    subtitle: string;
    items: ProductBenefit[];
  };
  integrations: {
    badge?:string;
    title: string;
    subtitle: string;
    items: ProductIntegration[];
  };
  workflow: {
    badge?:string;
    title: string;
    subtitle: string;
    steps: ProductWorkflowStep[];
  };
  howItWorks: ProductHowItWorksSection;
  cta: {
    title: string;
    subtitle: string;
    primaryCta: { label: string; href: string };
    secondaryCta?: { label: string; href: string };
  };
};

export const products: ProductData[] = [
  {
    slug: "schedule-haigent",
    name: "Schedule Haigent",
    color: "destructive",
    seo: {
      metaTitle: "Schedule Haigent Demo: AI Agent Orchestration",
      metaDescription: "Experience the power of Haigent AI agent orchestration. Schedule a demo to see how HR automation and HR workflow automation tools reduce time-to-hire.",
      keywords: {
        primary: ["Haigent", "AI Agent Orchestration"],
        secondary: ["HR automation", "Reduce time-to-hire", "HR workflow automation tools", "Talent management automation", "Digital HR Team", "Enterprise AI agent orchestration"],
      },
    },
    hero: {
      title: "Reduce 80% of Manual Interview Scheduling Efforts",
      subtitle: "Don't let a slow calendar cost you top talent. Reduce administrative load by 80% and deliver a world-class candidate experience.",
      primaryCta: { label: "Watch Demo", href: "/demo" },
      secondaryCta: { label: "Book Live Demo", href: "/demo" },
      heroImage: "/models_images/Scheduling_Haigent.png",
      stats: [
        { label: "Reduction in scheduling time", value: "80%" },
        { label: "Time-to-hire reduction", value: "50%" },
        { label: "Automation coverage", value: "24/7" },
        { label: "Enterprise integrations", value: "6+" },
      ],
    },
    introduction: {
      title: "Schedule Haigent: Experience AI Agent Orchestration in Action",
      description: "Welcome to Haigent, the pioneer in AI agent coordination of HR and recruiting. To improve the HR processes, reduce time-to-hire, and maximize the workforce, you can request your own demonstration to see our platform in action. Haigent is a more efficient, strategic, and data-driven digital HR team. With automatic talent management, complete HR workflow automation, and everything in between, our platform allows HR leaders and executives to make smarter and faster organizational decisions and reduce operational overhead.",
    },
    benefits: {
      badge: "Key Benefits",
      title: "Benefits of Automated Talent Schedule with Haigent",
      subtitle: "Our Haigent AI agent orchestration demo is tailored to your organization's needs. The session covers:",
      items: [
        { name: "Intelligent Talent Sourcing", description: "Watch our AI agents find high-potential candidates on a variety of platforms, automatically reading the best talent and filling your pipeline.", bullets: ["Multi-platform search", "Automated talent discovery", "Pipeline optimization"], iconName: "talent-search" },
        { name: "Smart Screening & Assessment", description: "Get to know how Haigent evaluates resumes, skills, and candidate fit using predictive analytics, so your digital HR team can focus only on the most suitable candidates.", bullets: ["Resume evaluation", "Skills assessment", "Predictive analytics"], iconName: "verify-compliance" },
        { name: "Automated Interview Coordination", description: "Customize your scheduler, reminders, and communications with your candidates using AI and allow your HR to focus less on routine and more on innovative decisions.", bullets: ["Smart scheduling", "Automated reminders", "Candidate communications"], iconName: "checklist" },
        { name: "Onboarding & Employee Engagement", description: "Know how our talent management automation agents can help in the orientation of the new employees, their evaluation and feedback, which will enable you to ensure top talent is retained, and the company culture is reinforced.", bullets: ["New hire orientation", "Performance evaluation", "Culture reinforcement"], iconName: "hr-office" },
        { name: "Analytics & Reporting", description: "See actionable insights and ROI tracking, as well as predictive workforce analytics in real-time and assist executives to make informed, strategic decisions.", bullets: ["ROI tracking", "Workforce analytics", "Strategic insights"], iconName: "analytics-dashboard" },
        { name: "HR Workflow Automation", description: "Explore about HR workflow automation systems that simplify administrative processes and enhance productivity.", bullets: ["Process simplification", "Admin automation", "Enhanced productivity"], iconName: "sync-profile" },
        { name: "Accelerate Hiring", description: "Using HR automation and enterprise AI agent coordination, your organization can minimize time-to-hire and hire the top people in less time.", bullets: ["Faster hiring cycles", "Top talent acquisition", "Reduced time-to-hire"], iconName: "talent-search" },
        { name: "Optimize Your HR Team", description: "Watch the AI agent-driven digital HR team reduce administrative overhead and redirect HR leaders toward strategic tasks such as employee engagement and retention.", bullets: ["Reduced admin overhead", "Strategic focus", "Employee engagement"], iconName: "hr-office" },
        { name: "Improve Operational Efficiency", description: "Get to feel the strength of HR workflow automation tools that simplify routine tasks and reduce error rates, and enhance the productivity of all HR functions.", bullets: ["Simplified workflows", "Reduced errors", "Enhanced productivity"], iconName: "verify-compliance" },
        { name: "Future-Proof Your Workforce", description: "Talent management automation and predictive analytics keep your HR operations flexible, scalable and responsive to changing business demands.", bullets: ["Flexible operations", "Scalable processes", "Predictive analytics"], iconName: "analytics-dashboard" },
      ],
    },
    integrations: {
      badge: "Scheduling Integrations",
      title: "Integrate With Your Scheduling Stack",
      subtitle: "Snap into your HR + comms stack in days.",
      items: [
        { name: "Greenhouse", description: "ATS integration for candidate data and job posting sync.", bullets: ["Real-time candidate sync", "Job posting automation", "Interview feedback tracking"], iconName: "talent-search" },
        { name: "Microsoft Teams", description: "Seamless video conferencing and team communication.", bullets: ["Auto-generated meeting links", "Calendar integration", "Chat notifications"], iconName: "user-communication" },
        { name: "Office 365", description: "Email automation and calendar management.", bullets: ["Outlook calendar sync", "Employee data sync", "Email notifications"], iconName: "sync-profile" },
        { name: "Top Systems", description: "Most-used platforms with this product.", bullets: ["Greenhouse", "Microsoft Teams", "Office 365", "BambooHR", "Workday", "Slack"], iconName: "organization" },
        { name: "Advanced Reporting", description: "Comprehensive analytics and channel notifications.", bullets: ["Advanced reporting", "Channel notifications", "Real-time insights"], iconName: "analytics-dashboard" },
        { name: "Coverage", description: "6+ integrations built to snap into your existing stack.", bullets: ["Real-time candidate sync", "Auto-generated meeting links", "Outlook calendar sync"], iconName: "verify-compliance" },
      ],
    },
    workflow: {
      badge: "Automated Scheduling Workflow",
      title: "From job posting to interview completion in minutes",
      subtitle: "Accelerate candidate screening without slowing down hiring.",
      steps: [
        { step: "1", title: "Job Posting Created", description: "Greenhouse job posting triggers Schedule Haigent", duration: "Instant", systems: ["Greenhouse", "Workday"] },
        { step: "2", title: "Candidate Application", description: "AI analyzes candidate profile and matches to job requirements", duration: "< 5 minutes", systems: ["Greenhouse", "BambooHR"] },
        { step: "3", title: "Interview Scheduling", description: "AI coordinates with hiring team and schedules optimal interview times", duration: "< 2 minutes", systems: ["Microsoft Teams", "Office 365", "Slack"] },
        { step: "4", title: "Meeting Setup", description: "Automatically creates Teams meeting with all participants", duration: "Instant", systems: ["Microsoft Teams", "Office 365"] },
        { step: "5", title: "Reminders & Follow-Ups", description: "Automated reminders and follow-up communications", duration: "Scheduled", systems: ["Email", "SMS", "Slack"] },
        { step: "6", title: "Feedback Collection", description: "Post-interview feedback collection and analysis", duration: "24 hours", systems: ["Greenhouse", "BambooHR", "Workday"] },
      ],
    },
    howItWorks: {
      badge: "How It Works",
      title: "How Schedule Haigent Works?",
      subtitle: "Seeing is believing. A demo is an interactive glimpse into how the orchestration of enterprise AI can change the way your HR functions. During your demo, you will:",
      items: [
        "See the automation in HR and how it will assist with candidate search, screening, interview scheduling, and onboarding.",
        "Discover how Haigent will allow you to cut the time-to-hiring by 50% and enable your business to get the top talent in a shorter period.",
        "Find out why talent Management automation can be better at workforce planning and employee engagement.",
        "Know the implications of a complete digitalization of any HR team in terms of efficiency, compliance and strategy. Learn about HR workflow automation systems that simplify administrative processes and enhance productivity.",
      ],
    },
    cta: {
      title: "Ready to Streamline Your Interview Scheduling?",
      subtitle: "Schedule Haigent is included in all our pricing plans. Choose the plan that fits your organization size.",
      primaryCta: { label: "Book Live Demo", href: "/demo" },
      secondaryCta: { label: "Hire Schedule Haigent Now", href: "/signup" },
    },
  },
  {
    slug: "sourcing-haigent",
    name: "Sourcing Haigent",
    color: "primary",
    seo: {
      metaTitle: "Sourcing Haigent: AI Agent Orchestration for HR Automation & Faster Hiring",
      metaDescription: "Sourcing Haigent utilizes the AI agent orchestration to enhance talent sourcing, reduce time-to-hire and make your digital HR team enterprise workflow-scale.",
      keywords: {
        primary: ["Haigent", "AI Agent Orchestration"],
        secondary: ["HR automation", "Reduce time-to-hire", "HR workflow automation tools", "Talent Management automation", "Digital HR Team", "Enterprise AI agent orchestration"],
      },
    },
    hero: {
      title: "Reduce Headhunter Fees by 50% with Smarter Hiring Solutions",
      subtitle: "Reduce the efforts by 50% to develop talent autonomously.",
      primaryCta: { label: "Watch Demo", href: "/demo" },
      secondaryCta: { label: "Book Live Demo", href: "/demo" },
      heroImage: "/models_images/Sourcing_Haigent.png",
      stats: [
        { label: "Qualified pipeline lift", value: "65%" },
        { label: "Outreach automation", value: "24/7" },
        { label: "Channels", value: "6+" },
        { label: "Time to shortlist", value: "<48h" },
      ],
    },
    introduction: {
      title: "Welcome to Sourcing Haigent: Intelligent Talent Discovery",
      description: "Get Haigent to coordinate an AI agent orchestration to accelerate talent acquisition. The modern competitive employment situation makes it difficult to find a suitable job applicant within a short period, as it is not a choice. Traditional sourcing is time-consuming, disjointed, and does not address passive talent. Sourcing Haigent provides enterprise AI agent orchestration, which transforms the front end of recruitment into an automated strategic asset.",
    },
    benefits: {
      badge: "Key Benefits",
      title: "Benefits of Automated Talent Sourcing with Haigent",
      subtitle: "Replacing your sourcing with AI-powered sourcing achieves tangible benefits to your HR functionality",
      items: [
        { name: "The 24/7 Passive Talent Engine", description: "While your team sleeps, Haigent is mapping professional networks and niche communities to find 'hidden' talent that hasn't even hit the job market yet.", bullets: ["Always-on sourcing", "Passive talent discovery", "Network mapping"], iconName: "talent-search" },
        { name: "Brand-Safe Engagement", description: "Our agents don't send generic templates. They craft personalized, data-driven outreach that reflects your company culture, ensuring high response rates and a premium candidate experience.", bullets: ["Personalized outreach", "Brand consistency", "High response rates"], iconName: "user-communication" },
        { name: "Reduce Time-to-Hire", description: "Incorporating sourcing into the overall recruitment process, Sourcing Haigent reduces the search duration for both the best talent and the process of turning search results into a hire by a considerable margin.", bullets: ["Faster hiring", "Streamlined process", "Quick shortlisting"], iconName: "checklist" },
        { name: "Boost Quality of Hire", description: "AI will surface opportunities that would otherwise be overlooked by traditional methods, expanding the talent pool and increasing your chances of finding the right fit.", bullets: ["Better candidates", "Expanded talent pool", "AI-driven matching"], iconName: "sync-profile" },
        { name: "Enhance Recruiter Productivity", description: "Your digital HR team will be able to work on strategic activities such as interviewing, candidate experience, and workforce planning, with routine sourcing processes automated.", bullets: ["Strategic focus", "Automated routine tasks", "Higher productivity"], iconName: "hr-office" },
        { name: "Perfect Staffing Plan", description: "Through enterprise AI agent orchestration, Sourcing Haigent is not just another tool, but a forecasting team for your staffing plan.", bullets: ["Staffing forecasting", "Strategic planning", "Competitive edge"], iconName: "organization" },
      ],
    },
    integrations: {
      badge: "Sourcing Integrations",
      title: "Integrate With Your Sourcing Stack",
      subtitle: "Connect your sourcing channels and CRMs.",
      items: [
        { name: "LinkedIn & Job Boards", description: "Pull profiles, jobs, and engagement data.", bullets: ["Profile enrichment", "Job sync", "Engagement tracking"], iconName: "talent-search" },
        { name: "CRM & ATS", description: "Sync candidates and status updates.", bullets: ["Two-way sync", "Duplicate detection", "Notes & tags"], iconName: "sync-profile" },
        { name: "Messaging", description: "Automated outreach across email and chat.", bullets: ["Sequenced outreach", "Email automation", "Chat integration"], iconName: "user-communication" },
        { name: "Top Systems", description: "Most-used platforms with this product.", bullets: ["LinkedIn & Job Boards", "CRM & ATS", "Messaging"], iconName: "organization" },
        { name: "Advanced Features", description: "Enhanced sourcing capabilities.", bullets: ["Profile enrichment", "Two-way sync", "Sequenced outreach"], iconName: "analytics-dashboard" },
        { name: "Coverage", description: "3+ integrations built to snap into your existing stack.", bullets: ["Sourcing channels", "CRM systems", "Communication tools"], iconName: "verify-compliance" },
      ],
    },
    workflow: {
      badge: "Automated Sourcing Workflow",
      title: "From role creation to engaged pipeline",
      subtitle: "Connecting open roles with ready-to-engage candidates.",
      steps: [
        { step: "1", title: "Role Intake", description: "Define role requirements and ideal candidate profiles.", duration: "10 minutes", systems: ["ATS", "CRM"] },
        { step: "2", title: "Channel Search", description: "AI searches boards, social, and internal pools.", duration: "< 30 minutes", systems: ["LinkedIn", "Job boards", "Internal DB"] },
        { step: "3", title: "Outreach", description: "Sequenced messaging with personalization.", duration: "Same day", systems: ["Email", "Chat"] },
        { step: "4", title: "Engagement", description: "Track replies, schedule screens, and qualify.", duration: "Ongoing", systems: ["CRM", "ATS"] },
      ],
    },
    howItWorks: {
      badge: "How It Works",
      title: "How Sourcing Haigent Works?",
      subtitle: "The future of recruiting is speed, quality and smartness.",
      items: [
        "Sourcing Haigent puts your organization at the leading edge of Talent Management automation, in that sourcing is no longer held up but developed into a competitive edge.",
        "Automating sourcing end-to-end with Haigent puts your recruiters in control, your talent pipeline in better health, and your organization in a decent position to be competing successfully with the best recruits in your industry.",
        "Harness the energy of the new HR automation and redesign the talent discovery and engagement processes.",
        "By sourcing, Haigent will put sourcing not as a responsive endeavour, but as a strategic competitive edge, allowing your HR to concentrate on what should be important to them, such as building relationships, culture building, and business expansion.",
      ],
    },
    cta: {
      title: "Ready to Boost Your Talent Pipeline?",
      subtitle: "Sourcing Haigent is not just a tool for recruitment, but also an AI assistant for recruitment. Using Haigent AI agent coordination, your organization is able to hire faster, reduce time-to-hire and ensure high-tier candidate traffic.",
      primaryCta: { label: "Book Live Demo", href: "/demo" },
      secondaryCta: { label: "Hire Sourcing Haigent Now", href: "/signup" },
    },
  },
  {
    slug: "reference-check-haigent",
    name: "Reference Check Haigent",
    color: "secondary",
    seo: {
      metaTitle: "Reference Check Haigent: Learn AI Agent Orchestration",
      metaDescription: "Explore automate reference checks with Haigent AI Agent Orchestration. Learn to reduce time-to-hire using secure HR automation and intelligent insights.",
      keywords: {
        primary: ["Haigent", "AI Agent Orchestration"],
        secondary: ["HR automation", "Reduce time-to-hire", "HR workflow automation tools", "Talent Management automation", "Digital HR Team", "Enterprise AI agent orchestration"],
      },
    },
    hero: {
      title: "Complete reference checks 70% faster",
      subtitle: "Complete reference checks 70% faster with automated insights to deliver more accurate, compliant data.",
      primaryCta: { label: "Watch Demo", href: "/demo" },
      secondaryCta: { label: "Book Live Demo", href: "/demo" },
      heroImage: "/models_images/Reference_Haigent.png",
      stats: [
        { label: "Faster completion", value: "70%" },
        { label: "Compliance coverage", value: "Global" },
        { label: "Response rate lift", value: "40%" },
        { label: "Turnaround time", value: "<24h" },
      ],
    },
    introduction: {
      title: "Introduction to Reference Check Haigent: Intelligent Validation for Smarter Hiring",
      description: "A resume is part of the story in this current talent market. It is verified performance, reliability, and cultural fit that count, and that is precisely what is being offered through Reference Check Haigent. This solution is built on Haigent AI agent orchestration, transforming reference checking into an automated HR process, delivering quicker, more certain recruitment results for the business.",
    },
    benefits: {
      badge: "Key Benefits",
      title: "Benefits of Automated Reference Checking with Haigent",
      subtitle: "Automating reference checks with Haigent has measurable improvements in HR operations. Key advantages include:",
      items: [
        { name: "Reduce Time-to-Hire", description: "Paper-based reference checks may take days or weeks to respond. Reference Check Haigent cuts this time by offering automated outreach and quick-response collection services that move offers to acceptance faster.", bullets: ["Faster responses", "Automated outreach", "Quick acceptance"], iconName: "talent-search" },
        { name: "Increase Hiring Confidence", description: "The results of standardized questionnaires and AI can enhance analyses, providing a structured, reliable feedback and giving decision-makers confidence in each new employee.", bullets: ["Standardized feedback", "AI-enhanced analysis", "Confident decisions"], iconName: "verify-compliance" },
        { name: "Enhance Candidate Experience", description: "Automated reference requests are formal and understandable, do not interfere with referees' time, and promote your employer brand and increase completion rates.", bullets: ["Formal requests", "Employer brand", "Higher completion rates"], iconName: "user-communication" },
        { name: "Boost HR Productivity", description: "The digital HR team will not use as much time to organize emails, monitor responses, and reconcile data, and may concentrate on strategic talent initiatives and engagement.", bullets: ["Less email tracking", "Strategic focus", "Higher engagement"], iconName: "hr-office" },
        { name: "Consistency & Compliance", description: "All reference checks are held accountable, equitable and uniform in standard templates and audit trails, minimizing bias and legal liability.", bullets: ["Standard templates", "Audit trails", "Minimized bias"], iconName: "organization" },
        { name: "Automation Plan for HR Team", description: "This integrated architecture will enable Reference Check Haigent to become an inseparable component of your HR automation plan, to be incorporated into the work of your digital HR team.", bullets: ["Integrated architecture", "HR automation plan", "Digital HR team"], iconName: "sync-profile" },
      ],
    },
    integrations: {
      badge: "Verification Integrations",
      title: "Integrate With Your HR Stack",
      subtitle: "Connect HRIS, ATS, and communication systems.",
      items: [
        { name: "HRIS/ATS", description: "Pull candidate data and push verification status.", bullets: ["Two-way sync", "Status updates", "Audit logs"], iconName: "sync-profile" },
        { name: "Messaging", description: "Multi-channel outreach for references.", bullets: ["Email + SMS", "Branded templates", "Reminder cadences"], iconName: "user-communication" },
        { name: "Storage", description: "Store responses and compliance docs.", bullets: ["Encrypted storage", "Compliance docs", "Secure access"], iconName: "verify-compliance" },
        { name: "Top Systems", description: "Most-used platforms with this product.", bullets: ["HRIS/ATS", "Messaging", "Storage"], iconName: "organization" },
        { name: "Advanced Features", description: "Enhanced verification capabilities.", bullets: ["Two-way sync", "Email + SMS", "Encrypted storage"], iconName: "analytics-dashboard" },
        { name: "Coverage", description: "3+ integrations built to snap into your existing stack.", bullets: ["HRIS systems", "Communication tools", "Secure storage"], iconName: "account-settings" },
      ],
    },
    workflow: {
      badge: "Automated Verification Workflow",
      title: "From reference request to verified report in under 24 hours",
      subtitle: "Reference checks completed faster, without compromising accuracy",
      steps: [
        { step: "1", title: "Reference Collection", description: "Candidate provides reference contacts through secure, branded portal.", duration: "< 5 min", systems: ["Candidate Portal", "ATS"] },
        { step: "2", title: "Automated Outreach", description: "Personalized requests sent via email and SMS with smart follow-up sequences.", duration: "Instant", systems: ["Email", "SMS", "WhatsApp"] },
        { step: "3", title: "Response Collection", description: "References complete structured questionnaires optimized for completion rates.", duration: "< 24h avg", systems: ["Survey Engine", "Analytics"] },
        { step: "4", title: "Report Generation", description: "AI compiles responses into comprehensive, compliance-ready reports.", duration: "Instant", systems: ["Report Builder", "ATS"] },
      ],
    },
    howItWorks: {
      badge: "How It Works",
      title: "How Reference Check Haigent Works",
      subtitle: "Reference Check Haigent is part of a wider set of HR workflow automation tools that are based on enterprise AI agent orchestration. It automatically manages the lifecycle of reference-checking, enabling HR professionals to focus on strategic initiatives.",
      items: [
        "Automated Reference Outreach: Reference Check Haigent automatically administers structured questionnaires to referees through personalized mobile-friendly messages once a candidate gets to the last step in your pipeline.",
        "Intelligent Response Collection: Feedback is gathered immediately and translated into unified forms. The platform records both quantitative reviews and qualitative reviews.",
        "Data-Driven Insight Generation: The system uses pattern recognition and natural language processing to process answers, including surface trends and strengths, and identify possible concerns.",
        "Seamless ATS & HRIS Integration: Reference Check Haigent is integrated with your ATS and HRIS, so approved information is transferred directly into candidate profiles and employment data.",
      ],
    },
    cta: {
      title: "Transform Your Reference Checking Today",
      subtitle: "The background checks do not need to be a time-consuming affair, but rather a plus. Reference Check Haigent uses the Haigent AI HR automation to automate one of the most manual and effective recruitment processes.",
      primaryCta: { label: "Book Live Demo", href: "/demo" },
      secondaryCta: { label: "Hire Reference Check Haigent Now", href: "/signup" },
    },
  },
  {
    slug: "onboarding-haigent",
    name: "Onboarding Haigent",
    color: "accent",
    seo: {
      metaTitle: "Onboarding Haigent: Haigent AI Agent Orchestration",
      metaDescription: "Learn employee onboarding with Haigent AI Agent Orchestration. Get Haigent to reduce time-to-hire, and get your digital HR team for workflow automation.",
      keywords: {
        primary: ["Haigent", "AI Agent Orchestration"],
        secondary: ["HR automation", "Reduce time-to-hire", "HR workflow automation tools", "Talent Management automation", "Digital HR Team", "Workflow Automation", "Enterprise AI agent orchestration"],
      },
    },
    hero: {
      title: "Reduce onboarding time by 60%",
      subtitle: "Reduce onboarding time by 60% and increase retention by 35% on the first day.",
      primaryCta: { label: "Watch Demo", href: "/demo" },
      secondaryCta: { label: "Book Live Demo", href: "/demo" },
      heroImage: "/models_images/Onboarding_Haigent.png",
      stats: [
        { label: "Reduction in onboarding time", value: "60%" },
        { label: "Increase in first-day retention", value: "35%" },
        { label: "Systems connected", value: "8+" },
        { label: "New hire satisfaction", value: "92%" },
      ],
    },
    introduction: {
      title: "Onboarding Haigent: Turn New Hires into Top Performers Faster",
      description: "The modern corporate world is rapidly moving. Employee onboarding is not just a job but an opportunity to tap talent, retain employees, and preposition new employees for success. Onboarding Haigent will be the AI-based Haigent automation of onboarding through intelligent, customized, and effective HR automation.",
    },
    benefits: {
      badge: "Key Benefits",
      title: "Benefits of Onboarding Haigent",
      subtitle: "Maximize the strategic value of every new hire with AI-powered onboarding automation.",
      items: [
        { name: "Accelerated Integration", description: "New hires reach productivity faster through personalized learning paths, scheduled check-ins, and automated task assignments that adapt to individual roles and departments.", bullets: ["Personalized learning", "Scheduled check-ins", "Adaptive task assignments"], iconName: "talent-search" },
        { name: "Enhanced Engagement from Day One", description: "A warm, structured onboarding experience boosts morale and connection. Automated introductions, team welcome messages, and clear first-week agendas set the tone for a positive tenure.", bullets: ["Team introductions", "Welcome messages", "Clear agendas"], iconName: "user-communication" },
        { name: "Reduced Administrative Workload", description: "HR teams no longer juggle spreadsheets, manual reminders, or follow-up emails. Automation handles document collection, compliance tracking, and system provisioning seamlessly.", bullets: ["No manual reminders", "Auto document collection", "Seamless provisioning"], iconName: "hr-office" },
        { name: "Standardized Compliance", description: "Ensure every new hire completes mandatory training, signs required documents, and meets regulatory requirements without manual oversight.", bullets: ["Mandatory training", "Document signing", "Regulatory compliance"], iconName: "verify-compliance" },
        { name: "Deeper Talent Management Insights", description: "Track onboarding milestones, identify bottlenecks, and measure time-to-productivity with real-time dashboards that inform continuous improvement.", bullets: ["Milestone tracking", "Bottleneck identification", "Real-time dashboards"], iconName: "analytics-dashboard" },
        { name: "Eliminate Day-1 Ghosting", description: "Proactive communication and engagement tools reduce no-shows and early attrition by keeping new hires informed and excited before their start date.", bullets: ["Proactive communication", "Reduced no-shows", "Pre-start engagement"], iconName: "sync-profile" },
      ],
    },
    integrations: {
      badge: "Onboarding Integrations",
      title: "Integrate With You HR Tech Stack",
      subtitle: "Connect HR, IT, and identity systems.",
      items: [
        { name: "HRIS", description: "Sync new hire data and status.", bullets: ["Data sync", "Status updates", "Compliance checks"], iconName: "sync-profile" },
        { name: "IT & Identity", description: "Provision accounts and access.", bullets: ["SSO provisioning", "License assignment", "Access reviews"], iconName: "account-settings" },
        { name: "Equipment", description: "Coordinate hardware requests.", bullets: ["Device requests", "Asset tracking", "Delivery coordination"], iconName: "hr-office" },
        { name: "Top Systems", description: "Most-used platforms with this product.", bullets: ["HRIS", "IT & Identity", "Equipment"], iconName: "organization" },
        { name: "Advanced Features", description: "Enhanced onboarding capabilities.", bullets: ["Data sync", "SSO provisioning", "Device requests"], iconName: "analytics-dashboard" },
        { name: "Coverage", description: "3+ integrations built to snap into your existing stack.", bullets: ["HR systems", "Identity management", "Equipment provisioning"], iconName: "verify-compliance" },
      ],
    },
    workflow: {
      badge: "Automated Onboarding Workflow",
      title: "From offer acceptance to productive team member",
      subtitle: "Everything new hires need to ramp up faster",
      steps: [
        { step: "1", title: "Pre-boarding Setup", description: "Automated tasks triggered on offer acceptance: paperwork, IT requests, equipment orders.", duration: "Day 0", systems: ["HRIS", "IT Ticketing", "Procurement"] },
        { step: "2", title: "Account Provisioning", description: "AI coordinates SSO setup, email creation, and system access across all platforms.", duration: "< 1 hour", systems: ["Okta", "Azure AD", "Google Workspace"] },
        { step: "3", title: "First Day Orchestration", description: "Personalized welcome sequence with scheduled introductions and training modules.", duration: "Day 1", systems: ["LMS", "Calendar", "Slack"] },
        { step: "4", title: "30-60-90 Day Check-ins", description: "Automated milestone tracking with manager alerts and feedback collection.", duration: "Ongoing", systems: ["HRIS", "Survey Tools", "Analytics"] },
      ],
    },
    howItWorks: {
      badge: "How It Works",
      title: "How Onboarding Haigent Works",
      subtitle: "Onboarding Haigent is your digital concierge, coordinating every step of the new-hire journey with the precision of an entire HR team.",
      items: [
        "Once a candidate has accepted an offer, Onboarding Haigent initiates workflows, sending personalized welcome messages, documents, introductions and next steps, enhancing the first impression and interaction.",
        "The platform will streamline the process of collecting necessary paperwork like tax filings, compliance, and contracts, with secure digital monitoring, reminders, and notification of completion.",
        "The AI agents take novice employees through orientation, training programs and job-specific needs. Reminders, resources, and progress checkpoints are delivered.",
        "Give your managers back their hours. Haigent handles training schedules and orientation, so managers can focus on 1-on-1 coaching.",
      ],
    },
    cta: {
      title: "Transform Onboarding: Start Today",
      subtitle: "Onboarding Haigent turns the first day into the first step toward long-term success. Reduce onboarding time, boost engagement, and retain top talent with AI-powered automation.",
      primaryCta: { label: "Book Live Demo", href: "/demo" },
      secondaryCta: { label: "Hire Onboarding Haigent Now", href: "/signup" },
    },
  },
  {
    slug: "benefits-haigent",
    name: "Benefits Haigent",
    color: "destructive",
    seo: {
      metaTitle: "Benefits of Haigent: AI Agent for HR Automation",
      metaDescription: "Discover the benefits of Haigent AI Agent Orchestration. Learn Automate HR workflows, reduce time-to-hire, and empower your digital HR team.",
      keywords: {
        primary: ["Haigent", "AI Agent Orchestration"],
        secondary: ["HR automation", "time-to-hire", "HR workflow automation tools", "Talent Management automation", "Digital HR Team", "Workflow Automation", "Enterprise AI agent orchestration"],
      },
    },
    hero: {
      title: "Reduce the administrative burden by 45%",
      subtitle: "Reduce the administrative burden by 45% with AI automation to get faster approvals.",
      primaryCta: { label: "Watch Demo", href: "/demo" },
      secondaryCta: { label: "Book Live Demo", href: "/demo" },
      heroImage: "/models_images/Benefits_Haigent.png",
      stats: [
        { label: "Administrative burden reduction", value: "45%" },
        { label: "Time-to-hire reduction", value: "50%" },
        { label: "Benefits coverage", value: "7+" },
        { label: "HR tech integrations", value: "Full stack" },
      ],
    },
    introduction: {
      title: "Why Choose Haigent: Transformative Benefits for Modern HR",
      description: "Haigent Agent Orchestration is a strategic competitive advantage to any organization dealing with the acquisition of talent and Management of the workforce. It unlocks the full potential of automation and provides HR teams with bright orchestration that delivers real, measurable outcomes.",
    },
    benefits: {
      badge: "Key Benefits",
      title: "Benefits of Haigent for HR",
      subtitle: "Unlock the full potential of automation with measurable outcomes across recruitment, onboarding, and workforce management.",
      items: [
        { name: "Accelerated Hiring & Reduced Time-to-Hire", description: "Streamlined recruitment workflows with built-in HR automation tools that automatically handle sourcing, screening, interviews and references.", bullets: ["Streamlined workflows", "Smarter matching", "50% faster hiring"], iconName: "talent-search" },
        { name: "HR Productivity Through Automation", description: "AI agents replace scheduling, candidate communication, onboarding management, and compliance checks.", bullets: ["Automated workflows", "Consistency & reliability", "Strategic focus"], iconName: "hr-office" },
        { name: "Empowered HR Professionals", description: "As workloads get automated, your digital HR team can focus on high-value functions such as culture building, employee engagement, and workforce planning.", bullets: ["Culture building", "Employee engagement", "Workforce planning"], iconName: "user-communication" },
        { name: "Talent Management Automation", description: "Holistic talent management that extends beyond recruitment. Automated workflows trigger onboarding milestones, training notifications, and performance check-ins.", bullets: ["Learning & development", "Performance check-ins", "Retention initiatives"], iconName: "organization" },
        { name: "Enterprise-Grade Architecture & Security", description: "Scalable, secure, and enterprise-ready orchestration framework. Enterprise-grade security with secure access controls, multi-factor authentication, encrypted handling, and audit trails.", bullets: ["Scalable architecture", "Comprehensive security", "Global compliance"], iconName: "verify-compliance" },
        { name: "ROI That Matters", description: "Automation saves time and spurs financial value. Experience significant decrease in hiring costs, administrative time, and time spent on regular tasks.", bullets: ["Reduced hiring costs", "Less admin time", "Full HR tech integration"], iconName: "analytics-dashboard" },
      ],
    },
    integrations: {
      badge: "Benefits Integrations",
      title: "Integrate with Your Benefits Ecosystem",
      subtitle: "Connect carriers, payroll, and HRIS.",
      items: [
        { name: "Carriers", description: "Sync enrollments and eligibility.", bullets: ["EDI feeds", "Eligibility rules", "Plan mapping"], iconName: "sync-profile" },
        { name: "Payroll", description: "Coordinate deductions and adjustments.", bullets: ["Deduction sync", "Retro adjustments", "Audit reports"], iconName: "hr-office" },
        { name: "Employee Self-Service", description: "Guide employees through enrollment.", bullets: ["Guided flows", "Plan comparison", "Decision support"], iconName: "user-communication" },
        { name: "Top Systems", description: "Most-used platforms with this product.", bullets: ["Carriers", "Payroll", "Employee self-service"], iconName: "organization" },
        { name: "Advanced Features", description: "Enhanced benefits capabilities.", bullets: ["EDI feeds", "Deduction sync", "Guided flows"], iconName: "analytics-dashboard" },
        { name: "Coverage", description: "3+ integrations built to snap into your existing stack.", bullets: ["Carrier systems", "Payroll platforms", "Self-service portals"], iconName: "verify-compliance" },
      ],
    },
    workflow: {
      badge: "Automated Benefits Workflow",
      title: "From open enrollment to carrier sync in one seamless flow",
      subtitle: "A unified benefits workflow from enrollment to carrier integration.",
      steps: [
        { step: "1", title: "Plan Configuration", description: "HR configures available plans, eligibility rules, and contribution structures.", duration: "Setup", systems: ["Benefits Admin", "Carrier Portals"] },
        { step: "2", title: "Employee Guidance", description: "AI-powered chatbot helps employees compare plans and make informed decisions.", duration: "Self-service", systems: ["Employee Portal", "Chat"] },
        { step: "3", title: "Enrollment Processing", description: "Elections validated against eligibility rules with real-time error checking.", duration: "Instant", systems: ["Rules Engine", "HRIS"] },
        { step: "4", title: "Carrier Transmission", description: "Approved enrollments automatically transmitted to carriers via EDI feeds.", duration: "< 24h", systems: ["EDI Gateway", "Carrier APIs"] },
      ],
    },
    howItWorks: {
      badge: "How It Works",
      title: "How Benefits Haigent Works",
      subtitle: "Haigent cuts it drastically by automating and orchestrating time-to-hire smartly.",
      items: [
        "Streamlined Recruitment Workflows: With built-in HR workflow automation tools, which automatically take care of sourcing a candidate group, screening, setting up an interview and verifying references.",
        "Smarter Candidate Matching: The agents are also precise in analyzing applications by matching candidate skills and job requirements.",
        "Real-Time Process Visibility: Automated dashboards provide HR leaders with immediate visibility into hiring status.",
        "Strategic Focus: Haigent saves your talent acquisition team time and effort by focusing on strategic engagement and cultural fit.",
      ],
    },
    cta: {
      title: "Ready to optimize benefits?",
      subtitle: "In addition to efficiencies, Haigent generates strategic value, altering the manner in which organizations deal with people.",
      primaryCta: { label: "Book Live Demo", href: "/demo" },
      secondaryCta: { label: "Hire Benefits Haigent Now", href: "/signup" },
    },
  },
  {
    slug: "payroll-haigent",
    name: "Payroll Haigent",
    color: "secondary",
    seo: {
      metaTitle: "Payroll Haigent: Haigent AI Agent Orchestration",
      metaDescription: "Automate payroll with Haigent AI Agent Orchestration. Reduce HR workload, and empower your digital HR team with enterprise-grade payroll automation.",
      keywords: {
        primary: ["Haigent", "AI Agent Orchestration"],
        secondary: ["HR automation", "time-to-hire", "HR workflow automation tools", "Digital HR Team", "Workflow Automation", "Enterprise AI agent orchestration"],
      },
    },
    hero: {
      title: "Run Payroll with 99.9% Accuracy",
      subtitle: "Reduce payroll efforts by 55% while minimizing errors to get accurate and compliant data syncs.",
      primaryCta: { label: "Watch Demo", href: "/demo" },
      secondaryCta: { label: "Book Live Demo", href: "/demo" },
      heroImage: "/models_images/Payroll_Haigent.png",
      stats: [
        { label: "Payroll effort reduction", value: "55%" },
        { label: "Compliance monitoring", value: "Real-time" },
        { label: "Data accuracy", value: "Enterprise-grade" },
        { label: "HR tech integrations", value: "Full stack" },
      ],
    },
    introduction: {
      title: "Payroll Haigent: Intelligent Payroll Automation for Modern Workforces",
      description: "One of the most complex yet essential tasks in HR is managing payroll. It is done through salary calculations, deductions, tax compliance, and late payments. Haigent agent orchestration drives Payroll Haigent to simplify payroll. It is made reliable, efficient, and automated.",
    },
    benefits: {
      badge: "key benefits",
      title: "Key Benefits of Payroll Haigent",
      subtitle: "Payroll Haigent provides you with a wide range of benefits that empower HR processes and facilitate the success of organisations.",
      items: [
        { name: "Eliminate Manual Administrative Work", description: "No more repetitive steps. Your digital HR department will be able to focus its efforts on workforce planning, employee engagement, and other high-value activities.", bullets: ["No repetitive steps", "Workforce planning", "High-value focus"], iconName: "hr-office" },
        { name: "Ensure Accuracy & Compliance", description: "Enterprise AI agent orchestration will maintain calculations, tax regulations, and compliance accuracy, safeguarding you against financial fines.", bullets: ["Accurate calculations", "Tax compliance", "Financial protection"], iconName: "verify-compliance" },
        { name: "Reduce Processing Time", description: "Automated workflows reduce the time spent on payroll cycles, helping you minimise time-to-hire and expedite employee preparation.", bullets: ["Faster cycles", "Reduced time-to-hire", "Quick preparation"], iconName: "talent-search" },
        { name: "Enhance Security & Transparency", description: "Flexibility in encrypted data management, role-based access, and audit trails provides you with peace of mind and an understanding of payroll company operations.", bullets: ["Encrypted data", "Role-based access", "Audit trails"], iconName: "account-settings" },
        { name: "Improve Employee Satisfaction", description: "Payslips are received on time, which helps build morale and trust. The experience is also augmented with automated communication and self-service.", bullets: ["On-time payslips", "Build morale", "Self-service"], iconName: "user-communication" },
        { name: "Automated Reporting & Audit Trails", description: "Pay statements, audit logs, and compliance reports are automatically prepared, stored safely, and provided to stakeholders.", bullets: ["Auto reports", "Secure storage", "Easy analysis"], iconName: "analytics-dashboard" },
      ],
    },
    integrations: {
      badge: "Payroll integrations",
      title: "Integrate with your payroll ecosystem",
      subtitle: "Connect HRIS, time tracking, and finance.",
      items: [
        { name: "Time & Attendance", description: "Sync hours, PTO, and approvals.", bullets: ["Real-time sync", "Approvals", "Audit logs"], iconName: "checklist" },
        { name: "HRIS & Benefits", description: "Align deductions and employee data.", bullets: ["Deduction sync", "Eligibility checks", "Status updates"], iconName: "sync-profile" },
        { name: "Finance & GL", description: "Post payroll entries automatically.", bullets: ["Journal entries", "Cost allocation", "Period close"], iconName: "analytics-dashboard" },
        { name: "Top Systems", description: "Most-used platforms with this product.", bullets: ["Time & attendance", "HRIS & Benefits", "Finance & GL"], iconName: "organization" },
        { name: "Advanced Features", description: "Enhanced payroll capabilities.", bullets: ["Real-time sync", "Deduction sync", "Journal entries"], iconName: "hr-office" },
        { name: "Coverage", description: "3+ integrations built to snap into your existing stack.", bullets: ["Time tracking", "HR systems", "Finance platforms"], iconName: "verify-compliance" },
      ],
    },
    workflow: {
      badge: "Automated Payroll Workflow",
      title: "From time entry to payday with 99.9% accuracy",
      subtitle: "Accurate payroll, from clock-in to cash.",
      steps: [
        { step: "1", title: "Time Collection", description: "Hours, PTO, and adjustments automatically pulled from time tracking systems.", duration: "Real-time", systems: ["Time & Attendance", "HRIS"] },
        { step: "2", title: "Calculation Engine", description: "AI calculates gross pay, taxes, deductions, and garnishments with compliance validation.", duration: "< 1 min", systems: ["Payroll Engine", "Tax Tables"] },
        { step: "3", title: "Exception Handling", description: "Anomalies flagged for review with smart suggestions for resolution.", duration: "As needed", systems: ["Alerts", "Approval Workflow"] },
        { step: "4", title: "Payment & Filing", description: "Direct deposits initiated, tax filings submitted, and GL entries posted automatically.", duration: "On schedule", systems: ["Banking", "Tax Agencies", "GL"] },
      ],
    },
    howItWorks: {
      badge: "How It Works",
      title: "How Payroll Haigent Works",
      subtitle: "Payroll Haigent automates a manual process with high error density into intelligent automation.",
      items: [
        "AI-Driven Data Integration: It draws data on your HR systems' work hours, attendance, leave, allowances, bonuses, deductions, etc., via secure integrations with HRIS, timekeeping software, and workforce tools.",
        "Automated Payroll Calculations: Rules and compliance logic compute gross payment, net payment, taxes and benefits, statutory contribution and adjustments.",
        "Compliance & Tax Engine: The platform monitors changes in tax and statutory laws and adjusts calculations to ensure your safety.",
        "Secure Pay Runs & Disbursements: Payrolls are accurate and safe. The system manages batch processes, exceptions, split schedules, and transfers directly into employees' accounts.",
      ],
    },
    cta: {
      title: "Transform Your Payroll Today",
      subtitle: "Payroll must be consistent, correct, and automated. Payroll Haigent, powered by Haigent AI Agent Orchestration, provides a solution that reduces manual labour, improves compliance, and facilitates strategic Human resource functions.",
      primaryCta: { label: "Book Live Demo", href: "/demo" },
      secondaryCta: { label: "Hire Payroll Haigent Now", href: "/signup" },
    },
  },
  {
    slug: "engee-haigent",
    name: "Engee Haigent",
    color: "accent",
    seo: {
      metaTitle: "Engee Employee Engagement | AI Agent Orchestration by Haigent",
      metaDescription: "Engee by Haigent is an AI-based tool that improves engagement, reduces turnover, it boosts and automates human resources on a large scale.",
      keywords: {
        primary: ["Haigent", "AI Agent Orchestration"],
        secondary: ["HR automation", "time-to-hire", "HR workflow automation tools", "Digital HR Team", "Workflow Automation", "Enterprise AI agent orchestration"],
      },
    },
    hero: {
      title: "Build stronger employee connections 60% faster",
      subtitle: "Transform employee engagement into a self-generative system with AI Agent Orchestration",
      primaryCta: { label: "Watch Demo", href: "/demo" },
      secondaryCta: { label: "Book Live Demo", href: "/demo" },
      heroImage: "/models_images/Engee_Haigent.png",
      stats: [
        { label: "Employee engagement increase", value: "45%" },
        { label: "Voluntary turnover reduction", value: "30%" },
        { label: "Faster connections", value: "60%" },
        { label: "Coordination time saved", value: "70%" },
      ],
    },
    introduction: {
      title: "ENGEE Employee Engagement Haigent",
      description: "Contemporary organizations are spending a lot of money on talent recruitment, but they continue to struggle in engaging, uniting, and retaining employees across their teams. ENGEE applies AI Agent Orchestration to build stronger workplace relationships without adding pressure to HR teams.",
    },
    benefits: {
      badge: "Key Benefits",
      title: "Transform Your Workforce Engagement",
      subtitle: "ENGEE provides a wide range of benefits that transform how organizations engage and retain their workforce.",
      items: [
        { name: "Increase Employee Engagement by 45%", description: "Due to the sustained interest-based interactions, Engee is of significant value in enhancing interactions and a sense of belonging between teams.", bullets: ["Interest-based interactions", "Sense of belonging", "Enhanced teamwork"], iconName: "user-communication" },
        { name: "Reduce Voluntary Turnover by 30%", description: "Better interventional relationships and mentorship minimize seclusion, which is the most significant cause of attrition, and is preventable.", bullets: ["Better relationships", "Mentorship programs", "Reduced attrition"], iconName: "talent-search" },
        { name: "Break Down Organizational Silos", description: "ENGEE links employees across different departments and locations, fostering cross-functional collaboration and innovation.", bullets: ["Cross-department links", "Cross-functional collaboration", "Innovation"], iconName: "organization" },
        { name: "Accelerate New-Hire Integration", description: "Automated group invites and 1-on-1s accelerate new employees' onboarding, helping them become 50% more productive.", bullets: ["Automated invites", "1-on-1 meetings", "50% faster productivity"], iconName: "hr-office" },
        { name: "Save HR Time with Automation", description: "As an HR automation system, Engee operates around the clock and requires no manual coordination, leaving the HR teams to focus on strategic efforts.", bullets: ["24/7 operation", "No manual coordination", "Strategic focus"], iconName: "sync-profile" },
        { name: "Data-Driven Engagement Visibility", description: "HR leaders obtain real-time data about the engagement health, connection gaps and participation trends at the organization.", bullets: ["Real-time data", "Connection gaps", "Participation trends"], iconName: "analytics-dashboard" },
      ],
    },
    integrations: {
      badge: "Seamless Integrations",
      title: "Integrate with Your HR Ecosystem",
      subtitle: "Engee integrates seamlessly with your existing collaboration tools and HR systems.",
      items: [
        { name: "Microsoft Teams Native Experience", description: "Engee integrates directly with Microsoft Teams, maintaining a high adoption rate without training employees to use new platforms.", bullets: ["Direct integration", "High adoption", "No training needed"], iconName: "user-communication" },
        { name: "Calendar & Scheduling Systems", description: "The AI will connect with enterprise calendar and will automatically schedule meetings while respecting time zones and availability.", bullets: ["Auto scheduling", "Time zone aware", "Availability check"], iconName: "checklist" },
        { name: "HR Workflow Automation Tools", description: "Engee is not a replacement for your Digital HR team; it is rather a complement to the current HR workflow automation tools.", bullets: ["Complement to HR", "Workflow integration", "Enhanced automation"], iconName: "hr-office" },
        { name: "Enterprise-Ready AI Infrastructure", description: "Built at scale, Engee uses enterprise AI agent orchestration to execute safely and reliably in large organizations.", bullets: ["Enterprise scale", "Safe execution", "Reliable performance"], iconName: "verify-compliance" },
      ],
    },
    workflow: {
      badge: "Automated Engagement Workflow",
      title: "From Onboarding to Continue Engagement",
      subtitle: "From onboarding to continuous engagement with AI-powered connections",
      steps: [
        { step: "1", title: "Smart Profile Setup", description: "New employees complete a brief profile survey revealing interests, work preferences, values, and aspirations.", duration: "Day 1", systems: ["Microsoft Teams", "HRIS"] },
        { step: "2", title: "AI Interest Mapping", description: "AI identifies common interests, learning objectives, and social compatibility across the organization.", duration: "Instant", systems: ["AI Engine", "Employee Profiles"] },
        { step: "3", title: "Automated Scheduling", description: "AI agent automatically identifies available time slots and sets up 1-on-1 meetups in calendars.", duration: "< 5 min", systems: ["Calendar", "Teams"] },
        { step: "4", title: "Continuous Engagement", description: "Weekly curated content, polls, and discussion prompts keep teams engaged with intelligent re-engagement alerts.", duration: "Ongoing", systems: ["Teams Groups", "Analytics"] },
      ],
    },
    howItWorks: {
      badge: "How It Works",
      title: "Sustain Engagement At Every Step",
      subtitle: "Engee sustains engagement at every step through intelligent automation.",
      items: [
        "Smart Employee Onboarding: Engee uses an AI facility to onboard new employees on day one. Upon joining, employees are given a brief, smart profile survey that reveals them, their interests, work preferences, values, and aspirations.",
        "AI-Powered Interest Mapping: Using sophisticated AI Agent Orchestration, Engee can use employee profiles to identify common interests, learning objectives, and social compatibility.",
        "Automated 1-on-1 Scheduling: Engee eradicates scheduling friction. The AI agent automatically identifies available time slots that match and sets up 1-on-1 meetups in employees' online calendars.",
        "Continuous Engagement Intelligence: Engee maintains activity with weekly curated content, weekly polls and discussion prompts in Teams groups.",
      ],
    },
    cta: {
      title: "Transform Employee Engagement Today",
      subtitle: "Manual programs, spreadsheets and occasional initiatives cannot rely on to engage employees. Engee by Haigent makes engagement automated, measurable and scalable.",
      primaryCta: { label: "Book Live Demo", href: "/demo" },
      secondaryCta: { label: "Hire Engee Haigent Now", href: "/signup" },
    },
  },
];
