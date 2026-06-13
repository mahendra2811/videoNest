import { buildToolMetadata, ToolPage } from "@/components/tool/ToolPage";

export const metadata = buildToolMetadata("youtube-shorts");

export default function Page() {
  return <ToolPage profileId="youtube-shorts" />;
}
