import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function RegisterErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Invalid User Code
            </h1>
            <p className="text-muted-foreground">
              The user code is invalid, please contact the organisers.
            </p>
          </div>

          <Button asChild className="w-full">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}