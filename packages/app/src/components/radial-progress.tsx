import { cls } from "../utils/misc";

const PATH_LENGTH = 100;
const GAP_LENGTH = 10000;

// cf. https://github.com/mui/material-ui/blob/3f30cf2ad67d87db4df9e3f6dad0b028b5f9c7cd/packages/mui-material/src/CircularProgress/CircularProgress.js
// cf. https://github.com/hi-ogawa/ytsub-v3/pull/159
export function RadialProgress(props: {
  progress: number;
  className?: string;
  classNameBackCircle?: string;
  classNameFrontCircle?: string;
}) {
  const dashLength = Math.ceil(PATH_LENGTH * props.progress);

  // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray
  // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dashoffset
  return (
    <svg
      className={props.className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="butt"
    >
      <circle className={props.classNameBackCircle} cx="12" cy="12" r="9" />
      <circle
        className={cls(
          props.classNameFrontCircle,
          "transition-[stroke-dasharray]"
        )}
        transform="rotate(-90 12 12)"
        cx="12"
        cy="12"
        r="9"
        strokeDasharray={`${dashLength} ${GAP_LENGTH}`}
        pathLength={PATH_LENGTH}
      />
    </svg>
  );
}
