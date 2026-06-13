import { buildToolMetadata, ToolPage } from "@/components/tool/ToolPage";

export const metadata = buildToolMetadata("facebook-story");

export default function Page() {
  return <ToolPage profileId="facebook-story" />;
}
