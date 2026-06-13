import { buildToolMetadata, ToolPage } from "@/components/tool/ToolPage";

export const metadata = buildToolMetadata("whatsapp-status");

export default function Page() {
  return <ToolPage profileId="whatsapp-status" />;
}
