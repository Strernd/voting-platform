import { RegisterForm } from "./register-form";

interface RegisterPageProps {
  params: {
    uuid: string;
  };
}

export default function RegisterPage({ params }: RegisterPageProps) {
  const { uuid } = params;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <RegisterForm uuid={uuid} />
    </div>
  );
}
