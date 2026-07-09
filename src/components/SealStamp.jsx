// A reusable circular "class seal" motif: used large on the cover page and
// small as a "revealed" stamp overlay once a private photo has been tapped.
export default function SealStamp({ size = 160, topText = 'CLASS BOOK', bottomText = 'BATCH OF 2015' }) {
  const id = `seal-path-${size}-${topText.length}`;
  return (
    <svg className="seal" width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={`${topText} ${bottomText}`}>
      <defs>
        <path id={`${id}-top`} d="M 30,100 A 70,70 0 1,1 170,100" />
        <path id={`${id}-bottom`} d="M 40,130 A 60,60 0 0,0 160,130" />
      </defs>
      <circle className="seal-ring" cx="100" cy="100" r="92" strokeWidth="2" />
      <circle className="seal-gold" cx="100" cy="100" r="82" strokeWidth="1.5" />
      <circle className="seal-ring" cx="100" cy="100" r="50" strokeWidth="1.5" />
      <text fontSize="13" letterSpacing="2" textAnchor="middle">
        <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">
          {topText}
        </textPath>
      </text>
      <text fontSize="11" letterSpacing="2" textAnchor="middle">
        <textPath href={`#${id}-bottom`} startOffset="50%" textAnchor="middle">
          {bottomText}
        </textPath>
      </text>
      <text x="100" y="106" fontSize="30" textAnchor="middle" fontFamily="var(--font-display)">
        16
      </text>
    </svg>
  );
}
