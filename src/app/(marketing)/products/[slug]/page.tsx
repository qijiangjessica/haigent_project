import { notFound } from "next/navigation";
import { Metadata } from "next";
import { products } from "@/data/products";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HeroWithMockup } from "@/components/hero-with-mockup";
import { ProductIntroduction } from "@/components/ProductIntroduction";
import { ProductHowItWorks } from "@/components/ProductHowItWorks";
import { ProductBenefits } from "@/components/ProductBenefits";
import { ProductCta } from "@/components/ProductCta";
import ProductIntegrations from "@/components/ProductIntegrations";
import ProductWorkflows from "@/components/ProductWorkflows";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) return { title: "Product Not Found | Haigent.ai" };
  return {
    title: product.seo.metaTitle,
    description: product.seo.metaDescription,
    keywords: [...product.seo.keywords.primary, ...product.seo.keywords.secondary],
    openGraph: {
      title: product.seo.metaTitle,
      description: product.seo.metaDescription,
      type: "website",
      url: `https://haigent.ai/products/${slug}`,
      siteName: "Haigent.ai",
    },
    twitter: {
      card: "summary_large_image",
      title: product.seo.metaTitle,
      description: product.seo.metaDescription,
    },
    alternates: { canonical: `https://haigent.ai/products/${slug}` },
  };
}

type ColorType = "destructive" | "primary" | "secondary" | "accent" | "muted";

function getColorClasses(color: ColorType) {
  const colorMap = {
    destructive: { bg: "bg-destructive", text: "text-destructive", textForeground: "text-destructive-foreground", bgLight: "bg-destructive/10", border: "border-destructive", hover: "hover:bg-destructive/90", hoverBorder: "hover:border-destructive/50" },
    primary: { bg: "bg-primary", text: "text-primary", textForeground: "text-primary-foreground", bgLight: "bg-primary/10", border: "border-primary", hover: "hover:bg-primary/90", hoverBorder: "hover:border-primary/50" },
    secondary: { bg: "bg-secondary", text: "text-secondary", textForeground: "text-secondary-foreground", bgLight: "bg-secondary/10", border: "border-secondary", hover: "hover:bg-secondary/90", hoverBorder: "hover:border-secondary/50" },
    accent: { bg: "bg-accent", text: "text-accent", textForeground: "text-accent-foreground", bgLight: "bg-accent/10", border: "border-accent", hover: "hover:bg-accent/90", hoverBorder: "hover:border-accent/50" },
    muted: { bg: "bg-muted", text: "text-muted-foreground", textForeground: "text-foreground", bgLight: "bg-muted/10", border: "border-muted", hover: "hover:bg-muted/90", hoverBorder: "hover:border-muted/50" },
  };
  return colorMap[color];
}

function getPrimaryCtaColor(slug: string): ColorType {
  switch (slug) {
    case "schedule-haigent": return "destructive";
    case "sourcing-haigent": return "primary";
    case "reference-check-haigent": return "secondary";
    case "onboarding-haigent": return "accent";
    case "benefits-haigent": return "destructive";
    case "payroll-haigent": return "secondary";
    case "engee-haigent": return "accent";
    default: return "destructive";
  }
}

function getSecondaryCtaColor(slug: string): ColorType {
  switch (slug) {
    case "schedule-haigent": return "secondary";
    case "sourcing-haigent": return "destructive";
    case "reference-check-haigent": return "destructive";
    case "onboarding-haigent": return "destructive";
    case "benefits-haigent": return "primary";
    case "payroll-haigent": return "primary";
    case "engee-haigent": return "primary";
    default: return "destructive";
  }
}

function getGlowColor(color: ColorType): string {
  const glowColors = { destructive: "#e35b6d", primary: "#f3cf63", secondary: "#19a9b6", accent: "#9abf45", muted: "#232323" };
  return glowColors[color];
}

function getAnimationPath(slug: string): string {
  switch (slug) {
    case "schedule-haigent": return "/animations/1/One Hand Fly.mp4";
    case "sourcing-haigent": return "/animations/2/One Hand Fly.mp4";
    case "reference-check-haigent": return "/animations/3/One Hand Fly.mp4";
    case "onboarding-haigent": return "/animations/4/One Hand Fly.mp4";
    case "benefits-haigent": return "/animations/5/One Hand Fly.mp4";
    case "payroll-haigent": return "/animations/6/Fly.mp4";
    case "engee-haigent": return "/animations/7/Fly.mp4";
    default: return "/animations/1/One Hand Fly.mp4";
  }
}

function getMockupImage(productName: string) {
  const images = [
    { src: "/hero_image.png", alt: `${productName} interface`, width: 1200, height: 800 },
    { src: "/hero_image_2.png", alt: `${productName} dashboard`, width: 1200, height: 800 },
    { src: "/hero_image_3.png", alt: `${productName} analytics`, width: 1200, height: 800 },
    { src: "/hero_image_4.png", alt: `${productName} insights`, width: 1200, height: 800 },
  ];
  const index = Math.abs(productName.length) % images.length;
  return images[index];
}

function Section({ color = "muted-foreground", badge, title, subtitle, children }: {
  color?: string;
  badge?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-10 sm:py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-3 text-center max-w-3xl mx-auto">
          {badge && <p className={`text-xs font-semibold tracking-[0.2em] uppercase text-${color} mb-3`}>{badge}</p>}
          <h2 className="text-2xl sm:text-3xl font-bold uppercase">{title}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const { hero, introduction, benefits, integrations, workflow, howItWorks, cta, name, color } = product!;
  const colors = getColorClasses(color);
  const primaryCtaColor = getPrimaryCtaColor(slug);
  const secondaryCtaColor = getSecondaryCtaColor(slug);
  const animationPath = getAnimationPath(slug);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <HeroWithMockup
        label={name}
        title={hero.title}
        subtitle={hero.subtitle}
        primaryCta={{ text: hero.primaryCta.label, href: hero.primaryCta.href }}
        secondaryCta={hero.secondaryCta ? { text: hero.secondaryCta.label, href: hero.secondaryCta.href } : undefined}
        heroImage={hero.heroImage}
        mockupImage={!hero.heroImage ? getMockupImage(name) : undefined}
        className="bg-linear-to-b from-primary/5 via-background to-background"
        labelColor={color}
        primaryButtonColor={primaryCtaColor}
        secondaryButtonColor={secondaryCtaColor}
        glowColor={getGlowColor(color)}
      />

      <div className="py-8 sm:py-12 md:py-16">
        <ProductIntroduction title={introduction.title} description={introduction.description} color={color} />
      </div>

      <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {hero.stats.map((stat) => (
            <Card key={stat.label} className="border-border/60 bg-card/80 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-2">
                <p className={`text-2xl sm:text-3xl font-bold ${colors.text}`}>{stat.value}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs sm:text-sm text-muted-foreground leading-snug">{stat.label}</p>
                {stat.description && <p className="mt-1 text-xs text-muted-foreground/80">{stat.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <ProductHowItWorks
        badge={howItWorks.badge}
        title={howItWorks.title}
        subtitle={howItWorks.subtitle}
        items={howItWorks.items}
        color={secondaryCtaColor}
        secondaryColor={secondaryCtaColor}
      />

      <ProductBenefits
        badge={benefits.badge}
        title={benefits.title}
        subtitle={benefits.subtitle}
        items={benefits.items}
        color={color}
        secondaryColor={secondaryCtaColor}
        animationPath={animationPath}
        productName={name}
      />

      <Section title={integrations.title} subtitle={integrations.subtitle} badge={integrations.badge} color={color}>
        <ProductIntegrations
          integrations={integrations}
          colors={{ hoverBorder: colors.hoverBorder }}
        />
      </Section>

      <Section title={workflow.title} subtitle={workflow.subtitle} badge={workflow.badge} color={color}>
        <ProductWorkflows
          workflow={workflow}
          colors={{ hoverBorder: colors.hoverBorder, bg: colors.bg, bgLight: colors.bgLight, text: colors.text, textForeground: colors.textForeground }}
        />
      </Section>

      <ProductCta
        title={cta.title}
        subtitle={cta.subtitle}
        primaryCta={cta.primaryCta}
        secondaryCta={cta.secondaryCta}
        primaryButtonColor={primaryCtaColor}
        secondaryButtonColor={secondaryCtaColor}
      />
    </main>
  );
}
