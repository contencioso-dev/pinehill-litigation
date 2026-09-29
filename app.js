let sb=null,view='dashboard',cases=[],deadlines=[],profiles=[];let currentCase=null;
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=n=>new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n||0));
const date=s=>s?new Intl.DateTimeFormat('pt-PT',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(s)):'—';
const shortDate=s=>{if(!s)return{d:'—',m:''};const x=new Date(s);return{d:String(x.getDate()).padStart(2,'0'),m:new Intl.DateTimeFormat('pt-PT',{month:'short'}).format(x).replace('.','')}};
function badge(s){return '<span class="badge">'+esc(s||'—')+'</span>'}
function nameFor(id){return profiles.find(p=>p.id===id)?.full_name||'—'}
function setHead(title,sub,crumb='LEGAL OPERATIONS'){ $('#title').textContent=title;$('#subtitle').textContent=sub||'';$('#crumb').textContent=crumb }
async function loadData(){
 const [{data:c,error:ce},{data:d,error:de},{data:p,error:pe}]=await Promise.all([
  sb.from('cases').select('*').order('created_at',{ascending:false}),
  sb.from('deadlines').select('*').order('due_at',{ascending:true}),
  sb.from('profiles').select('id,full_name,email,department,job_title,is_active')
 ]);
 if(ce)throw ce;if(de)throw de;if(pe)throw pe;cases=c||[];deadlines=d||[];profiles=p||[];render();
}
function caseTable(list){
 if(!list.length)return '<div class="empty">Ainda não existem processos acessíveis.</div>';
 return '<div class="table-wrap"><table><thead><tr><th>Processo</th><th>Entidade</th><th>Tipo</th><th>Estado</th><th>Responsável</th><th>Valor do ato</th></tr></thead><tbody>'+
 list.map(c=>'<tr class="clickable" onclick="openCase(\''+c.id+'\')"><td class="case-number">'+esc(c.case_number)+'</td><td>'+esc(c.counterparty||c.client_entity||c.title||'—')+'</td><td>'+esc(c.case_type||'—')+'</td><td>'+badge(c.status)+'</td><td>'+esc(nameFor(c.responsible_id))+'</td><td>'+money(c.act_value)+'</td></tr>').join('')+
 '</tbody></table></div>';
}
function dashboard(){
 setHead('Dashboard','Visão geral do contencioso');
 const active=cases.filter(c=>!c.closed_on).length, total=cases.reduce((a,c)=>a+Number(c.act_value||0),0);
 const upcoming=deadlines.filter(d=>new Date(d.due_at)>=new Date()).slice(0,6);
 $('#content').innerHTML=
 '<div class="grid metrics">'+
 '<div class="card metric"><div class="metric-label">Processos ativos</div><div class="metric-value">'+active+'</div><div class="metric-meta">processos sob gestão</div></div>'+
 '<div class="card metric"><div class="metric-label">Prazos em aberto</div><div class="metric-value">'+deadlines.filter(d=>d.status!=='Concluído').length+'</div><div class="metric-meta">agenda processual</div></div>'+
 '<div class="card metric"><div class="metric-label">Valor dos atos</div><div class="metric-value">'+money(total)+'</div><div class="metric-meta">valor agregado acessível</div></div>'+
 '<div class="card metric"><div class="metric-label">Utilizadores</div><div class="metric-value">'+profiles.filter(p=>p.is_active).length+'</div><div class="metric-meta">perfis ativos</div></div></div>'+
 '<div class="grid split"><section class="card card-pad"><div class="section-title"><div><h2>Processos recentes</h2><div class="hint">Últimos processos a que tem acesso</div></div><button class="btn btn-ghost" onclick="view=\'processes\';render()">Ver todos</button></div>'+caseTable(cases.slice(0,7))+'</section>'+
 '<section class="card card-pad"><div class="section-title"><div><h2>Próximos prazos</h2><div class="hint">Agenda pessoal e de equipa</div></div></div><div class="deadline-list">'+
 (upcoming.length?upcoming.map(d=>{const x=shortDate(d.due_at);return '<div class="deadline deadline-row"><div class="datebox"><b>'+x.d+'</b><small>'+x.m+'</small></div><div><b>'+esc(d.title)+'</b><span>'+esc(nameFor(d.responsible_id))+' · '+esc(d.status)+'</span></div></div>'}).join(''):'<div class="empty">Sem prazos próximos.</div>')+
 '</div></section></div>';
}
function processes(){
 setHead('Processos','Gestão e acompanhamento');
 $('#content').innerHTML='<div class="toolbar"><div class="toolbar-group"><input id="filter" placeholder="Pesquisar processo, entidade, tribunal..." oninput="filterCases()"><select id="statusFilter" onchange="filterCases()"><option value="">Todos os estados</option><option>Em preparação</option><option>Ativo</option><option>Em contestação</option><option>Em recurso</option></select></div><button class="btn btn-primary" onclick="openNewCase()">+ Novo processo</button></div><section class="card card-pad" id="list">'+caseTable(cases)+'</section>';
}
function deadlinesView(){
 setHead('Prazos','Agenda processual');
 $('#content').innerHTML='<section class="card card-pad"><div class="section-title"><div><h2>Prazos</h2><div class="hint">Compromissos e datas limite</div></div></div><div class="deadline-list">'+
 (deadlines.length?deadlines.map(d=>{const x=shortDate(d.due_at);return '<div class="deadline deadline-row"><div class="datebox"><b>'+x.d+'</b><small>'+x.m+'</small></div><div><b>'+esc(d.title)+'</b><span>'+date(d.due_at)+' · '+esc(nameFor(d.responsible_id))+' · '+esc(d.status)+'</span></div></div>'}).join(''):'<div class="empty">Sem prazos acessíveis.</div>')+'</div></section>';
}
function usersView(){
 setHead('Utilizadores','Perfis e permissões','ADMINISTRAÇÃO');
 $('#content').innerHTML='<section class="card card-pad"><div class="section-title"><div><h2>Utilizadores e acessos</h2><div class="hint">O acesso efetivo é limitado por processo através de RLS</div></div></div>'+
 (profiles.length?'<div class="table-wrap"><table><thead><tr><th>Nome</th><th>Email</th><th>Função</th><th>Departamento</th><th>Estado</th></tr></thead><tbody>'+profiles.map(p=>'<tr><td><strong>'+esc(p.full_name)+'</strong></td><td>'+esc(p.email||'—')+'</td><td>'+esc(p.job_title||'—')+'</td><td>'+esc(p.department||'—')+'</td><td>'+badge(p.is_active?'Ativo':'Inativo')+'</td></tr>').join('')+'</tbody></table></div>':'<div class="empty">Sem perfis acessíveis.</div>')+'</section>';
}
function adminView(){
 setHead('Administração','Configuração da plataforma','ADMINISTRAÇÃO');
 $('#content').innerHTML='<div class="grid split"><section class="card card-pad"><div class="section-title"><h2>Infraestrutura</h2></div><div class="kv"><small>Aplicação</small><strong>Railway</strong></div><div class="kv"><small>Base de dados & autenticação</small><strong>Supabase</strong></div><div class="kv"><small>Repositório documental</small><strong>Google Drive — ligação pendente</strong></div></section><section class="card card-pad"><div class="section-title"><h2>Segurança</h2></div><div class="kv"><small>Autorização</small><strong>Por utilizador e processo</strong></div><div class="kv"><small>Proteção de dados</small><strong>Row Level Security</strong></div><div class="kv"><small>Auditoria</small><strong>Estrutura ativa</strong></div></section></div>';
}
function render(){
 document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 if(view==='dashboard')dashboard();else if(view==='processes')processes();else if(view==='deadlines')deadlinesView();else if(view==='users')usersView();else adminView();
}
function filterCases(){
 const q=($('#filter')?.value||'').toLowerCase(), s=$('#statusFilter')?.value||'';
 const list=cases.filter(c=>(!s||c.status===s)&&JSON.stringify(c).toLowerCase().includes(q));
 $('#list').innerHTML=caseTable(list);
}
async function openCase(id){
 const c=cases.find(x=>x.id===id);if(!c)return;currentCase=c;
 setHead('Processos',c.case_number,'PROCESSO');
 const cds=deadlines.filter(d=>d.case_id===id);
 $('#content').innerHTML='<section class="card page-card"><div class="case-hero"><div><div class="eyebrow">'+esc(c.case_type||'PROCESSO')+'</div><h2>'+esc(c.case_number)+' · '+esc(c.title)+'</h2><p>'+esc(c.court||'Tribunal não indicado')+(c.judicial_number?' · '+esc(c.judicial_number):'')+'</p></div><div class="hero-actions">'+badge(c.status)+'<button class="btn btn-ghost" onclick="view=\'processes\';render()">Voltar</button></div></div>'+
 '<div class="tabs"><button class="active">Resumo</button><button onclick="showDocs(\''+id+'\')">Documentos</button><button onclick="showCaseDeadlines(\''+id+'\')">Prazos</button><button onclick="showTeam(\''+id+'\')">Equipa & acessos</button></div>'+
 '<div class="case-body"><div class="grid details"><div class="info-card"><h3>Responsabilidade</h3><div class="kv"><small>Responsável</small><strong>'+esc(nameFor(c.responsible_id))+'</strong></div><div class="kv"><small>Departamento</small><strong>'+esc(c.department||'—')+'</strong></div></div>'+
 '<div class="info-card"><h3>Informação processual</h3><div class="kv"><small>Tipo</small><strong>'+esc(c.case_type||'—')+'</strong></div><div class="kv"><small>Abertura</small><strong>'+date(c.opened_on)+'</strong></div></div>'+
 '<div class="info-card"><h3>Financeiro</h3><div class="kv"><small>Valor do ato</small><strong>'+money(c.act_value)+'</strong></div><div class="kv"><small>Moeda</small><strong>'+esc(c.currency||'EUR')+'</strong></div></div></div>'+
 '<div class="grid two-col"><div class="info-card"><h3>Descrição</h3><p style="font-size:13px;line-height:1.6;color:#687587">'+esc(c.description||'Sem descrição registada.')+'</p></div><div class="info-card"><h3>Próximos prazos</h3>'+(cds.length?cds.slice(0,4).map(d=>'<div class="deadline"><b>'+esc(d.title)+'</b><span>'+date(d.due_at)+' · '+esc(d.status)+'</span></div>').join(''):'<div class="empty">Sem prazos associados.</div>')+'</div></div></div></section>';
}
async function showDocs(id){
 const {data,error}=await sb.from('documents').select('*').eq('case_id',id).order('created_at',{ascending:false});
 if(error)return alert(error.message);
 const c=cases.find(x=>x.id===id);setHead('Documentos',c?.case_number||'Processo','PROCESSO');
 $('#content').innerHTML='<section class="card card-pad"><div class="section-title"><div><h2>Documentos do processo</h2><div class="hint">Os ficheiros permanecem alojados no Google Drive</div></div><button class="btn btn-ghost" onclick="openCase(\''+id+'\')">Voltar ao processo</button></div>'+
 (data?.length?'<div class="table-wrap"><table><thead><tr><th>Documento</th><th>Categoria</th><th>Confidencialidade</th><th>Data</th></tr></thead><tbody>'+data.map(d=>'<tr><td>'+(d.drive_web_url?'<a class="link" href="'+esc(d.drive_web_url)+'" target="_blank" rel="noopener">'+esc(d.name)+'</a>':esc(d.name))+'</td><td>'+esc(d.category||'—')+'</td><td>'+badge(d.confidentiality)+'</td><td>'+date(d.document_date||d.created_at)+'</td></tr>').join('')+'</tbody></table></div>':'<div class="empty">Ainda não existem documentos associados no Google Drive.</div>')+'</section>';
}
function showCaseDeadlines(id){ const list=deadlines.filter(d=>d.case_id===id);const c=cases.find(x=>x.id===id);setHead('Prazos',c?.case_number||'Processo','PROCESSO');$('#content').innerHTML='<section class="card card-pad"><div class="section-title"><h2>Prazos do processo</h2><button class="btn btn-ghost" onclick="openCase(\''+id+'\')">Voltar</button></div><div class="deadline-list">'+(list.length?list.map(d=>'<div class="deadline"><b>'+esc(d.title)+'</b><span>'+date(d.due_at)+' · '+esc(nameFor(d.responsible_id))+' · '+esc(d.status)+'</span></div>').join(''):'<div class="empty">Sem prazos associados.</div>')+'</div></section>'}
async function showTeam(id){const {data,error}=await sb.from('case_members').select('*').eq('case_id',id);if(error)return alert(error.message);const c=cases.find(x=>x.id===id);setHead('Equipa & acessos',c?.case_number||'Processo','PROCESSO');$('#content').innerHTML='<section class="card card-pad"><div class="section-title"><div><h2>Equipa do processo</h2><div class="hint">Permissões aplicadas individualmente</div></div><button class="btn btn-ghost" onclick="openCase(\''+id+'\')">Voltar</button></div>'+(data?.length?'<div class="table-wrap"><table><thead><tr><th>Utilizador</th><th>Nível</th><th>Editar</th><th>Documentos</th><th>Notas internas</th></tr></thead><tbody>'+data.map(m=>'<tr><td>'+esc(nameFor(m.user_id))+'</td><td>'+esc(m.access_level)+'</td><td>'+badge(m.can_edit?'Sim':'Não')+'</td><td>'+badge(m.can_view_documents?'Sim':'Não')+'</td><td>'+badge(m.can_view_internal_notes?'Sim':'Não')+'</td></tr>').join('')+'</tbody></table></div>':'<div class="empty">Ainda não existem colaboradores adicionais atribuídos.</div>')+'</section>'}
function openNewCase(){
 $('#modalRoot').innerHTML='<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modal-head"><h2>Novo processo</h2><button class="icon-btn" onclick="closeModal()">×</button></div><form id="caseForm"><div class="modal-body"><div class="form-grid"><label>Número interno<input name="case_number" required placeholder="2026/0151"></label><label>Título / entidade<input name="title" required></label><label>Tipo<select name="case_type"><option>Comercial</option><option>Laboral</option><option>Civil</option><option>Administrativo</option><option>Fiscal</option><option>Outro</option></select></label><label>Estado<select name="status"><option>Em preparação</option><option>Ativo</option><option>Em contestação</option><option>Em recurso</option></select></label><label>Tribunal<input name="court"></label><label>N.º judicial<input name="judicial_number"></label><label>Valor do ato<input name="act_value" type="number" min="0" step="0.01"></label><label>Data de abertura<input name="opened_on" type="date"></label><label class="wide">Descrição<textarea name="description" rows="4"></textarea></label></div></div><div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button class="btn btn-primary">Criar processo</button></div></form></div></div>';
 $('#caseForm').onsubmit=createCase;
}
function closeModal(){$('#modalRoot').innerHTML=''}
async function createCase(e){e.preventDefault();const f=new FormData(e.target);const {data:{user}}=await sb.auth.getUser();const payload=Object.fromEntries(f.entries());payload.act_value=Number(payload.act_value||0);payload.currency='EUR';payload.created_by=user.id;payload.responsible_id=user.id;if(!payload.opened_on)payload.opened_on=new Date().toISOString().slice(0,10);const {error}=await sb.from('cases').insert(payload);if(error)return alert(error.message);closeModal();await loadData();view='processes';render()}
async function init(){
 const cfg=await fetch('/config',{cache:'no-store'}).then(r=>r.json());if(!cfg.supabaseUrl||!cfg.supabasePublishableKey)throw new Error('Configuração Supabase indisponível');
 sb=supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
 document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{view=b.dataset.view;render()});
 window.openCase=openCase;window.filterCases=filterCases;window.openNewCase=openNewCase;window.closeModal=closeModal;window.showDocs=showDocs;window.showCaseDeadlines=showCaseDeadlines;window.showTeam=showTeam;
 $('#globalSearch').oninput=e=>{const q=e.target.value.toLowerCase();if(!q)return;const c=cases.find(c=>JSON.stringify(c).toLowerCase().includes(q));if(c)openCase(c.id)};
 $('#logoutBtn').onclick=()=>sb.auth.signOut();
 $('#loginBtn').onclick=async()=>{const email=$('#emailInput').value.trim();if(!email)return;$('#loginMsg').textContent='A enviar...';const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin}});$('#loginMsg').textContent=error?error.message:'Link enviado. Verifique o email.'};
 async function sync(){const {data:{session}}=await sb.auth.getSession();$('#loginView').classList.toggle('hidden',!!session);$('#appView').classList.toggle('hidden',!session);if(session){try{await loadData()}catch(e){$('#content').innerHTML='<section class="card card-pad"><h2>Sem acesso</h2><p>'+esc(e.message)+'</p></section>'}}}
 sb.auth.onAuthStateChange(()=>sync());sync();
}
init().catch(e=>{$('#loginMsg').textContent=e.message});