import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { prisma } from "@/lib/prisma";
import { columns } from "./columns";
import { ProjectForm } from "./forms";

export default async function Page() {
  const [projects, companies] = await Promise.all([
    prisma.project.findMany({
      include: { company: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const data = projects.map((project) => ({
    id: project.id,
    name: project.name,
    companyName: project.company.name,
    status: project.status,
    budget: project.budget === null ? null : Number(project.budget),
    startDate: project.startDate,
    endDate: project.endDate,
  }));

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  return (
    <PageLayout
      title="Projects"
      actions={
        <ModalButton label="Add Project" title="Add Project">
          <ProjectForm companies={companyOptions} />
        </ModalButton>
      }
    >
      <DataTable columns={columns} data={data} />
    </PageLayout>
  );
}
