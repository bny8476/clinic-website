
const EmptyState = ({ icon: Icon, title, message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
      {Icon && <Icon size={48} className="mb-4 text-slate-300" />}
      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
      <p className="mt-2 text-sm max-w-md">{message}</p>
    </div>
  );
};

export default EmptyState;
