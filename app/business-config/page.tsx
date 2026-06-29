import { PageLayout } from "@/components/page-layout";
import { prisma } from "@/lib/prisma";
import { BusinessConfigForm } from "./forms";

export default async function Page() {
  const config = await prisma.businessConfig.findFirst();

  return (
    <PageLayout title="Business Config">
      <div className="mx-auto w-full max-w-3xl rounded-lg border bg-background p-6">
        <BusinessConfigForm record={config ?? undefined} />
      </div>
    </PageLayout>
  );
}
