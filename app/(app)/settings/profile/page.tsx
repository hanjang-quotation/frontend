import type { Metadata } from "next";
import ProfileSettings from "./ProfileSettings";

export const metadata: Metadata = { title: "내 정보" };

export default function ProfileSettingsPage() {
  return <ProfileSettings />;
}
