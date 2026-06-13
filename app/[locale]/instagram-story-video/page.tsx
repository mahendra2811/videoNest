import { buildToolMetadata, ToolPage } from "@/components/tool/ToolPage";

export const metadata = buildToolMetadata("instagram-story");

export default function Page() {
  return <ToolPage profileId="instagram-story" />;
}
