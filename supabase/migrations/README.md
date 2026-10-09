# Migraciones de la base de datos (Supabase)

Copia exacta de las migraciones aplicadas al proyecto `gaviotas-conecta`
(`zaxivsggncaimskheukn`), en orden. Sirven para reconstruir la base de datos
desde cero o para auditar qué cambió y cuándo.

Para ver lo aplicado en el servidor:

```sql
select version, name from supabase_migrations.schema_migrations order by version;
```

Nunca edites un archivo ya aplicado: crea una migración nueva.
