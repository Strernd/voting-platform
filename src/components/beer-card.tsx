"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Beer } from "@/lib/beer-data";
import { ChevronRight, ExternalLink } from "lucide-react";

interface BeerCardProps {
  beer: Beer;
}

function getStyleBadgeColor(style: string): string {
  const lowerStyle = style.toLowerCase();

  if (lowerStyle.includes("lager")) {
    return "bg-blue-500 hover:bg-blue-600";
  } else if (
    lowerStyle.includes("ale") ||
    lowerStyle.includes("ipa") ||
    lowerStyle.includes("porter") ||
    lowerStyle.includes("stout")
  ) {
    return "bg-orange-500 hover:bg-orange-600";
  } else if (
    lowerStyle.includes("wild") ||
    lowerStyle.includes("sour") ||
    lowerStyle.includes("lambic")
  ) {
    return "bg-green-500 hover:bg-green-600";
  }

  return "bg-gray-500 hover:bg-gray-600";
}

export function BeerCard({ beer }: BeerCardProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="text-left">
                    <h3 className="font-semibold text-sm truncate hover:text-blue-400 transition-colors">
                      {beer.name}
                    </h3>
                  </button>
                </SheetTrigger>
                <SheetContent className="px-6 border-border">
                  <SheetHeader>
                    <SheetTitle>{beer.name}</SheetTitle>
                    <SheetDescription className="text-left">
                      {beer.description}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <Button asChild className="w-full">
                      <a
                        href={beer.recipeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Recipe
                      </a>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <p className="text-xs text-muted-foreground">{beer.brewer}</p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <Badge
                className={`${getStyleBadgeColor(
                  beer.style
                )} text-white text-xs px-2 py-0.5`}
              >
                {beer.style}
              </Badge>
              <span className="text-muted-foreground">{beer.alcohol}% ABV</span>
              <span className="text-muted-foreground">{beer.ibu} IBU</span>
            </div>
          </div>

          <Drawer>
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                size="default"
                className="h-10 w-12 px-3 py-2 shrink-0 bg-transparent flex items-center justify-center"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="border-border">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-2">{beer.name}</h2>
                <p className="text-muted-foreground">
                  Drawer content coming soon...
                </p>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </CardContent>
    </Card>
  );
}
