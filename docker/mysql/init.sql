-- Necessário para o stancl/tenancy criar automaticamente
-- os bancos ibigan_tenant_* ao cadastrar um novo tenant.
GRANT CREATE, DROP, ALTER, INDEX, REFERENCES ON *.* TO 'dev'@'%';
FLUSH PRIVILEGES;
