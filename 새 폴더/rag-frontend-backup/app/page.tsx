import { Sidebar } from "@/components/sidebar";
import { MarketplaceTopbar } from "@/components/marketplace-topbar";
import { MarketplaceFilters } from "@/components/marketplace-filters";
import { MarketplaceSummary } from "@/components/marketplace-summary";
import { MarketplaceResults } from "@/components/marketplace-results";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64">
        <MarketplaceTopbar />
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <MarketplaceFilters />
            <MarketplaceSummary />
            <MarketplaceResults />
          </div>
        </main>
      </div>
    </div>
  );
}
