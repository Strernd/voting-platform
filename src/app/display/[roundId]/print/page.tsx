import { getBeersByRound } from "@/lib/beer-data";
import { getRounds } from "@/lib/actions";
import { PrintButton } from "@/components/print-button";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const COLORS = ["#7EC8D6", "#3A8B5C", "#EDAA2F", "#E67A30"];

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
            margin: 12mm;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Bahnschrift', 'Segoe UI', system-ui, -apple-system, sans-serif;
            color: #5C5647;
            background: #F4EDE0;
            font-size: 11pt;
            line-height: 1.4;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .stripe-bar {
            display: flex;
            height: 6px;
            width: 100%;
            margin-bottom: 16px;
          }

          .stripe-bar div {
            flex: 1;
          }

          .header {
            text-align: center;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }

          .header h1 {
            font-size: 26pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #5C5647;
            margin-bottom: 2px;
          }

          .header .subtitle {
            font-size: 14pt;
            font-weight: bold;
            color: #5C5647;
          }

          .header p {
            font-size: 11pt;
            color: #8A8175;
            margin-top: 2px;
          }

          .beer-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }

          .beer-card {
            background: #fff;
            border-radius: 10px;
            overflow: hidden;
            page-break-inside: avoid;
          }

          .beer-startbahn {
            padding: 8px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .beer-startbahn .number {
            font-size: 28pt;
            font-weight: bold;
            line-height: 1;
            color: #fff;
          }

          .rhg-badge {
            font-size: 8pt;
            padding: 2px 8px;
            font-weight: bold;
            color: #fff;
            background: rgba(255,255,255,0.25);
            border-radius: 4px;
          }

          .beer-body {
            padding: 10px 12px;
          }

          .beer-name {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 3px;
            line-height: 1.2;
            color: #5C5647;
          }

          .beer-brewer {
            font-size: 9pt;
            color: #8A8175;
            margin-bottom: 6px;
          }

          .beer-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 8pt;
          }

          .beer-style {
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
          }

          .beer-abv {
            color: #8A8175;
            font-weight: bold;
          }

          .footer {
            margin-top: 18px;
            padding-top: 8px;
            font-size: 9pt;
            color: #8A8175;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .footer-stripe {
            display: flex;
            height: 4px;
            width: 100%;
            margin-top: 8px;
          }

          .footer-stripe div {
            flex: 1;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
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
            background: #5C5647;
            color: #F4EDE0;
            border: none;
            font-size: 14px;
            cursor: pointer;
            font-weight: bold;
            border-radius: 8px;
          }

          .print-button:hover {
            background: #6E6758;
          }

          .back-link {
            position: fixed;
            top: 20px;
            left: 20px;
            padding: 12px 24px;
            background: #fff;
            color: #5C5647;
            border: 2px solid #D9D0C1;
            font-size: 14px;
            cursor: pointer;
            text-decoration: none;
            font-weight: bold;
            border-radius: 8px;
          }

          .back-link:hover {
            background: #F4EDE0;
          }
        `,
          }}
        />
      </head>
      <body>
        <a href={`/display/${roundId}`} className="back-link no-print">
          Zurück
        </a>
        <PrintButton />

        {/* Four-stripe bar */}
        <div className="stripe-bar">
          <div style={{ background: "#7EC8D6" }} />
          <div style={{ background: "#3A8B5C" }} />
          <div style={{ background: "#EDAA2F" }} />
          <div style={{ background: "#E67A30" }} />
        </div>

        <div className="header">
          <h1>Bundes Heimbrau Spiele</h1>
          <div className="subtitle">{round.name}</div>
          <p>{beers.length} Biere</p>
        </div>

        {beers.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#8A8175" }}>
            Keine Biere in dieser Runde registriert
          </p>
        ) : (
          <div className="beer-grid">
            {beers.map((beer, index) => {
              const color = COLORS[index % COLORS.length];
              return (
                <div key={beer.beerId} className="beer-card">
                  <div
                    className="beer-startbahn"
                    style={{ background: color }}
                  >
                    <span className="number">{beer.startbahn}</span>
                    {beer.reinheitsgebot && (
                      <span className="rhg-badge">RHG</span>
                    )}
                  </div>
                  <div className="beer-body">
                    <div className="beer-name">{beer.name}</div>
                    <div className="beer-brewer">{beer.brewer}</div>
                    <div className="beer-meta">
                      <span
                        className="beer-style"
                        style={{
                          background: `${color}18`,
                          color: color,
                        }}
                      >
                        {beer.style.includes(".")
                          ? beer.style.split(".")[1].trim()
                          : beer.style}
                      </span>
                      <span className="beer-abv">{beer.alcohol}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="footer">
          Bundes Heimbrau Spiele — {round.name}
        </div>
        <div className="footer-stripe">
          <div style={{ background: "#7EC8D6" }} />
          <div style={{ background: "#3A8B5C" }} />
          <div style={{ background: "#EDAA2F" }} />
          <div style={{ background: "#E67A30" }} />
        </div>
      </body>
    </html>
  );
}
