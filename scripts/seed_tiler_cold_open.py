# -*- coding: utf-8 -*-
"""Seed COLD OPEN (chapter 0) shots for project `tiler`. Idempotent via shotCode.
v2: enriched confessional VO + atmospheric shots."""
from _seed_tiler_act_engine import seed_act

MOOD = "oppressive orange kiln-glow, choking red dust, deep shadow, hopeless enclosed mood"

# code, ch, loc, subj, st, ang, mv, tod, broll, iconic, narr
SHOTS = [
    ("C_SH01", None, "kiln",
     "a vast soot-blackened brick kiln glowing fierce orange in the night, mounds of red-ochre clay and rows of drying bricks, rising heat haze, no people",
     "WS", "high", "push_in", "kiln_night_now", True, False, ""),
    ("C_SH02", "BAKHTI", "kiln",
     "extreme close-up of the master's cracked hands caked in dried red clay, slowly flexing the stiff fingers near the firelight",
     "ECU", "top_down", "static", "kiln_night_now", False, False,
     "холодно мне больше не бывает, понимаешь, я ведь живу у этих печей, и день, и ночь, жар давно въелся в меня, как красная глина под ногти, навсегда."),
    ("C_SH02A", None, "kiln",
     "close-up of sparks streaming up from the kiln into the black air and dying out, no people",
     "CU", "low", "static", "kiln_night_now", True, False,
     "искры летят вверх и гаснут, всю ночь напролёт, как и мы тут."),
    ("C_SH03", "BAKHTI", "kiln",
     "the weary tiler sitting on an upturned crate by the kiln fire, glancing up at someone just arrived, firelight on his lined face",
     "MS", "eye", "static", "kiln_night_now", False, False,
     "тебя сегодня привезли, я видел, как ты слезал с машины, ноги не держат, глаза пустые, знакомое дело. садись ближе, тут теплее, только не перебивай меня, ладно."),
    ("C_SH04", "BAKHTI", "kiln",
     "over the tiler's shoulder, a frightened young newcomer huddled across the fire, shaking and lost",
     "OTS", "over_shoulder", "static", "kiln_night_now", False, False,
     "не дрожи ты так, малой, я тоже когда-то трясся вот так, в первую ночь, был я мастером, плиточником, лучшим в своей долине."),
    ("C_SH05", None, "kiln",
     "close-up of the young newcomer's empty trembling hands held out to the kiln fire for warmth",
     "CU", "eye", "static", "kiln_night_now", False, False, ""),
    ("C_SH06", "BAKHTI", "kiln",
     "close-up of the tiler's firelit face as he begins his story, bitter and resolved",
     "CU", "low", "push_in", "kiln_night_now", False, True,
     "а я расскажу тебе, чьими руками строят дворцы, за которые потом убивают, дослушай до конца, и поймёшь, за что человека вывозят ночью в степь."),
    ("C_SH06A", None, "kiln",
     "wide shot of fine red clay dust drifting over endless rows of drying bricks in the dim factory, no people",
     "WS", "eye", "static", "kiln_night_now", True, False,
     "тут всё красное, понимаешь, и руки, и хлеб, и даже сны."),
    ("C_SH07", None, "kiln",
     "wide shot of two seated silhouettes against the orange kiln mouth in a vast dark factory shed, towering stacks of bricks, no faces",
     "EWS", "eye", "static", "kiln_night_now", False, False,
     "раньше я был мастером, понимаешь, настоящим, таким, к которому ехали со всей долины, кланялись, просили."),
    ("C_SH08", "BAKHTI", "kiln",
     "extreme close-up of a single chipped turquoise glazed ceramic shard held in a red-clay-stained palm, the one spot of cool blue in a red world",
     "ECU", "top_down", "static", "kiln_night_now", False, True, ""),
    ("C_SH09", "BAKHTI", "kiln",
     "the tiler turning the small turquoise shard slowly in his fingers by the fire, a distant faraway look",
     "MS", "eye", "static", "kiln_night_now", False, False,
     "вот, гляди, осколок бирюзы, всё, что у меня осталось от прежней жизни, от дома, от отца, от человека, которым я был."),
    ("C_SH10", None, "kiln",
     "high angle over endless identical rows of raw drying bricks receding into shadow, no people",
     "WS", "high", "static", "kiln_night_now", True, False,
     "тем самым мастером, что своими руками выложил целый дворец у моря, и те бассейны, в которых они потом крутили свою аквадискотеку, дискотеку прямо в воде, для одного человека."),
    ("C_SH10A", None, "kiln",
     "wide shot of the kiln mouth pulsing orange in the dark, heat shimmering the air, no people",
     "WS", "low", "static", "kiln_night_now", True, False,
     "а я тут, у этой печи, кладу кирпич за кирпичом, без счёта и без конца."),
    ("C_SH11", "BAKHTI", "kiln",
     "close-up of the tiler's bitter exhausted face lit red by the kiln, a hard swallow",
     "CU", "eye", "static", "kiln_night_now", False, False,
     "а теперь я раб, без имени, без паспорта, без права просто встать и уйти. и это, парень, вся моя жизнь."),
    ("C_SH12", None, "kiln",
     "slightly tilted shot of the glowing kiln mouth pulsing in the dark, swirling sparks and heat haze, no people",
     "MS", "dutch", "push_in", "kiln_night_now", True, False, ""),
]

if __name__ == "__main__":
    seed_act(0, "kiln_red_now", MOOD, "animated", "COLD OPEN", SHOTS)
