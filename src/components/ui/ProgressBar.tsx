/** Rounded horizontal progress/track bar used across distribution lists. */
export default function ProgressBar({
  width,
  color,
  height = 9,
  rounded = true,
  extraStyle,
}: {
  width: string;
  color: string;
  height?: number;
  rounded?: boolean;
  extraStyle?: React.CSSProperties;
}) {
  return (
    <div
      className="flex-1 overflow-hidden bg-zinc-200 dark:bg-zinc-800"
      style={{
        height,
        borderRadius: rounded ? 999 : 5,
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: rounded ? 999 : "0 5px 5px 0",
          width: width === "0%" ? "4px" : width,
          minWidth: "4px",
          background: color,
          transition: "width .5s ease",
          ...extraStyle,
        }}
      />
    </div>
  );
}
