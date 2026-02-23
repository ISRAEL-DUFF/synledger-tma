import { ReactNode } from "react";
import { DashboardLayout } from "./layout/DashboardLayout";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: ReactNode;
  hideNav?: boolean;
}

export function PageLayout({ 
  children, 
  title, 
  showBack = false, 
  onBack,
  rightAction,
  hideNav = false 
}: PageLayoutProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <DashboardLayout title={title}>
      <div className="space-y-6">
        {/* Page Header with back button for inner pages */}
        {(showBack || rightAction) && (
          <div className="flex items-center justify-between">
            {showBack ? (
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Back</span>
              </button>
            ) : (
              <div />
            )}
            {rightAction && <div>{rightAction}</div>}
          </div>
        )}
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {children}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
