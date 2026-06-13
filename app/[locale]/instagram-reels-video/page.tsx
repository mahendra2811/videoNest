import { buildToolMetadata, ToolPage } from "@/components/tool/ToolPage";

export const metadata = buildToolMetadata("instagram-reels");

export default function Page() {
  return <ToolPage profileId="instagram-reels" />;
}
