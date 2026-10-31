export default function Sigil({ active = false, compact = false }: { active?: boolean; compact?: boolean }) {
  return <div className={`sigil ${active ? 'active' : ''} ${compact ? 'compact' : ''}`} aria-hidden="true">
    <svg viewBox="0 0 600 600" className="sigil-svg">
      <defs>
        <radialGradient id="aura"><stop offset="0" stopColor="#e55b3b" stopOpacity=".12"/><stop offset=".72" stopColor="#e55b3b" stopOpacity=".025"/><stop offset="1" stopColor="#e55b3b" stopOpacity="0"/></radialGradient>
        <path id="label-orbit" d="M300,300 m-233,0 a233,233 0 1,1 466,0 a233,233 0 1,1 -466,0"/>
        <pattern id="eye-hatch" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6 6 0" stroke="currentColor" strokeWidth=".6" opacity=".35"/></pattern>
      </defs>
      <circle cx="300" cy="300" r="295" fill="url(#aura)"/>
      <g className="orbital-rings" fill="none" stroke="currentColor">
        <circle cx="300" cy="300" r="267" opacity=".14"/>
        <circle cx="300" cy="300" r="224" opacity=".35"/>
        <circle cx="300" cy="300" r="216" opacity=".15"/>
        <circle cx="300" cy="300" r="181" opacity=".22" strokeDasharray="2 8"/>
        {Array.from({ length: 72 }, (_, index) => <path key={index} d={`M300 ${index % 6 === 0 ? '38' : '43'}V${index % 6 === 0 ? '57' : '50'}`} transform={`rotate(${index * 5} 300 300)`} opacity={index % 6 === 0 ? '.6' : '.25'}/>)}
        <path d="M300 61V539M61 300H539" opacity=".14"/>
        <path d="M104 104 496 496M104 496 496 104" opacity=".09"/>
        <path d="m300 105 169 293H131Z" opacity=".17"/>
        <path d="m300 495-169-293h338Z" opacity=".17"/>
      </g>
      <g fill="currentColor" className="orbit-label"><text><textPath href="#label-orbit" startOffset="2%">THE MEDIUM IS THE MESSAGE ✣ THE MESSAGE IS THE GHOST ✣ </textPath></text></g>
      <g className="eye-engraving" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M120 300Q300 99 480 300Q300 501 120 300Z" fill="url(#eye-hatch)"/>
        <path d="M130 300Q300 132 470 300Q300 468 130 300Z"/>
        <path d="M120 300Q300 171 480 300Q300 429 120 300Z" opacity=".55"/>
        <ellipse cx="300" cy="300" rx="73" ry="98" fill="#161713"/>
        <ellipse cx="300" cy="300" rx="62" ry="87"/>
        {Array.from({ length: 36 }, (_, index) => <path key={index} d="M300 211 297 234" transform={`rotate(${index * 10} 300 300)`} opacity=".65"/>)}
        <path d="M300 234Q326 300 300 366Q274 300 300 234Z" fill="currentColor"/>
        <circle cx="300" cy="289" r="7" fill="#f0e8d4" stroke="none"/>
        <path d="m119 285-15-10m17 37-18 12m361-39 15-10m-17 37 18 12M300 173v-26m0 280v26M209 201l-14-19m196 19 14-19m-196 217-14 19m196-19 14 19"/>
      </g>
      <g fill="currentColor"><path d="m300 26 5 9-5 9-5-9Zm0 530 5 9-5 9-5-9ZM26 300l9-5 9 5-9 5Zm530 0 9-5 9 5-9 5Z"/><circle cx="99" cy="99" r="3"/><circle cx="501" cy="99" r="3"/><circle cx="99" cy="501" r="3"/><circle cx="501" cy="501" r="3"/></g>
    </svg>
    {!compact && <><span className="sigil-coordinate coordinate-nw">N 51° 30′</span><span className="sigil-coordinate coordinate-se">SOMETHING IS HERE.</span><span className="sigil-caption">FIG. 01 — A RECEPTIVE MIND</span></>}
  </div>;
}
