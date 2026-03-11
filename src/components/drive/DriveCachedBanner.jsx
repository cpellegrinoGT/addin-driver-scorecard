export default function DriveCachedBanner({ timestamp }) {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMin = Math.round(diffMs / 60000);

  let ago;
  if (diffMin < 1) {
    ago = "just now";
  } else if (diffMin < 60) {
    ago = `${diffMin} min ago`;
  } else {
    const hours = Math.round(diffMin / 60);
    ago = `${hours} hr ago`;
  }

  return (
    <div className="drive-cached-banner">
      Showing cached data &mdash; last updated {ago}
    </div>
  );
}
