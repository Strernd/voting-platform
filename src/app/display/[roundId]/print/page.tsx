import { getBeersByRound } from "@/lib/beer-data";
import { getRounds } from "@/lib/actions";
import { PrintButton } from "@/components/print-button";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PrintPageProps {
  params: Promise<{ roundId: string }>;
}

export default async function PrintPage({ params }: PrintPageProps) {
  const { roundId } = await params;
  const roundIdNum = parseInt(roundId, 10);

  if (isNaN(roundIdNum)) {
    notFound();
  }

  const rounds = await getRounds();
  const round = rounds.find((r) => r.id === roundIdNum);

  if (!round) {
    notFound();
  }

  const beers = await getBeersByRound(roundIdNum);

  return (
    <html>
      <head>
        <title>{round.name} - Bierliste</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @page {
            size: A4 landscape;
            margin: 15mm;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #000;
            background: #fff;
            font-size: 11pt;
            line-height: 1.4;
          }

          .header {
            text-align: center;
            padding-bottom: 15px;
            border-bottom: 2px solid #000;
            margin-bottom: 20px;
          }

          .header h1 {
            font-size: 28pt;
            font-weight: bold;
            margin-bottom: 5px;
          }

          .header p {
            font-size: 12pt;
            color: #666;
          }

          .beer-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }

          .beer-card {
            border: 1px solid #000;
            padding: 10px;
            page-break-inside: avoid;
          }

          .beer-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid #ccc;
          }

          .startbahn {
            font-size: 28pt;
            font-weight: bold;
            line-height: 1;
          }

          .rhg-badge {
            font-size: 8pt;
            border: 1px solid #000;
            padding: 2px 6px;
            font-weight: bold;
          }

          .beer-name {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 4px;
            line-height: 1.2;
          }

          .beer-brewer {
            font-size: 9pt;
            color: #666;
            margin-bottom: 4px;
          }

          .beer-details {
            font-size: 8pt;
            color: #666;
          }

          .beer-details span {
            margin-right: 8px;
          }

          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ccc;
            font-size: 9pt;
            color: #666;
            text-align: center;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .no-print {
              display: none !important;
            }
          }

          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: #000;
            color: #fff;
            border: none;
            font-size: 14px;
            cursor: pointer;
            font-weight: bold;
          }

          .print-button:hover {
            background: #333;
          }

          .back-link {
            position: fixed;
            top: 20px;
            left: 20px;
            padding: 12px 24px;
            background: #fff;
            color: #000;
            border: 1px solid #000;
            font-size: 14px;
            cursor: pointer;
            text-decoration: none;
          }

          .back-link:hover {
            background: #f5f5f5;
          }
        `,
          }}
        />
      </head>
      <body>
        <a href={`/display/${roundId}`} className="back-link no-print">
          Zuruck
        </a>
        <PrintButton />

        <div className="header">
          <h1>{round.name}</h1>
          <p>{beers.length} Biere</p>
        </div>

        {beers.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            Keine Biere in dieser Runde registriert
          </p>
        ) : (
          <div className="beer-grid">
            {beers.map((beer) => (
              <div key={beer.beerId} className="beer-card">
                <div className="beer-header">
                  <span className="startbahn">{beer.startbahn}</span>
                  {beer.reinheitsgebot && (
                    <span className="rhg-badge">RHG</span>
                  )}
                </div>
                <div className="beer-name">{beer.name}</div>
                <div className="beer-brewer">{beer.brewer}</div>
                <div className="beer-details">
                  <span>
                    {beer.style.includes(".")
                      ? beer.style.split(".")[1].trim()
                      : beer.style}
                  </span>
                  <span>{beer.alcohol}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="footer">Bier Voting - {round.name}</div>
      </body>
    </html>
  );
}
