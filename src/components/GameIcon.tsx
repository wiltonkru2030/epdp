type GameIconProps={name:string;size?:number;className?:string;title?:string}
const iconPaths:Record<string,string>={
'book-open':'M12 7v14 M3 18V5a2 2 0 0 1 2-2h3a4 4 0 0 1 4 4 4 4 0 0 1 4-4h3a2 2 0 0 1 2 2v13h-5a4 4 0 0 0-4 3 4 4 0 0 0-4-3H3z',
'book-open-check':'M12 7v14 M3 18V5a2 2 0 0 1 2-2h3a4 4 0 0 1 4 4 4 4 0 0 1 4-4h3a2 2 0 0 1 2 2v8 M16 18l2 2 4-4',
'type':'M4 7V4h16v3 M9 20h6 M12 4v16','text':'M4 6h16 M4 12h10 M4 18h16 M18 10v8','spell-check':'m4 7 4 10 4-10 M3 17h10 M15 13l2 2 4-5',
'split':'M7 3v5a4 4 0 0 0 4 4h6 M14 8l3 4-3 4 M7 21v-5a4 4 0 0 1 4-4','layers':'m12 3 9 5-9 5-9-5 9-5z M3 12l9 5 9-5 M3 16l9 5 9-5',
'tag':'M20 13 11 22 2 13V4h9z M7 9h.01','user-round':'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M4 21a8 8 0 0 1 16 0',
'repeat':'m17 2 4 4-4 4 M3 11V9a3 3 0 0 1 3-3h15 M7 22l-4-4 4-4 M21 13v2a3 3 0 0 1-3 3H3','timer':'M12 13V9 M12 13l3 2 M9 2h6 M12 2v3 M20 13a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
'list-checks':'m3 6 2 2 4-4 M12 7h9 M3 16l2 2 4-4 M12 17h9','grip-vertical':'M9 5h.01 M15 5h.01 M9 12h.01 M15 12h.01 M9 19h.01 M15 19h.01',
'scan-search':'M3 7V5a2 2 0 0 1 2-2h2 M17 3h2a2 2 0 0 1 2 2v2 M21 17v2a2 2 0 0 1-2 2h-2 M7 21H5a2 2 0 0 1-2-2v-2 M14 10a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z M13 13l4 4',
'scale':'M12 3v18 M5 8h14 M8 21h8 M5 8l-3 7h6L5 8z M19 8l-3 7h6l-3-7z','message-square':'M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z M8 9h8 M8 13h6',
'quote':'M3 21c3-2 5-5 5-9V5H2v7h4 M15 21c3-2 5-5 5-9V5h-6v7h4','check-circle':'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M8 12l3 3 5-6',
'search':'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z M16 16l5 5','trophy':'M8 21h8 M12 17v4 M7 4h10v6a5 5 0 0 1-10 0z M7 6H4v2a4 4 0 0 0 4 4 M17 6h3v2a4 4 0 0 1-4 4',
'coins':'M3 7c0-2 12-2 12 0s-12 2-12 0z M3 7v5c0 2 12 2 12 0V7 M3 12v5c0 2 9 2 10 0 M14 15c0-2 8-2 8 0s-8 2-8 0z M14 15v4c0 2 8 2 8 0v-4',
'star':'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3z','lock':'M4 10h16v11H4z M8 10V7a4 4 0 0 1 8 0v3','play':'m8 5 12 7-12 7',
'volume-2':'M11 5 6 9H3v6h3l5 4z M15 9a5 5 0 0 1 0 6 M18 6a9 9 0 0 1 0 12','volume-x':'M11 5 6 9H3v6h3l5 4z M16 9l5 6 M21 9l-5 6',
'heart':'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z','heart-outline':'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z',
'arrow-left':'M19 12H5 M12 5l-7 7 7 7','arrow-up-right':'M7 17 17 7 M7 7h10v10','sparkles':'m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z',
'award':'M12 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z M8 13l-1 8 5-2 5 2-1-8','medal':'M12 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z M8 13l-2 8 6-3 6 3-2-8',
'gamepad-2':'M6 8h12a4 4 0 0 1 4 4v4a3 3 0 0 1-5 2l-2-2H9l-2 2a3 3 0 0 1-5-2v-4a4 4 0 0 1 4-4z M7 11v4 M5 13h4 M16 12h.01 M19 15h.01',
'chevron-left':'m15 18-6-6 6-6','chevron-right':'m9 18 6-6-6-6','circle':'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z','circle-check':'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z m8 12 3 3 5-6'
}
export default function GameIcon({name,size=20,className='',title}:GameIconProps){
 const d=iconPaths[name]??iconPaths['book-open']
 return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" role={title?'img':undefined} aria-label={title} aria-hidden={title?undefined:true} focusable="false"><path d={d}/></svg>
}
