export default function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-72 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 text-3xl">🔭</div>
      <h1 className="text-lg font-bold text-gray-800">{label}</h1>
      <p className="text-sm text-gray-400 mt-2 max-w-sm">
        This screen is planned for the next development sprint. It will integrate seamlessly with the FDR Sentinel data model.
      </p>
      <div className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg border border-blue-100">
        Coming next →
      </div>
    </div>
  );
}
