"use server";

import { prisma } from "@/lib/prisma";
import type { ProductType } from "@prisma/client";

export async function createProduct(data: {
  name: string;
  sku: string | null;
  type: ProductType;
  unitPrice: number;
  description: string | null;
}) {
  await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      type: data.type,
      unitPrice: data.unitPrice,
      description: data.description,
    },
  });
}
