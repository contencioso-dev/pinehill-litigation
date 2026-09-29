# Arquitetura Pine Hill Litigation

- Frontend: aplicação web Pine Hill Litigation
- Auth + base de dados: Supabase
- Documentos: Google Drive (ficheiro nunca duplicado na base de dados)
- Hosting: Railway
- `documents.drive_file_id` e `cases.drive_folder_id` guardam apenas referências ao Drive
- Controlo de acesso: RLS por utilizador/processo + permissões específicas em `case_members`
