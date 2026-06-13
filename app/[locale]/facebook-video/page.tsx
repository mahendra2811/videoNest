import { buildToolMetadata, ToolPage } from "@/components/tool/ToolPage";

export const metadata = buildToolMetadata("facebook-video");

export default function Page() {
  return <ToolPage profileId="facebook-video" />;
}
