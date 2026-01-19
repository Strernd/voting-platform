"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Download, QrCode, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export function VoterManagement() {
  const [voterCount, setVoterCount] = useState<string>("100");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const getBaseUrl = () => {
    if (baseUrl.trim()) return baseUrl.trim();
    if (typeof window !== "undefined") return window.location.origin;
    return "https://example.com";
  };

  const generateVoterCards = async () => {
    const count = parseInt(voterCount, 10);
    if (isNaN(count) || count < 1 || count > 1000) {
      alert("Anzahl muss zwischen 1 und 1000 liegen");
      return;
    }

    setGenerating(true);
    setProgress("Generiere Voter-IDs...");

    try {
      // Generate voters via API (credentials: include ensures Basic Auth is sent)
      const response = await fetch("/api/admin/voters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ count }),
      });

      if (response.status === 401) {
        throw new Error("Nicht autorisiert - bitte erneut anmelden");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Fehler beim Generieren der Voter-IDs");
      }

      const data = await response.json();
      const voterIds: string[] = data.voters;

      setProgress(`${voterIds.length} Voter erstellt. Generiere PDF...`);

      // Generate PDF
      await generatePDF(voterIds);

      setProgress(`Fertig! ${voterIds.length} Voter-Karten erstellt.`);
    } catch (error) {
      console.error("Error:", error);
      alert("Fehler beim Generieren: " + (error as Error).message);
      setProgress("");
    } finally {
      setGenerating(false);
    }
  };

  const generatePDF = async (voterIds: string[]) => {
    const base = getBaseUrl();

    // A4 dimensions in mm
    const pageWidth = 210;
    const pageHeight = 297;

    // Card layout: 2 columns x 5 rows = 10 cards per page
    const cols = 2;
    const rows = 5;
    const cardsPerPage = cols * rows;

    // Margins and spacing
    const marginX = 10;
    const marginY = 10;
    const cardWidth = (pageWidth - marginX * 2) / cols;
    const cardHeight = (pageHeight - marginY * 2) / rows;

    // QR code size
    const qrSize = 35;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const totalPages = Math.ceil(voterIds.length / cardsPerPage);

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      if (pageIndex > 0) {
        pdf.addPage();
      }

      setProgress(
        `Generiere Seite ${pageIndex + 1} von ${totalPages}...`
      );

      const startIndex = pageIndex * cardsPerPage;
      const endIndex = Math.min(startIndex + cardsPerPage, voterIds.length);
      const pageVoters = voterIds.slice(startIndex, endIndex);

      // Draw cutting lines for the entire grid
      drawCuttingLines(pdf, marginX, marginY, cardWidth, cardHeight, cols, rows);

      // Generate cards for this page
      for (let i = 0; i < pageVoters.length; i++) {
        const voterId = pageVoters[i];
        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = marginX + col * cardWidth;
        const y = marginY + row * cardHeight;

        // Generate QR code
        const registerUrl = `${base}/register/${voterId}`;
        const qrDataUrl = await QRCode.toDataURL(registerUrl, {
          width: 200,
          margin: 1,
          errorCorrectionLevel: "M",
        });

        // Draw card content
        drawCard(pdf, x, y, cardWidth, cardHeight, qrDataUrl, qrSize, voterId);
      }
    }

    // Save PDF
    const timestamp = new Date().toISOString().slice(0, 10);
    pdf.save(`voter-cards-${timestamp}.pdf`);
  };

  const drawCuttingLines = (
    pdf: jsPDF,
    marginX: number,
    marginY: number,
    cardWidth: number,
    cardHeight: number,
    cols: number,
    rows: number
  ) => {
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(0.2);
    pdf.setLineDashPattern([2, 2], 0);

    // Vertical lines
    for (let col = 0; col <= cols; col++) {
      const x = marginX + col * cardWidth;
      pdf.line(x, marginY, x, marginY + rows * cardHeight);
    }

    // Horizontal lines
    for (let row = 0; row <= rows; row++) {
      const y = marginY + row * cardHeight;
      pdf.line(marginX, y, marginX + cols * cardWidth, y);
    }

    // Reset line style
    pdf.setLineDashPattern([], 0);
  };

  const drawCard = (
    pdf: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    qrDataUrl: string,
    qrSize: number,
    voterId: string
  ) => {
    const centerX = x + width / 2;
    const padding = 5;

    // QR code centered horizontally, near top of card
    const qrX = centerX - qrSize / 2;
    const qrY = y + padding + 3;
    pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    // Title text
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    const title = "Bier Voting";
    pdf.text(title, centerX, qrY + qrSize + 6, { align: "center" });

    // Instruction text
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(80, 80, 80);
    pdf.text("QR-Code scannen zum Abstimmen", centerX, qrY + qrSize + 11, {
      align: "center",
    });

    // Voter ID (truncated for display)
    pdf.setFontSize(5);
    pdf.setTextColor(150, 150, 150);
    const shortId = voterId.slice(0, 8) + "...";
    pdf.text(shortId, centerX, y + height - padding, { align: "center" });
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Voter-Karten Generator</h3>
              <p className="text-sm text-muted-foreground">
                Generiere Voter-IDs und erstelle druckbare PDF-Karten mit
                QR-Codes. Jede Karte enthält einen einzigartigen QR-Code, den
                Teilnehmer scannen können, um sich zu registrieren und
                abzustimmen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generator Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Voter generieren</CardTitle>
              <p className="text-sm text-muted-foreground">
                Anzahl der zu erstellenden Voter-Karten
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                Anzahl Voter
              </label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={voterCount}
                onChange={(e) => setVoterCount(e.target.value)}
                className="h-12 text-lg font-medium"
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum: 1000 Voter pro Durchgang
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Base-URL (optional)
              </label>
              <Input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="h-12"
                placeholder={
                  typeof window !== "undefined"
                    ? window.location.origin
                    : "https://..."
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leer lassen für aktuelle Domain
              </p>
            </div>
          </div>

          {/* Preview Info */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">PDF-Vorschau</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">
                  {voterCount || 0}
                </span>{" "}
                Voter-Karten
              </div>
              <div>
                <span className="font-medium text-foreground">
                  {Math.ceil((parseInt(voterCount) || 0) / 10)}
                </span>{" "}
                A4-Seiten
              </div>
              <div>10 Karten pro Seite</div>
              <div>Mit Schnittlinien</div>
            </div>
          </div>

          {/* Progress */}
          {progress && (
            <div className="p-3 rounded-lg bg-primary/10 text-primary text-sm font-medium">
              {progress}
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={generateVoterCards}
            disabled={generating || !voterCount || parseInt(voterCount) < 1}
            size="lg"
            className="w-full h-14 text-lg font-semibold"
          >
            <Download className="h-5 w-5 mr-2" />
            {generating ? "Generiere..." : "Voter generieren & PDF erstellen"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
