export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-primary-50 dark:from-gray-950 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
