import type { Metadata } from "next";
import WelcomeConsent from "./WelcomeConsent";

export const metadata: Metadata = {
  title: "약관 동의",
  robots: { index: false },
};

// 처음 로그인했거나 약관이 바뀐 뒤 로그인하면 백엔드(LoginSuccessHandler)·메뉴 줄(AuthMenu)이 여기로 보낸다.
export default function WelcomePage() {
  return <WelcomeConsent />;
}
