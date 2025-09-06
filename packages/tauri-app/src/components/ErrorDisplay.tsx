import { LuCircleX } from "react-icons/lu";

interface ErrorDisplayProps {
  error: string;
}

export default function ErrorDisplay({ error }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <LuCircleX className="w-5 h-5 text-red-600" />
        </div>
        <p className="text-sm text-red-800 leading-relaxed">{error}</p>
      </div>
    </div>
  );
}