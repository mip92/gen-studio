# Desk-prop sprites — sources

Transparent-PNG sprites for the comic export's desk (см. `comic_desk_props.py`).
The desk is seen from straight above, so every sprite must be a TOP view —
isometric/3-quarter product shots read as floating (user 2026-08-01). Mostly
pngimg.com (free for non-commercial use with attribution; swap for own
renders/photos if the films ever need a cleaner licence):

| file | source | view |
|---|---|---|
| spinner.png | https://pngimg.com/uploads/spinner/spinner_PNG20.png | top (bright yellow — the old blue one drowned in the vignette) |
| rubik.png | synthesized (PIL, no photo source) — top face, scrambled classic stickers | top |
| gum.png | https://pngimg.com/uploads/chewing_gum/chewing_gum_PNG32.png | flat pack, straight-on = top |
| headphones.png | https://pngimg.com/uploads/headphones/headphones_PNG101955.png | lying on the side (side profile = what you see from above) |
| phone.png | https://pngimg.com/image/8513 | top |
| pen.png | uploads/pen/pen_PNG7398.png | lying, side profile = top |
| pencil.png | uploads/pencil/pencil_PNG3861.png | lying diagonal |
| glasses.png | uploads/glasses/glasses_PNG52.png | folded flat |
| scissors.png | uploads/scissors/scissors_PNG17.png | flat |
| sticky.png | uploads/sticky_note/sticky_note_PNG18890.png | pad from above |
| envelope.png | uploads/envelope/envelope_PNG100776.png | flat |
| postcard.png | uploads/postcard/postcard_PNG51.png | flat |
| loupe.png | uploads/loupe/loupe_PNG103254.png | flat |
| calculator.png | uploads/calculator/calculator_PNG102254.png | straight-on = top |
| keys.png | uploads/keychain/keychain_PNG67.png | bunch from above |
| watch.png | uploads/watches/watches_PNG9864.png | full length flat |
| lighter.png | uploads/lighter/lighter_PNG11182.png | zippo flat |
| coins.png | uploads/coin/coin_PNG3550.png | scatter from above |
| banknote.png | uploads/money/money_PNG3524.png | flat |
| coffee.png | uploads/mug_coffee/mug_coffee_PNG16850.png | cup from above |
| cookie.png | uploads/cookie/cookie_PNG13656.png | from above |
| donut.png | uploads/donut/donut_PNG28.png | from above |
| chocolate.png | uploads/chocolate/chocolate_PNG9.png | bar from above |
| apple.png | uploads/apple/apple_PNG12469.png | from above |
| usb.png | uploads/usb/usb_PNG8844.png | flat |
| mouse.png | uploads/computer_mouse/computer_mouse_PNG7665.png | from above |
| gamepad.png | uploads/gamepad/gamepad_PNG39.png | from above |
| cassette.png | uploads/audio_cassette/audio_cassette_PNG16090.png | flat |
| dice.png | composite of uploads/dice/dice_PNG58+59 (two flat top faces) | top |
| cards.png | uploads/cards/cards_PNG8487.png | fan, flat |
| domino.png | uploads/dominoes/dominoes_PNG59.png | pair, flat |
| compass.png | uploads/compass/compass_PNG103401.png | dial from above |

Normalised on import: RGBA, alpha-bbox-trimmed, long side ≤ 1400 px (sized for
supersample 4 — a prop ~0.2 of frame height needs ≈ 0.2·1080·4 ≈ 860 px).
