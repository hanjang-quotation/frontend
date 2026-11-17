import type { Metadata } from "next";
import ItemSettings from "./ItemSettings";

export const metadata: Metadata = { title: "자주 쓰는 품목" };

export default function ItemSettingsPage() {
  return <ItemSettings />;
}
