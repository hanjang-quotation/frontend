import type { Metadata } from "next";
import DocumentList from "./DocumentList";

export const metadata: Metadata = { title: "내 문서" };

export default function DocumentsPage() {
  return <DocumentList />;
}
