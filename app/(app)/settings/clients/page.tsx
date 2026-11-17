import type { Metadata } from "next";
import ClientSettings from "./ClientSettings";

export const metadata: Metadata = { title: "거래처" };

export default function ClientSettingsPage() {
  return <ClientSettings />;
}
