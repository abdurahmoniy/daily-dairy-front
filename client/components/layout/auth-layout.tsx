import { Milk } from "lucide-react";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-2xl">
              <Milk className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">DailyDairy</h1>
          <h2 className="text-xl font-semibold text-foreground mb-1">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="bg-card rounded-3xl shadow-xl border p-8">
          {children}
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            © 2025 DailyDairy. Modern dairy management solution.
          </p>
        </div>
      </div>
    </div>
  );
}
