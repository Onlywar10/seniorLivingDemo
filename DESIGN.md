# Design

Tokens and shared patterns live in `src/app/globals.css`; each page area keeps its own prefixed CSS (`.hm-` home, `.br-` brand pages, `.cal-` calendar, `.din-` dining, `.fp-`/`.vt-` floor plans and tours, `.ca-`/`.cc-` tools, `.tr-`/`.ct-`/`.sc-`/`.tm-`/`.nw-`/`.cr-`/`.inf-` info pages, `.chat-` chat, `.sx-` staff system).

- Colour: the palette of the Tenfold websites, shared by the parent site, every community and the staff system. Slate `#415a68` for structure (token `--green`, a name kept from the first build); brick red `#bf4142` for action (token `--terra`; deep variant `#b33536` for AA buttons) and the italic accent word in headings; gold `#d0c588` on dark slate; blue-grey `#7591a1` (the band under the header) and sage `#a3b0a2` as accents; cool sage-tinted grounds. Bright greens are kept only for "open / live / online" status, and the calendar categories keep their own colours.
- Type: Libre Baskerville 400 for headings with one italic brick-red word; Montserrat 400–600 for everything else; uppercase tracked eyebrows.
- Shape: 18px cards, pill buttons, photos with one oversized rounded corner.
- Motif: the Tenfold confetti crescent (`/img/brand/dots.svg|png`), used sparingly as a corner accent.
- Photography: Prairie City Landing and Bruceville Point photos from Tenfold, plus a few food and seasonal photos.
