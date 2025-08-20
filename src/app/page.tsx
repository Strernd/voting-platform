import { BeerList } from "@/components/beer-list";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentVote } from "@/lib/actions";
import { getBeers } from "@/lib/beer-data";
import { getVoterSession } from "@/lib/session";

export default async function Home() {
  const beers = await getBeers();
  const voterUuid = await getVoterSession();
  const isRegistered = !!voterUuid;
  const currentVoteBeerId = await getCurrentVote();

  return (
    <div className="dark min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-md">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Runde 1: Biere
        </h1>
        
        <Card className={`mb-6 ${isRegistered ? 'bg-green-950 border-green-800' : 'bg-red-950 border-red-800'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isRegistered ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className={`font-medium ${isRegistered ? 'text-green-100' : 'text-red-100'}`}>
                {isRegistered ? 'Registered for voting' : 'Not yet registered'}
              </span>
            </div>
            {!isRegistered && (
              <p className="text-red-200 text-sm mt-2">
                You need a valid registration code to vote
              </p>
            )}
          </CardContent>
        </Card>
        
        <BeerList 
          beers={beers} 
          voterUuid={voterUuid} 
          isRegistered={isRegistered}
          currentVoteBeerId={currentVoteBeerId || undefined}
        />
      </div>
    </div>
  );
}
