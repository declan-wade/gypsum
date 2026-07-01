import { PageLayout } from "@/components/page-layout";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/server";
import { NotificationSettingsForm } from "./forms";

export default async function Page() {
  const userId = await getCurrentUserId();
  const settings = userId
    ? await prisma.notificationSettings.findUnique({ where: { userId } })
    : null;

  return (
    <PageLayout title="Notifications">
      <div className="mx-auto w-full max-w-2xl rounded-lg border bg-background p-6">
        <h2 className="mb-1 text-lg font-medium">Email notifications</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Choose which emails you&apos;d like to receive.
        </p>
        <NotificationSettingsForm
          record={{
            taskAssigned: settings?.taskAssigned ?? true,
            taskDueSoon: settings?.taskDueSoon ?? true,
            invoiceSent: settings?.invoiceSent ?? true,
            invoiceOverdue: settings?.invoiceOverdue ?? true,
          }}
        />
      </div>
    </PageLayout>
  );
}
