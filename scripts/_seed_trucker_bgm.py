# -*- coding: utf-8 -*-
"""trucker BGM blocks (ACE-Step moodPrompts) via API. Run AFTER all shot seeders:
PYTHONIOENCODING=utf-8 python scripts/_seed_trucker_bgm.py"""
import requests

BASE="http://localhost:4000"
SLUG="trucker"

BLOCKS=[
 ("cold_open","Пост, ночь — саспенс",
  "dark cinematic suspense, very slow 55 bpm, no drums, one sustained low synth drone, sparse detuned piano notes, cold metallic shimmer, night-road dread, D minor, close dry production, instrumental, no vocals"),
 ("hired","Долг и наём — усталая надежда",
  "melancholic slavic folk-tinged score, slow 68 bpm, soft brushed percussion, muted accordion breaths, plucked acoustic guitar, weary but hopeful, grey morning warmth, A minor, intimate room sound, instrumental, no vocals"),
 ("school_road","Дорога-школа — тёплый ход",
  "warm americana road groove, steady 92 bpm, soft train-beat brushes on snare, twangy baritone guitar, upright bass, humming organ pad, easy kilometres and growing trust, G major, analog tape warmth, instrumental, no vocals"),
 ("offer","Предложение — холодок",
  "tense minimal electronic underscore, slow 70 bpm, dry ticking rimshot pulse, cold plucked synth, low cello drone underneath, a quiet bad idea taking root, E minor, sparse clinical mix, instrumental, no vocals"),
 ("first_box","Первая коробка — двойное дно",
  "nervous cinematic pulse, 84 bpm, muffled four-on-the-floor heartbeat kick, syncopated muted guitar chops, airy high pad over a dark bass line, guilt under a calm surface, B minor, tight compressed production, instrumental, no vocals"),
 ("escalation","Эскалация — трещина",
  "brooding hybrid score, 76 bpm, industrial brushed metal percussion, detuned piano motif, rising string ostinato, cracks widening in a friendship, F minor, wide cold reverb, instrumental, no vocals"),
 ("confront","Стоянка — разговор",
  "sparse night-time chamber piece, very slow 58 bpm, no drums, solo cello long bows, single warm piano chords far apart, a hard quiet conversation between two men, C minor, close intimate mic, instrumental, no vocals"),
 ("last_time","Последний раз — обречённый ход",
  "slow inexorable cinematic march, 66 bpm, deep soft toms in a heartbeat pattern, low brass swells, thin high violin line, headlights into grey mist, fatalistic and calm, D minor, cinematic depth, instrumental, no vocals"),
 ("catastrophe","Пост — вскрытие",
  "dark ambient dread, very slow 45 bpm, no beat, building low drone with metallic creaks, one hard sub impact then hollow silence, floodlight coldness, sparse bowed strings, D minor, desolate space, instrumental, no vocals"),
 ("aftermath","Семь лет — пустота и термос",
  "hollow neoclassical elegy, slow 52 bpm, no drums, detuned felt piano, distant solo cello, thin winter-air pad, grief settled into routine, A minor, soft tape hiss warmth, instrumental, no vocals"),
 ("coda","Кода — дорога дальше",
  "gentle acoustic postlude, slow 72 bpm, soft fingerpicked acoustic guitar, warm upright bass, faint brushed cymbal, quiet acceptance and morning light, C major fading to A minor, intimate warm mix, instrumental, no vocals"),
]

def main():
    proj=requests.get(f"{BASE}/projects").json()
    pid=next(p["id"] for p in (proj if isinstance(proj,list) else proj.get("projects",proj)) if p.get("slug")==SLUG)
    shots=requests.get(f"{BASE}/projects/{pid}/shots?take=300").json()
    if isinstance(shots,dict): shots=shots.get("shots",shots.get("rows",[]))
    scene_of={}
    for s in shots: scene_of.setdefault(s.get("paletteKey") or "",[]).append(s)
    existing={b["slug"] for b in requests.get(f"{BASE}/bgm/projects/{pid}/blocks").json()}
    made=0
    for i,(key,title,mood) in enumerate(BLOCKS):
        if key in existing: print("skip",key); continue
        ids=[s["id"] for s in sorted(scene_of.get(key,[]),key=lambda x:x["shotCode"])]
        if not ids: print("WARN no shots for",key); continue
        r=requests.post(f"{BASE}/bgm/projects/{pid}/blocks",json={"slug":key,"title":title,"sortOrder":i,"moodPrompt":mood,"shotIds":ids})
        r.raise_for_status(); made+=1
        print("block",key,len(ids),"shots")
    print("OK bgm blocks made=%d"%made)

if __name__=="__main__": main()
