import "@/styles/loader.css";

export function Loader({
  progress,
  leaving,
}: {
  progress: number;
  leaving: boolean;
}) {
  return (
    <div className={leaving ? "loader is-leaving" : "loader"} aria-hidden={leaving}>
      <div className="loader-name">
        <span>Misheel</span>
        <span>Chantsal</span>
        <i className="loader-mark" />
      </div>
      <p className="loader-count">{progress}%</p>
    </div>
  );
}
