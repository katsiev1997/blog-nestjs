import { AppProviders } from "@/_app/providers";
import "@/_app/styles/globals.css";
import { AppShell } from "@/pages/layouts";

export default function ShellRoute() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}
