import { getTheme, setTheme } from "@hiogawa/theme-script";

export function ThemeSelect() {
  return (
    <button
      className="flex items-center antd-btn antd-btn-ghost"
      onClick={() => {
        setTheme(getTheme() === "dark" ? "light" : "dark");
      }}
    >
      <span className="dark:i-ri-sun-line light:i-ri-moon-line !w-5 !h-5"></span>
    </button>
  );
}
