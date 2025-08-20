import { RegisterForm } from "./register-form";

interface RegisterPageProps {
  params: Promise<{
    uuid: string;
  }>;
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { uuid } = await params;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <RegisterForm uuid={uuid} />
    </div>
  );
}
