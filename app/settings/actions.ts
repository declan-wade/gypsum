"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/server";

export interface NotificationSettingsInput {
  taskAssigned: boolean;
  taskDueSoon: boolean;
  invoiceSent: boolean;
  invoiceOverdue: boolean;
}

export async function updateNotificationSettings(data: NotificationSettingsInput) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("You must be signed in to update notification settings.");
  }

  return prisma.notificationSettings.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}
