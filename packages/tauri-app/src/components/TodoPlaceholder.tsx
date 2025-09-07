interface TodoPlaceholderProps {
  title: string;
}

export default function TodoPlaceholder({ title }: TodoPlaceholderProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">{title}</h2>
        <p className="text-gray-500">This feature is coming soon</p>
      </div>
    </div>
  );
}