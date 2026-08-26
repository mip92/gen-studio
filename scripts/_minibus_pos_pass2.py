# -*- coding: utf-8 -*-
"""Второй проход позитивов minibus: поза → действие.

Чекер нашёл 34 кадра, где позитив описывал ПОЗУ («Олег с рукой на рычаге»,
«педаль лежит на полу»), а не СОБЫТИЕ. Это ровно та жалоба пользователя, из
которой выросло правило: из позитива должно быть однозначно понятно, что
происходит в кадре, и на кадре с человеком действие должно быть ЕГО.

Правило кадра: камера → корпус → что делает руками с конкретным предметом →
что от этого меняется → свет. Бюджет 55 слов не растёт: место под действие
берётся из выброшенных описаний позы.

    python scripts/_minibus_pos_pass2.py            # сухой прогон
    python scripts/_minibus_pos_pass2.py --apply
"""
import io
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

POS = {
"A1_SH04": "wide shot at eye level, the shelter across its full width with eight people crowding forward under the panel as the bus noses in, a boy at the open end yanking his hood up too late while the rain flattens his hair, water sluicing off the panel edge",
"A1_SH09": "wide shot at eye level, the terminus across its full width with six minibuses nosed into the kerb, Arkady walking at Oleg over the wet asphalt with the zipped folder held out, Oleg stepping down off his cab step and wiping his palms down his thighs",
"A2_SH06": "medium shot at eye level, Arkady slapping his palm twice against the yellow side panel, Oleg rubbing the stencilled route number on the windscreen glass with his thumb, both of them turned three-quarters to the bus",
"A2_SH17": "wide shot at eye level, the terminus at first light across its full width, six minibuses nosed into the kerb with the fog on their windscreens thinning from the bottom edge upward, frost melting off the bent route board, the hatch still shut",
"A4_SH09": "extreme close-up at eye level, a scratched dashboard clock with its minute hand dropping onto the next division, a lap time hand-written on a strip of tape peeling away beside it, dust shaking loose in the seams of the plastic bezel",
"A4_SH12": "medium close-up at eye level, Oleg pushing his shoulders back into the seat and blowing a breath out through his nose, both hands returning to the top of the wheel, his eyes going back to the road past the mirror",
"A4_SH15": "wide shot at eye level, the lit booth hatch with a banded stack of notes sliding in through the opening and the queue rail emptying beside it, the ruled shift sheet showing under its glass, the other buses still out on the line",
"A4_SH16": "medium shot at eye level, Arkady leaning out of the booth doorway with the folder under one arm, Oleg turning back toward him and pushing his own thin fold of notes down into his hip pocket, the yellow hatch light between them",
"A4_SH18": "wide shot at eye level, the kitchen table across its full width with a folded stack of notes beside a covered plate and its top note unfolding slowly against the plate rim, one stool pushed back, only the window glow on the laminate",
"A5_SH05": "medium shot at eye level, Zina raising one arm out toward the road with her weight coming onto her forward foot, lifting the clouded pass sleeve in her other hand, the checked trolley tipping against her hip",
"A6_SH04": "medium shot at eye level, Zina lifting the trolley sideways onto the bus step with both hands while Oleg reaches out of the driver seat, catching its far end and pulling it in over the sill",
"A6_SH05": "close-up at eye level, two thin fingers turning the clouded pass sleeve toward the light and rubbing its fogged front clear with a thumb, the perished elastic sliding down over the knuckle",
"A6_SH14": "medium close-up at eye level, Oleg pushing the gearshift up into the next gear and keeping his eyes hard on the far road, his shoulders staying square while the mirror swings unwatched above him",
"A6_SH17": "wide shot at eye level, the minibus swinging hard into the shelter with its door running open and the checked trolley coming up onto the step, the amber indicator pulsing, the queue closing up behind it",
"A6_SH19": "close-up from directly above, two thin hands shifting their grip one over the other on the trolley handle and closing again harder, the checked fabric creasing where the knuckles press it",
"A6_SH20": "extreme close-up at eye level, the foam of an empty window seat rising slowly out of a shallow dent, a scuff of wheel rubber drying on the seat frame beside it, daylight moving through the fogged glass above",
"A7_SH03": "close-up from directly above the pedal box, the clutch pedal flat on the floor mat with its return spring swinging free of the bracket it has torn out of, grit sliding down into the ribs of the mat",
"A7_SH10": "wide shot at eye level, the terminus at dawn with the repaired bus back in the row and the last of the wiper water running down its cleaned windscreen, frost still melting off the buses either side of it",
"A7_SH16": "medium close-up at eye level, Arkady turning one page of the lease copy over on the counter with two fingers and pressing it flat, the folder lying open under his forearm, the hatch light hard on his combed-back hair",
"A7_SH17": "close-up at eye level, Oleg dragging his gaze up off the empty tin box to the black windscreen and closing his jaw, the instrument cluster lighting him from below",
"A8_SH04": "full-length shot at eye level, Oleg lowering a route sheet in his fist as Mila walks past him along the bus toward the gate, neither of them turning to the other, his other hand still flat on the open cab door",
"A8_SH12": "medium close-up at eye level, Mila pushing off the kitchen door frame with her shoulder and dropping her folded arms to her sides, her chin coming up toward the table, the dark hallway behind her",
"A8_SH15": "wide shot at eye level, four pupils filing up into the open bus door at the school shelter with a gap left where nobody is standing, backpacks swinging as they climb, low sun crossing the empty pavement",
"A8_SH18": "medium close-up at eye level, Oleg tipping his head back toward one lit window high in the block and drawing his shoulders in against the cold, his breath showing in the mast light",
"A9_SH04": "medium shot at eye level, Oleg sliding a hand's width lower in the seat as his chin drops onto his chest and his shoulders go slack, the wheel turning free in front of his loosening hands",
"A9_SH08": "wide shot at eye level, the packed salon across its full width with every face bent down over a phone or a window, one slack hand sliding along the roof rail and re-gripping, the cab doorway empty and bright at the far end",
"A9_SH16": "medium close-up at eye level, Oleg snapping upright and locking both hands high on the wheel, his eyes fixing on the red light and his shoulders lifting rigid, dash glow hard under his chin",
"A9_SH17": "close-up from directly above, two hands crushing the wheel rim at ten and two with the knuckles blanching, the leather compressing under the grip, dash light hard on the raised tendons",
"A10_SH02": "wide shot at eye level, the clinic corridor across its full width with one numbered door drifting open on its closer and the light on the linoleum widening through it, the bolted chair row along the far wall, a trolley parked between two doors",
"A10_SH03": "medium close-up at eye level, Oleg turning his forearm over on the trolley edge as the cuff tightens on his upper arm, his pushed-up sleeve bunching at the elbow, a white sleeve squeezing the bulb beside it",
"A10_SH04": "close-up from directly above, the needle of a blood-pressure gauge dropping back and settling well past the marked band, the cuff edge deflating below it, a pen rolling to a stop on the record card beside",
"A10_SH08": "medium close-up at eye level, Oleg folding the certificate in half against his thigh and lifting his eyes off the corridor floor, his shoulders dropping as the tube light flattens his face",
"A10_SH16": "wide shot at eye level, the kitchen at night with the lease copy spread over the whole table and its top sheet lifting at one corner and settling back, two stools pushed back at different angles, the calendar bare of new rings",
"FIN_SH07": "close-up at eye level, Zina turning back from inside the doorway with her chin coming round over her shoulder and her hand tightening on the frame, the trolley already in ahead of her",
}

# «потому что» было три раза при норме два — снимаю самое служебное.
VO = {
"A3_SH15": "домой ты идёшь пешком: автобус в эту сторону ходит до одиннадцати.",
}

TARGET = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed_minibus_shots.py")


def main():
    apply = "--apply" in sys.argv
    src = io.open(TARGET, encoding="utf-8").read().split("\n")
    changed = 0
    for i, line in enumerate(src):
        m = re.match(r'^\("([A-Z0-9_]+)",', line)
        if not m:
            continue
        code = m.group(1)
        # ru на i+1, positive на i+2
        for off, table in ((1, VO), (2, POS)):
            if code not in table:
                continue
            j = i + off
            if not re.match(r'^ ".*",$', src[j]):
                print(f"  ! {code}: строка {off} не на своём месте, пропуск")
                continue
            new = table[code].replace('"', '\\"')
            if src[j][2:-2] == new:
                continue
            src[j] = f' "{new}",'
            changed += 1
    print(f"к замене строк: {changed} (позитивов {len(POS)}, VO {len(VO)})")
    if apply and changed:
        io.open(TARGET, "w", encoding="utf-8", newline="\n").write("\n".join(src))
        print("применено")
    elif not apply:
        print("сухой прогон, для записи --apply")


if __name__ == "__main__":
    main()
