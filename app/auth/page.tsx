import { AuthBoard, AuthForm } from '@/components/auth-form';

export default function AuthPage() {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <AuthBoard />
      <div className="px-4 py-8 sm:px-8 lg:flex lg:items-center lg:px-16">
        <AuthForm />
      </div>
    </main>
  );
}
