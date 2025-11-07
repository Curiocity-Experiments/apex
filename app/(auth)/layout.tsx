/**
 * Auth Layout
 *
 * Minimal layout for authentication pages.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className='min-h-screen bg-gray-50'>{children}</div>;
}
