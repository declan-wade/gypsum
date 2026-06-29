"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function createContact(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  companyId: string;
}) {
  const contact = await prisma.contact.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      jobTitle: data.jobTitle,
      companyId: data.companyId,
    },
  });
  await logActivity({
    entityType: "Contact",
    entityId: contact.id,
    action: "CREATED",
    summary: `Created contact ${contact.firstName} ${contact.lastName}`,
  });
}

export async function updateContact(
  id: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    jobTitle: string;
    companyId: string;
  }
) {
  const contact = await prisma.contact.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      jobTitle: data.jobTitle,
      companyId: data.companyId,
    },
  });
  await logActivity({
    entityType: "Contact",
    entityId: id,
    action: "UPDATED",
    summary: `Updated contact ${contact.firstName} ${contact.lastName}`,
  });
}
