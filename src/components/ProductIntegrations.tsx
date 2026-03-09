import { SvgIcon } from "./ui/svg-icon";

type IntegrationItem = {
  name: string;
  description: string;
  bullets: string[];
};

type ProductIntegrationsProps = {
  integrations: {
    items: IntegrationItem[];
  };
  colors: {
    hoverBorder: string;
  };
};

const iconNames = ["hr-office", "account-settings", "organization"] as const;

const ProductIntegrations: React.FC<ProductIntegrationsProps> = ({ integrations, colors }) => {
  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
      {integrations.items.map((integration, idx) => {
        const iconName = iconNames[idx % iconNames.length];
        return (
          <div
            key={integration.name}
            className={`relative overflow-hidden rounded-lg bg-card/70 p-6 transition
              shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]
              border-gray-300 dark:border-none ${colors.hoverBorder}`}
          >
            <SvgIcon name={iconName} size={24} alt={integration.name} className="mb-4" />
            <h3 className="mt-1 text-sm md:text-base">{integration.name}</h3>
            <p className="relative z-2 mt-2 text-xs font-light text-muted-foreground">
              {integration.description} {integration.bullets.join(" · ")}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default ProductIntegrations;
