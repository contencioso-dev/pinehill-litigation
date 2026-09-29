# Pine Hill Litigation

MVP funcional da plataforma interna de gestão de contencioso da Pine Hill International.

## Incluído
- Dashboard
- Processos e pesquisa
- Ficha individual de processo
- Criação de processos em modo demonstração
- Campo **Valor do ato**
- Prazos
- Utilizadores e perfis
- Permissões por processo
- Área de administração
- Estrutura preparada para Supabase e Google Drive

## Arquitetura de produção
- Aplicação: Railway
- Autenticação e base de dados: Supabase
- Documentos: Google Drive (sem duplicação permanente no Railway/Supabase)

> Esta versão publicada funciona com dados de demonstração no browser. O backend Supabase já foi criado e a ligação de autenticação/CRUD será ativada na etapa seguinte, juntamente com OAuth do Google Drive.
