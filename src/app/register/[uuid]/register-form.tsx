"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { registerVoter } from "@/lib/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RegisterFormProps {
  uuid: string;
}

export function RegisterForm({ uuid }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function registerUser() {
      try {
        const success = await registerVoter(uuid);
        if (!success) {
          setError("Invalid user code");
          setIsLoading(false);
        }
        if (success) {
          router.push("/");
        }
      } catch (err) {
        console.error("Registration error:", err);
        setError("An error occurred during registration");
        setIsLoading(false);
      }
    }

    registerUser();
  }, [uuid]);

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Validating...
            </h1>
            <p className="text-muted-foreground">
              Please wait while we validate your registration code.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6 text-center">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Invalid User Code
          </h1>
          <p className="text-muted-foreground">
            {error ||
              "The user code is invalid, please contact the organisers."}
          </p>
        </div>

        <Button asChild className="w-full">
          <Link href="/">Back to Home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
