declare let __themeSet: (theme: string) => void;
declare let __themeGet: () => string;

export function ThemeSelect() {
  return (
    <button
      className="flex items-center antd-btn antd-btn-ghost"
      onClick={() => {
        __themeSet(__themeGet() === "dark" ? "light" : "dark");
      }}
    >
      <span className="dark:i-ri-sun-line light:i-ri-moon-line !w-5 !h-5"></span>
    </button>
  );
}
