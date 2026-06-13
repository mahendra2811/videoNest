import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo className="h-16 w-16" />
      <div className="space-y-2">
        <p className="font-mono text-5xl font-bold text-sunset">404</p>
        <h1 className="text-2xl font-bold tracking-tight">This page wandered off</h1>
        <p className="text-muted">
          The page you're looking for doesn't exist. Let's get you back to optimizing videos.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/">Back home</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/whatsapp-status-video">Optimize a video</Link>
        </Button>
      </div>
    </div>
  );
}
