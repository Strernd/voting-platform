import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export default function RegisterErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <Image
            src="/bhs_logo.png"
            alt="Bundes Heimbrau Spiele"
            width={80}
            height={80}
            className="mx-auto mb-6"
          />
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2 uppercase">
              Ungültiger Benutzercode
            </h1>
            <p className="text-muted-foreground">
              Der Benutzercode ist ungültig, bitte wende dich an die Organisatoren.
            </p>
          </div>

          <Button asChild className="w-full bg-water hover:bg-water/90 text-white">
            <Link href="/">Zurück zur Startseite</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
