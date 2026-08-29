export default function Logo({ className = 'w-6 h-6' }: { className?: string }) {
  return <img src="/logo.svg" alt="Tara AI" className={className} />;
}
