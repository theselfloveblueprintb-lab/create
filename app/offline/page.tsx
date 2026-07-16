export default function OfflinePage() {
  return (
    <div className="max-w-[480px] mx-auto min-h-screen flex flex-col items-center justify-center px-7 text-center bg-blush">
      <div className="text-[38px] mb-3">📡</div>
      <h1 className="font-display font-bold text-[22px] mb-2">Geen verbinding</h1>
      <p className="text-sm text-[#7A6F63] leading-relaxed">
        Crea heeft internet nodig om je dagelijkse plan te maken. Zodra je weer verbinding hebt,
        werkt alles gewoon verder — je gegevens op dit toestel zijn niet verloren.
      </p>
    </div>
  );
}
