import { useState } from "react";

export default function Popover({
  children,
  content,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}

      {open && (
        <div
          className="
            absolute right-0 top-full mt-2 
            w-56 p-3 rounded-lg 
            bg-neutral-900 border border-neutral-700 shadow-xl
            text-neutral-200 text-sm 
            animate-fadeIn
            z-50
          "
        >
          {content}
        </div>
      )}
    </div>
  );
}
