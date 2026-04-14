import { Card, CardContent } from "@/components/ui/card";

type WorkflowStep = {
  step: number | string;
  title: string;
  duration: string;
  description: string;
  systems: string[];
};

type ProductWorkflowsProps = {
  workflow: {
    steps: WorkflowStep[];
  };
  colors: {
    hoverBorder: string;
    bg: string;
    bgLight: string;
    text: string;
    textForeground: string;
  };
};

const ProductWorkflows: React.FC<ProductWorkflowsProps> = ({ workflow, colors }) => {
  return (
    <div className="grid gap-4">
      {workflow.steps.map((step) => (
        <Card key={step.step} className={`border-gray-400/80 bg-gray-300/80 ${colors.hoverBorder} transition-colors`}>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-6">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colors.bg} ${colors.textForeground} font-semibold`}>
              {step.step}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-lg font-semibold">{step.title}</h4>
                <span className={`rounded-full ${colors.bgLight} px-3 py-1 text-xs font-medium ${colors.text}`}>
                  {step.duration}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{step.description}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                {step.systems.map((system) => (
                  <span key={system} className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-foreground">
                    {system}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductWorkflows;
