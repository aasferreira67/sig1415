import psycopg2

HOST="127.0.0.1"
PORT="5432"
DB="routing2"
USER="geoserver"
PASS="geoserver"
conn = psycopg2.connect("host=%s port=%s dbname=%s user=%s password=%s" % (HOST, PORT, DB, USER, PASS))
cur = conn.cursor()



""" Preparar colunas e dados para driving distance """
try:
    print cur.execute('ALTER TABLE rede_viaria_bv ADD COLUMN dd_cost double precision DEFAULT -1;')
    print cur.execute('ALTER TABLE rede_viaria_bv ADD COLUMN dd_reverse_cost double precision DEFAULT -1;')
except:
    conn.rollback()
    pass
else:
    print "commit tables"
    conn.commit()


classToRemove = (1,2,3,11,12,91,92)
cur.execute("SELECT id,clazz,source,target,x1,y1,x2,y2,km,kmh,cost,reverse_cost FROM rede_viaria_bv;")
for row in cur.fetchall():
    id,clazz,source,target,x1,y1,x2,y2,km,kmh,cost,reverse_cost = row
    new_cost, new_rcost = cost, reverse_cost
    if clazz in classToRemove:
        new_cost = -1
    else:
        new_cost, new_rcost = km/10.0, km/10.0

    cur.execute("UPDATE rede_viaria_bv SET dd_cost = %s, dd_reverse_cost = %s WHERE id = %s",
        (new_cost, new_rcost, id))

conn.commit()
