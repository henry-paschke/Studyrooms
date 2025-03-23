interface ButtonProps {
  children: React.ReactNode;
  bgColor?: string;
  hoverFromColor?: string;
  hoverToColor?: string;
  onClick?: () => void;
}

export default function Button({
  children,
  bgColor = "bg-white",
  hoverFromColor = "from-white",
  hoverToColor = "to-blue-100",
  onClick,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative inline-block text-lg font-semibold text-blue-600 px-3 py-2 ${bgColor} rounded-full shadow-md overflow-hidden group transition-transform duration-300 ease-out hover:scale-105`}
    >
      <span
        className={`absolute inset-0 bg-gradient-to-r ${hoverFromColor} ${hoverToColor} transform scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100`}
      ></span>
      <span className="relative z-10 transition-colors duration-300 ease-out group-hover:text-blue-700">
        {children}
      </span>
    </button>
  );
}
