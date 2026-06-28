import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { prisma } from "@/lib/prisma";
import { columns } from "./columns";
import { ProductForm } from "./forms";

export default async function Page() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  const data = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    type: product.type,
    unitPrice: Number(product.unitPrice),
  }));

  return (
    <PageLayout
      title="Products"
      actions={
        <ModalButton label="Add Product" title="Add Product">
          <ProductForm />
        </ModalButton>
      }
    >
      <DataTable columns={columns} data={data} />
    </PageLayout>
  );
}
