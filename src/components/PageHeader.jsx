export default function PageHeader({ title, subtitle }) {
  return (
    <div className="card-reveal">
      <h1 className="text-3xl font-display font-bold text-white">{title}</h1>
      {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}
