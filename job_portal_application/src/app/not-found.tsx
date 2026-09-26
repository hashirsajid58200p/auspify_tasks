import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 rounded-3xl border-4 border-black bg-[#FF6B7A] text-white flex items-center justify-center shadow-neo mb-6">
        <FileQuestion className="w-10 h-10" />
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-2">404</h1>
      <h2 className="text-xl md:text-2xl font-bold mb-4">Page Not Found</h2>
      <p className="text-muted-foreground text-sm md:text-base font-medium max-w-md mb-8 leading-relaxed">
        The resource or page you are trying to reach does not exist, or has been removed.
      </p>
      <Button asChild size="lg" className="rounded-2xl">
        <Link href="/" className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" />
          <span>Return Home</span>
        </Link>
      </Button>
    </div>
  );
}
