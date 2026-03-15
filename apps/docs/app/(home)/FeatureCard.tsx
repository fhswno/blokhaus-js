// REACT
import type { ReactNode } from "react";

// TYPESCRIPT
type Props = {
  title: string;
  description: string;
  icon?: ReactNode;
};

const FeatureCard = ({ title, description, icon }: Props) => {
  return (
    <div className="group rounded-lg border border-fd-border bg-fd-card p-5 transition-all hover:border-fd-primary/50 hover:shadow-lg hover:shadow-fd-primary/5">
      {icon && (
        <div className="mb-3 text-fd-muted-foreground transition-colors group-hover:text-fd-primary">
          {icon}
        </div>
      )}
      <h3 className="mb-1.5 text-sm font-semibold text-fd-foreground">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-fd-muted-foreground">
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;
