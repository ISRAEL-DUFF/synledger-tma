import { motion } from "framer-motion";
import { PageLayout } from "@/components/PageLayout";
import { 
  Banknote, 
  Smartphone, 
  Receipt, 
  ArrowDownLeft,
  Globe,
  FileText,
  Store,
  Zap,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

interface ServiceItem {
  id: string;
  label: string;
  description: string;
  icon: typeof Banknote;
  path: string;
  gradient: string;
  comingSoon?: boolean;
}

interface ServiceCategory {
  id: string;
  title: string;
  services: ServiceItem[];
}

const serviceCategories: ServiceCategory[] = [
  {
    id: "send-money",
    title: "Send Money",
    services: [
      {
        id: "pay-vendor",
        label: "Pay Vendor",
        description: "Send to bank accounts",
        icon: Banknote,
        path: "/pay-vendor",
        gradient: "from-primary to-primary/80",
      },
      {
        id: "remittance",
        label: "Diaspora Remittance",
        description: "Send money to Nigeria",
        icon: Globe,
        path: "/remittance",
        gradient: "from-accent to-accent/80",
      },
    ],
  },
  {
    id: "pay-bills",
    title: "Bills & Utilities",
    services: [
      {
        id: "buy-airtime",
        label: "Buy Airtime",
        description: "Mobile top-up",
        icon: Smartphone,
        path: "/buy-airtime",
        gradient: "from-warning to-warning/80",
      },
      {
        id: "pay-bills",
        label: "Pay Bills",
        description: "Utilities & subscriptions",
        icon: Receipt,
        path: "/pay-bills",
        gradient: "from-pending to-pending/80",
      },
    ],
  },
  {
    id: "receive-money",
    title: "Receive Money",
    services: [
      {
        id: "deposit",
        label: "Deposit Crypto",
        description: "Fund your wallet",
        icon: ArrowDownLeft,
        path: "/deposit",
        gradient: "from-success to-success/80",
      },
      {
        id: "invoices",
        label: "Invoices",
        description: "Create & track invoices",
        icon: FileText,
        path: "/invoices",
        gradient: "from-chart-2 to-chart-2/80",
      },
    ],
  },
  {
    id: "business",
    title: "Business Tools",
    services: [
      {
        id: "merchant",
        label: "Accept Payments",
        description: "Merchant payment links",
        icon: Store,
        path: "/merchant",
        gradient: "from-chart-3 to-chart-3/80",
        comingSoon: true,
      },
      {
        id: "instant-pay",
        label: "Instant Pay",
        description: "Quick payment requests",
        icon: Zap,
        path: "/instant-pay",
        gradient: "from-chart-4 to-chart-4/80",
        comingSoon: true,
      },
    ],
  },
];

export default function Services() {
  const navigate = useNavigate();

  return (
    <PageLayout title="Services">
      <div className="py-6 space-y-8">
        {serviceCategories.map((category, categoryIndex) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: categoryIndex * 0.1 }}
          >
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              {category.title}
            </h2>
            {/* Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {category.services.map((service, serviceIndex) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: categoryIndex * 0.1 + serviceIndex * 0.05 }}
                >
                  <Card
                    variant="elevated"
                    className={`p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] h-full ${
                      service.comingSoon ? "opacity-60" : ""
                    }`}
                    onClick={() => !service.comingSoon && navigate(service.path)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-card shrink-0`}
                      >
                        <service.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground truncate">
                            {service.label}
                          </span>
                          {service.comingSoon && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                              Soon
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {service.description}
                        </span>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 hidden sm:block" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </PageLayout>
  );
}
