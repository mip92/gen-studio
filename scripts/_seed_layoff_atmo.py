# -*- coding: utf-8 -*-
"""layoff atmosphere breathers — silent env inserts (no VO) at the end of acts A0-A6.
Adds runtime (each silent static shot = NO_VO_US 4s Ken-Burns) + montage breathing.
PYTHONIOENCODING=utf-8 python scripts/_seed_layoff_atmo.py
id_region='a' so ids never collide with main '0' region; codes A{n}_SH5x sort after the act."""
from _layoff_engine import seed_act
MV=["push_in","pull_out","pan_left","tilt_up","static","pan_right"]
# scene_key, palette, [(suffix, subj, shotType, tod)]
ACTS=[
 ("cold_open","cold corporate palette, grey-blue and pale steel, harsh fluorescent light",[
   ("rain sliding down the glass facade of a tall office tower","WS","day"),
   ("a macro of a cold half-finished coffee cup left on a glass meeting table","ECU","day"),
   ("an empty corporate corridor of closed identical doors","MS","day"),
   ("the office tower seen flat against a featureless overcast sky","WS","day"),
   ("a close-up of a flickering fluorescent ceiling panel","CU","day"),
   ("the still empty glass turnstiles of the lobby","MCU","day")]),
 ("origin","warm hopeful palette, amber and honey tones, soft morning light",[
   ("morning sun flaring gold off the glass office tower","WS","morning"),
   ("a close-up of a brand-new employee lanyard card hanging on a hook","CU","morning"),
   ("the open office floor quiet and empty before the workday","WS","morning"),
   ("a small potted plant on a windowsill in warm morning light","MCU","morning"),
   ("a macro of a fresh unused notebook and a new pen on a clean desk","ECU","morning"),
   ("steam rising from a fresh mug of coffee by a sunny window","MS","morning")]),
 ("climb","muted neutral office palette, grey and beige, flat daylight",[
   ("the office tower under a flat grey midday sky","WS","day"),
   ("a close-up of a plain round wall clock in the office","CU","day"),
   ("rows of empty desks during the lunch hour","WS","day"),
   ("a macro of a wall calendar page mid-turn, years crossed out","ECU","day"),
   ("the office kitchenette with a lone kettle and stacked mugs","MS","day"),
   ("a window view of the same grey city across many seasons","MCU","day")]),
 ("signs","cooling office palette, grey-blue and muted steel, overcast light",[
   ("heavy storm clouds gathering over the glass office tower","WS","day"),
   ("a macro of a single forgotten paperclip on a cleared desk","ECU","day"),
   ("drawn blinds glowing on a closed glass meeting room","MS","day"),
   ("an emptied desk with a pale clean rectangle on the wall behind","WS","day"),
   ("a close-up of a humming exit sign in a dim corridor","CU","day"),
   ("a coat left alone on a row of empty office hooks","MCU","day")]),
 ("turn","dim regretful palette, muted teal and grey, low lamp light",[
   ("a rival glass office building across a rainy street at dusk","WS","dusk"),
   ("a macro of a dusty business card at the back of an open drawer","ECU","day"),
   ("a sleepless bedroom window with cold city glow","MS","night"),
   ("the office tower at night with a single lit window","WS","night"),
   ("a close-up of a ceiling crossed by hairline cracks","CU","night"),
   ("an untouched laptop closed on a nightstand in lamp light","MCU","night")]),
 ("catastrophe","cold final palette, hard grey-blue and bleached white, flat light",[
   ("the glass tower under a hard white merciless sky","WS","day"),
   ("a macro of a turnstile card reader glowing steady red","ECU","day"),
   ("an empty cardboard box waiting on an office chair","MS","day"),
   ("the tall glass lobby doors seen from the cold street","WS","day"),
   ("a close-up of an access card dropped in a plastic security tray","ECU","day"),
   ("a single emptied desk under bright fluorescent light","MCU","day")]),
 ("aftermath","hollow muted palette, desaturated grey and washed beige, tired light",[
   ("a grey overcast empty city street in the morning","WS","morning"),
   ("a macro of a kitchen drawer half open over old receipts","ECU","day"),
   ("rain running down a quiet apartment window","CU","day"),
   ("the crowded waiting board of an employment office","WS","day"),
   ("a macro of a thinning pay envelope on a shelf","ECU","day"),
   ("a cold cup of tea going untouched on a kitchen table","MCU","day")]),
]
def expand(items):
    out=[]
    for i,(subj,st,tod) in enumerate(items):
        out.append(("__CODE__%d"%i, None, None, subj, st, "eye", MV[i%len(MV)], tod, True, False, ""))
    return out
if __name__=="__main__":
    for ai,(sk,pal,items) in enumerate(ACTS):
        shots=[("A%d_SH5%d"%(ai,i+1), None, None, subj, st, "eye", MV[i%len(MV)], tod, True, False, "")
               for i,(subj,st,tod) in enumerate(items)]
        seed_act(sk, pal, shots, render_mode="static", id_region="a")
