import { buildToolMetadata, ToolPage } from "@/components/tool/ToolPage";

export const metadata = buildToolMetadata("youtube-long");

export default function Page() {
  return <ToolPage profileId="youtube-long" />;
}
