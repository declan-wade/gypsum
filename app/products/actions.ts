"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { ProductType } from "@prisma/client";

export async function createProduct(data: {
  name: string;
  sku: string | null;
  type: ProductType;
  unitPrice: number;
  description: string | null;
}) {
  const product = await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      type: data.type,
      unitPrice: data.unitPrice,
      description: data.description,
    },
  });
  await logActivity({
    entityType: "Product",
    entityId: product.id,
    action: "CREATED",
    summary: `Created product ${product.name}`,
  });
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    sku: string | null;
    type: ProductType;
    unitPrice: number;
    description: string | null;
  }
) {
  const product = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      sku: data.sku,
      type: data.type,
      unitPrice: data.unitPrice,
      description: data.description,
    },
  });
  await logActivity({
    entityType: "Product",
    entityId: id,
    action: "UPDATED",
    summary: `Updated product ${product.name}`,
  });
}
