# -*- coding: utf-8 -*-
"""Read-only architecture-readiness + montage + VO audit for donor."""
import psycopg2
PFX="7e660000-0000-4000-8000-"; PROJ=PFX+"000000000001"
cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cur=cx.cursor()
def q(sql,args=(PROJ,)):
    cur.execute(sql,args); return cur.fetchall()

print("== counts ==")
print("shots     :", q('SELECT count(*) FROM shots WHERE "projectId"=%s')[0][0])
print("scenes    :", q('SELECT count(*) FROM scenes WHERE "projectId"=%s')[0][0])
print("chars     :", q('SELECT count(*) FROM project_characters WHERE "projectId"=%s')[0][0])
print("profiles  :", q('SELECT count(*) FROM character_profiles cp JOIN characters c ON cp."characterId"=c.id WHERE c."projectId"=%s')[0][0])
print("locations :", q('SELECT count(*) FROM locations WHERE "projectId"=%s')[0][0])
print("bgm blocks:", q('SELECT count(*) FROM narrative_blocks WHERE "projectId"=%s')[0][0])
print("participants:", q('SELECT count(*) FROM shot_participants sp JOIN shots s ON sp."shotId"=s.id WHERE s."projectId"=%s')[0][0])

print("\n== project NOT NULL fields ==")
row=q('SELECT "visualStyle","defaultNegative","defaultVideoNegative","defaultMotionPrompt","defaultStaticMotionPrompt", (settings->\'styleLora\'->>\'name\'), length("scriptText") FROM projects WHERE id=%s')[0]
print("visualStyle=%s styleLora=%s scriptLen=%s allDefaults=%s"%(row[0],row[5],row[6],all(row[1:5])))

print("\n== per-shot completeness (all should be 0 except intended null-locations) ==")
print("no narration :", q('SELECT count(*) FROM shots WHERE "projectId"=%s AND trim(coalesce("narrationText",\'\'))=\'\' AND "isBroll" IS NOT TRUE')[0][0])
print("no positive  :", q('SELECT count(*) FROM shots WHERE "projectId"=%s AND coalesce("promptFields"->>\'positive\',\'\')=\'\'')[0][0])
print("no sceneId   :", q('SELECT count(*) FROM shots WHERE "projectId"=%s AND "sceneId" IS NULL')[0][0])
print("no routeKey  :", q('SELECT count(*) FROM shots WHERE "projectId"=%s AND coalesce("workflowRouteKey",\'\')=\'\'')[0][0])
print("empty motion :", q('SELECT count(*) FROM shots WHERE "projectId"=%s AND coalesce("promptFields"->>\'motionPrompt\',\'\')=\'\'')[0][0])
print("env animated :", q('SELECT count(*) FROM shots WHERE "projectId"=%s AND "workflowRouteKey" LIKE %s AND "renderMode"=%s',(PROJ,'%environment','animated'))[0][0])
print("char no ref  :", q('SELECT count(*) FROM shots WHERE "projectId"=%s AND "workflowRouteKey" LIKE %s AND "referenceProfileId" IS NULL',(PROJ,'%character%'))[0][0])
print("env has ref  :", q('SELECT count(*) FROM shots WHERE "projectId"=%s AND "workflowRouteKey" LIKE %s AND "referenceProfileId" IS NOT NULL',(PROJ,'%environment'))[0][0])
print("null-location (info):", q('SELECT count(*) FROM shots WHERE "projectId"=%s AND "locationId" IS NULL')[0][0])

print("\n== VO ==")
print("nodot (f5)   :", q("SELECT count(*) FROM shots WHERE \"projectId\"=%s AND trim(coalesce(\"narrationText\",''))<>'' AND \"narrationText\" !~ '[.!?…]\\s*$'")[0][0])
print("short <12 wrd:", q("SELECT count(*) FROM shots WHERE \"projectId\"=%s AND trim(coalesce(\"narrationText\",''))<>'' AND array_length(regexp_split_to_array(trim(\"narrationText\"),'\\s+'),1) < 12")[0][0])
tot=q("SELECT sum(array_length(regexp_split_to_array(trim(\"narrationText\"),'\\s+'),1)) FROM shots WHERE \"projectId\"=%s AND trim(coalesce(\"narrationText\",''))<>''")[0][0]
ns=q("SELECT count(*) FROM shots WHERE \"projectId\"=%s AND trim(coalesce(\"narrationText\",''))<>''")[0][0]
print("voiced shots :", ns, " total words:", tot, " est minutes ~", round((tot/140.0)+ (q('SELECT count(*) FROM shots WHERE \"projectId\"=%s')[0][0]*0.5)/60,1))

print("\n== montage: 3-in-a-row same scale group within a scene ==")
runs=q('''WITH seq AS (
  SELECT sc."sceneKey", sh."shotCode",
    CASE WHEN sh."shotType" IN ('EWS','WS') THEN 'W'
         WHEN sh."shotType" IN ('MS','MCU','OTS','BACK','POV') THEN 'M' ELSE 'C' END g,
    lag(CASE WHEN sh."shotType" IN ('EWS','WS') THEN 'W'
         WHEN sh."shotType" IN ('MS','MCU','OTS','BACK','POV') THEN 'M' ELSE 'C' END) OVER w p1,
    lag(CASE WHEN sh."shotType" IN ('EWS','WS') THEN 'W'
         WHEN sh."shotType" IN ('MS','MCU','OTS','BACK','POV') THEN 'M' ELSE 'C' END,2) OVER w p2
  FROM shots sh JOIN scenes sc ON sh."sceneId"=sc.id
  WHERE sh."projectId"=%s
  WINDOW w AS (PARTITION BY sc.id ORDER BY sh."shotCode"))
SELECT "sceneKey","shotCode" FROM seq WHERE g=p1 AND g=p2 ORDER BY "shotCode"''')
print("3-runs:", (", ".join("%s/%s"%(k,c) for k,c in runs) if runs else "0"))

print("\n== iconic per act ==")
for k,tot,ic in q('''SELECT sc."sceneKey", count(*), count(*) FILTER (WHERE sh."isIconic")
  FROM shots sh JOIN scenes sc ON sh."sceneId"=sc.id WHERE sh."projectId"=%s GROUP BY sc."sceneKey", sc."sortOrder" ORDER BY sc."sortOrder"'''):
    print("  %-12s %2d shots, %d iconic"%(k,tot,ic))

print("\n== banned Track-B leak greps (dialogue false-positives possible) ==")
for name,rx in [("anthropomorph","(город дышал|ночь смотрела|поезд греется)"),("rib-tickle","(за рёбр|щекотк|ветерок|качани)")]:
    n=q("SELECT count(*) FROM shots WHERE \"projectId\"=%s AND \"narrationText\" ~ %s",(PROJ,rx))[0][0]
    print("  %-14s: %d"%(name,n))
cur.close(); cx.close()
