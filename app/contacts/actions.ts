"use server";

import { prisma } from "@/lib/prisma";

export async function createContact(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  companyId: string;
}) {
  await prisma.contact.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      jobTitle: data.jobTitle,
      companyId: data.companyId,
    },
  });
}
