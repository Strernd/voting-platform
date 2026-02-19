"use client";

import { useState, useEffect } from "react";
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

  // Existing voters state
  const [existingVoters, setExistingVoters] = useState<string[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const getBaseUrl = () => {
    if (baseUrl.trim()) return baseUrl.trim();
    if (typeof window !== "undefined") return window.location.origin;
    return "https://example.com";
  };

  const fetchExistingVoters = async () => {
    setLoadingExisting(true);
    try {
      const response = await fetch("/api/admin/voters", {
        credentials: "include",
      });

      if (response.status === 401) {
        throw new Error("Nicht autorisiert - bitte erneut anmelden");
      }

      if (!response.ok) {
        throw new Error("Fehler beim Laden der Voter");
      }

      const data = await response.json();
      setExistingVoters(data.voters);
    } catch (error) {
      console.error("Error fetching voters:", error);
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    fetchExistingVoters();
  }, []);

  const generateVoterCards = async () => {
    const count = parseInt(voterCount, 10);
    if (isNaN(count) || count < 1 || count > 1000) {
      alert("Anzahl muss zwischen 1 und 1000 liegen");
      return;
    }

    setGenerating(true);
    setProgress("Generiere Voter-IDs...");

    try {
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

      await generateFullPagePDF(voterIds, `voter-cards-${new Date().toISOString().slice(0, 10)}.pdf`);

      setProgress(`Fertig! ${voterIds.length} Voter-Karten erstellt.`);

      // Refresh existing voters list
      fetchExistingVoters();
    } catch (error) {
      console.error("Error:", error);
      alert("Fehler beim Generieren: " + (error as Error).message);
      setProgress("");
    } finally {
      setGenerating(false);
    }
  };

  const exportExistingVoters = async () => {
    if (existingVoters.length === 0) return;

    setExporting(true);
    setProgress("Exportiere QR-Codes...");

    try {
      await generateFullPagePDF(
        existingVoters,
        `voter-qr-codes-${new Date().toISOString().slice(0, 10)}.pdf`
      );
      setProgress(`Fertig! ${existingVoters.length} QR-Codes exportiert.`);
    } catch (error) {
      console.error("Error:", error);
      alert("Fehler beim Exportieren: " + (error as Error).message);
      setProgress("");
    } finally {
      setExporting(false);
    }
  };

  const generateFullPagePDF = async (voterIds: string[], filename: string) => {
    const base = getBaseUrl();

    // A4 dimensions in mm
    const pageWidth = 210;
    const pageHeight = 297;

    // QR code size
    const qrSize = 35;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    for (let i = 0; i < voterIds.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      setProgress(`Generiere Seite ${i + 1} von ${voterIds.length}...`);

      const voterId = voterIds[i];
      const registerUrl = `${base}/register/${voterId}`;
      const qrDataUrl = await QRCode.toDataURL(registerUrl, {
        width: 200,
        margin: 1,
        errorCorrectionLevel: "M",
      });

      // Center QR code on page
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = (pageHeight - qrSize) / 2 - 10; // slightly above center to leave room for text
      pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

      // Title text centered below QR code
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("Bier Voting", pageWidth / 2, qrY + qrSize + 10, { align: "center" });

      // Instruction text
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(80, 80, 80);
      pdf.text("QR-Code scannen zum Abstimmen", pageWidth / 2, qrY + qrSize + 18, {
        align: "center",
      });

      // Voter ID (truncated)
      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      const shortId = voterId.slice(0, 8) + "...";
      pdf.text(shortId, pageWidth / 2, qrY + qrSize + 25, { align: "center" });
    }

    pdf.save(filename);
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
                  {parseInt(voterCount) || 0}
                </span>{" "}
                A4-Seiten
              </div>
              <div>1 QR-Code pro Seite</div>
              <div>Zentriert auf A4</div>
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
            disabled={generating || exporting || !voterCount || parseInt(voterCount) < 1}
            size="lg"
            className="w-full h-14 text-lg font-semibold"
          >
            <Download className="h-5 w-5 mr-2" />
            {generating ? "Generiere..." : "Voter generieren & PDF erstellen"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Voters Export Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Bestehende Voter exportieren</CardTitle>
              <p className="text-sm text-muted-foreground">
                QR-Codes für bereits vorhandene Voter als PDF exportieren
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground text-lg">
                {loadingExisting ? "..." : existingVoters.length}
              </span>{" "}
              Voter in der Datenbank
            </div>
          </div>

          <Button
            onClick={exportExistingVoters}
            disabled={exporting || generating || loadingExisting || existingVoters.length === 0}
            size="lg"
            className="w-full h-14 text-lg font-semibold"
            variant="outline"
          >
            <Download className="h-5 w-5 mr-2" />
            {exporting ? "Exportiere..." : "QR-Codes exportieren"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
