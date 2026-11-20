import type { Metadata } from "next";
import TemplateLanding from "@/components/template/TemplateLanding";
import { TEMPLATE_PAGES } from "@/lib/templates";

const page = TEMPLATE_PAGES.statement;

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  alternates: { canonical: "/templates/statement" },
};

export default function Page() {
  return <TemplateLanding page={page} />;
}
