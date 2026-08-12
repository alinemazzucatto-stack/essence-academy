import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Bell, BookOpen, CalendarDays, Check, ChevronRight, Clock3, Cloud, Download, Eye, EyeOff, Flame, LayoutDashboard, ListTodo, LogOut, Mail, Menu, Palette, Pencil, Plus, Search, Settings, Target, Timer, Trash2, X } from 'lucide-react'
import './styles.css'
import { supabase } from './supabase'

const initialSubjects = [
  { id: 1, name: 'Matemática', color: '#7c6ee6', goal: 5 },
  { id: 2, name: 'Biologia', color: '#3ebd93', goal: 4 },
  { id: 3, name: 'História', color: '#f3a85f', goal: 3 },
  { id: 4, name: 'Redação', color: '#ea7186', goal: 2 },
]

const initialTasks = [
  { id: 1, title: 'Revisar funções do 2º grau', subject: 'Matemática', date: 'Hoje', duration: 45, done: false },
  { id: 2, title: 'Resumo: genética mendeliana', subject: 'Biologia', date: 'Hoje', duration: 30, done: true },
  { id: 3, title: 'Exercícios de Brasil Colônia', subject: 'História', date: 'Hoje', duration: 40, done: false },
  { id: 4, title: 'Escrever introdução modelo', subject: 'Redação', date: 'Amanhã', duration: 35, done: false },
]

function localIso(date=new Date()) {
  const year=date.getFullYear(),month=String(date.getMonth()+1).padStart(2,'0'),day=String(date.getDate()).padStart(2,'0')
  return year+'-'+month+'-'+day
}
function taskDateIso(value) {
  if(/^\d{4}-\d{2}-\d{2}$/.test(value||''))return value
  const date=new Date()
  if(value==='Amanhã')date.setDate(date.getDate()+1)
  if(value==='Esta semana')return ''
  return localIso(date)
}
function taskDateLabel(value) {
  const iso=taskDateIso(value)
  if(!iso)return value||'Sem data'
  const today=localIso(),tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1)
  if(iso===today)return 'Hoje'
  if(iso===localIso(tomorrow))return 'Amanhã'
  return new Date(iso+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).replace('.','')
}

function isInCurrentWeek(value) {
  const iso=taskDateIso(value)
  if(!iso)return false
  const today=new Date(),day=(today.getDay()+6)%7,start=new Date(today.getFullYear(),today.getMonth(),today.getDate()-day),end=new Date(start)
  end.setDate(start.getDate()+6)
  const date=new Date(iso+'T12:00:00')
  return date>=start&&date<=new Date(end.getFullYear(),end.getMonth(),end.getDate(),23,59,59)
}
function weeklySubjectStats(tasks,subject,sessions=[]) {
  const taskCount=tasks.filter(task=>task.subject===subject.name&&task.done&&isInCurrentWeek(task.completedAt?.slice(0,10)||task.date)).length
  const sessionCount=sessions.filter(session=>session.subject===subject.name&&isInCurrentWeek(session.completedAt?.slice(0,10))).length
  const completed=taskCount+sessionCount
  const goal=Math.max(1,Number(subject.goal)||1)
  return {completed,goal,pct:Math.min(100,Math.round(completed/goal*100))}
}

function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
  })
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value])
  return [value, setValue]
}


function PasswordField({ value, onChange, ...props }) {
  const [visible, setVisible] = useState(false)
  return <div className="password-field"><input {...props} type={visible?'text':'password'} value={value} onChange={onChange}/><button type="button" onClick={()=>setVisible(current=>!current)} aria-label={visible?'Ocultar senha':'Mostrar senha'} title={visible?'Ocultar senha':'Mostrar senha'}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
}

function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const changeMode = next => { setMode(next); setMessage(''); setPassword('') }
  async function submit(e) {
    e.preventDefault(); setLoading(true); setMessage('')
    let result
    if (mode === 'login') result = await supabase.auth.signInWithPassword({ email, password })
    else if (mode === 'signup') result = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
    else result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    if (result.error) {
      const invalid = result.error.message?.toLowerCase().includes('invalid login')
      setMessage(invalid ? 'E-mail ou senha incorretos.' : 'Não foi possível concluir. Verifique os dados e tente novamente.')
    } else if (mode === 'signup' && !result.data?.session) setMessage('Conta criada! Confirme seu e-mail para entrar.')
    else if (mode === 'forgot') setMessage('Enviamos as instruções para redefinir sua senha.')
    setLoading(false)
  }
  const title = mode === 'signup' ? 'Crie sua conta.' : mode === 'forgot' ? 'Recupere sua senha.' : 'Bem-vinda de volta.'
  const description = mode === 'signup' ? 'Use seu e-mail e escolha uma senha para começar.' : mode === 'forgot' ? 'Informe seu e-mail para receber as instruções de recuperação.' : 'Entre com seu e-mail e sua senha.'
  return <main className="auth-screen"><section className="auth-card"><div className="brand auth-brand"><div className="brand-mark"><img src="/essence-academy-logo-ui.png" alt=""/></div><span>Essence<span>Academy</span></span></div><div className="auth-icon"><Mail size={24}/></div><h1>{title}</h1><p>{description}</p><form onSubmit={submit}><label>E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com" autoFocus autoComplete="email"/></label>{mode !== 'forgot'&&<label>Senha<PasswordField required minLength="8" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" autoComplete={mode==='login'?'current-password':'new-password'}/></label>}{mode==='login'&&<button type="button" className="forgot-link" onClick={()=>changeMode('forgot')}>Esqueci minha senha</button>}<button className="primary" disabled={loading}>{loading?'Aguarde...':mode==='signup'?'Criar conta':mode==='forgot'?'Enviar instruções':'Entrar'}</button></form>{message&&<div className="auth-message">{message}</div>}<div className="auth-links">{mode==='login'&&<button type="button" onClick={()=>changeMode('signup')}>Criar uma conta</button>}{mode!=='login'&&<button type="button" onClick={()=>changeMode('login')}>Voltar para entrar</button>}</div><small>Seus estudos ficam sincronizados com segurança na sua conta.</small></section></main>
}

function PasswordResetScreen({ onDone }) {
  const [password,setPassword]=useState('')
  const [confirmation,setConfirmation]=useState('')
  const [loading,setLoading]=useState(false)
  const [message,setMessage]=useState('')
  async function save(e){
    e.preventDefault()
    if(password!==confirmation){setMessage('As senhas precisam ser iguais.');return}
    setLoading(true);setMessage('')
    const {error}=await supabase.auth.updateUser({password})
    if(error)setMessage('Não foi possível alterar a senha. Solicite um novo link de recuperação.')
    else onDone()
    setLoading(false)
  }
  return <main className="auth-screen"><section className="auth-card"><div className="brand auth-brand"><div className="brand-mark"><img src="/essence-academy-logo-ui.png" alt=""/></div><span>Essence<span>Academy</span></span></div><h1>Crie uma nova senha.</h1><p>Escolha uma senha com pelo menos 8 caracteres.</p><form onSubmit={save}><label>Nova senha<PasswordField required minLength="8" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" autoFocus/></label><label>Confirmar senha<PasswordField required minLength="8" value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoComplete="new-password"/></label><button className="primary" disabled={loading}>{loading?'Salvando...':'Salvar nova senha'}</button></form>{message&&<div className="auth-message auth-error">{message}</div>}</section></main>
}
function LoadingScreen() { return <main className="auth-screen"><div className="app-loading"><div className="brand-mark"><img src="/essence-academy-logo-ui.png" alt=""/></div><p>Carregando sua rotina...</p></div></main> }
function SubscriptionScreen({ email, status, checking, onCheck, onSignOut }) {
  const blockedMessage = status === 'late' ? 'Identificamos uma mensalidade pendente. Regularize o pagamento para continuar.' : status === 'refunded' || status === 'chargeback' ? 'Esta assinatura não está mais ativa.' : status === 'canceled' ? 'Sua assinatura foi cancelada. Assine novamente para continuar.' : 'Assine para organizar seus estudos com clareza, foco e constância.'
  return <main className="auth-screen subscription-screen"><section className="auth-card subscription-card">
    <div className="brand auth-brand"><div className="brand-mark"><img src="/essence-academy-logo-ui.png" alt=""/></div><span>Essence<span>Academy</span></span></div>
    <div className="subscription-badge">PLANO ESSENCE</div><h1>Seu espaço de estudos, sem complicação.</h1><p>{blockedMessage}</p>
    <div className="subscription-price"><strong>R$ 24,90</strong><span>/mês</span></div>
    <ul className="subscription-benefits"><li><Check size={17}/> Planejamento, matérias e provas</li><li><Check size={17}/> Metas semanais e modo foco</li><li><Check size={17}/> Dados sincronizados com segurança</li></ul>
    <a className="primary subscription-buy" href="https://pay.kiwify.com.br/0c19JMI" target="_blank" rel="noreferrer">Assinar agora <ChevronRight size={18}/></a>
    <button className="subscription-check" type="button" onClick={onCheck} disabled={checking}>{checking?'Verificando...':'Já paguei, verificar acesso'}</button>
    <small>A compra precisa usar o mesmo e-mail da conta: <strong>{email}</strong></small>
    <button className="subscription-signout" type="button" onClick={onSignOut}><LogOut size={15}/> Entrar com outra conta</button>
  </section></main>
}
function Onboarding({ email, onComplete }) {
  const options = ['Matemática','Português','Biologia','História','Geografia','Redação','Física','Química','Inglês','Cálculo','Estatística','Direito','Administração','Contabilidade','Economia','Anatomia','Fisiologia','Psicologia','Programação','Metodologia científica']
  const levels = ['Ensino médio','Faculdade','Concurso','Curso livre']
  const goals = ['Organizar a rotina','Melhorar as notas','Preparar provas','Criar constância']
  const [step,setStep]=useState(0)
  const [name,setName] = useState(email?.split('@')[0] || '')
  const [studyLevel,setStudyLevel]=useState('')
  const [studyGoal,setStudyGoal]=useState('')
  const [selected,setSelected] = useState([])
  const [customSubject,setCustomSubject] = useState('')
  const toggle = item => setSelected(v=>v.includes(item)?v.filter(x=>x!==item):[...v,item])
  const addCustomSubject = () => {
    const subject=customSubject.trim()
    if(!subject)return
    setSelected(current=>current.some(item=>item.toLocaleLowerCase('pt-BR')===subject.toLocaleLowerCase('pt-BR'))?current:[...current,subject])
    setCustomSubject('')
  }
  return <main className="onboarding-screen"><section className="onboarding-card improved-onboarding">
    <div className="onboarding-progress"><span>{step+1} de 3</span><div>{[0,1,2].map(item=><i key={item} className={item<=step?'filled':''}/>)}</div></div>
    <div className="brand auth-brand"><div className="brand-mark"><img src="/essence-academy-logo-ui.png" alt=""/></div><span>Essence<span>Academy</span></span></div>
    {step===0&&<div className="onboarding-intro"><div className="intro-icon"><BookOpen size={27}/></div><div className="onboarding-step">SEU ESPAÇO DE ESTUDOS</div><h1>Organização que acompanha seu ritmo.</h1><p>Vamos personalizar a plataforma em menos de um minuto. Depois, mostraremos cada parte do aplicativo.</p><div className="intro-benefits"><span><Check size={15}/> Planejamento simples</span><span><Check size={15}/> Provas e metas no lugar certo</span><span><Check size={15}/> Foco sem distrações</span></div><button className="primary onboarding-next" type="button" onClick={()=>setStep(1)}>Começar <ChevronRight size={18}/></button></div>}
    {step===1&&<div className="onboarding-stage"><div className="onboarding-step">SOBRE VOCÊ</div><h1>Como é sua rotina de estudos?</h1><p>Isso ajuda a preparar uma experiência mais próxima do que você precisa.</p><label>Como podemos chamar você?<input value={name} onChange={e=>setName(e.target.value)} required autoFocus/></label><fieldset><legend>Onde você estuda?</legend><div className="profile-choices">{levels.map(item=><button type="button" key={item} className={studyLevel===item?'chosen':''} onClick={()=>setStudyLevel(item)}>{item}</button>)}</div></fieldset><fieldset><legend>Qual é seu principal objetivo?</legend><div className="profile-choices">{goals.map(item=><button type="button" key={item} className={studyGoal===item?'chosen':''} onClick={()=>setStudyGoal(item)}>{item}</button>)}</div></fieldset><div className="onboarding-actions"><button type="button" className="onboarding-back" onClick={()=>setStep(0)}>Voltar</button><button type="button" className="primary" disabled={!name.trim()||!studyLevel||!studyGoal} onClick={()=>setStep(2)}>Continuar <ChevronRight size={17}/></button></div></div>}
    {step===2&&<form className="onboarding-stage" onSubmit={e=>{e.preventDefault();onComplete(name.trim()||'Estudante',selected,{studyLevel,studyGoal,tourComplete:false})}}><div className="onboarding-step">SUAS MATÉRIAS</div><h1>O que faz parte da sua jornada?</h1><p>Selecione quantas quiser. Você poderá adicionar, editar ou remover matérias depois.</p><fieldset><legend>Escolha suas matérias</legend><div className="subject-choices">{options.map(item=><button type="button" key={item} className={selected.includes(item)?'chosen':''} onClick={()=>toggle(item)}>{selected.includes(item)&&<Check size={14}/>} {item}</button>)}{selected.filter(item=>!options.includes(item)).map(item=><button type="button" key={item} className="chosen" onClick={()=>toggle(item)}><Check size={14}/> {item}</button>)}</div><div className="custom-subject"><input value={customSubject} onChange={e=>setCustomSubject(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addCustomSubject()}}} placeholder="Outra matéria da escola ou faculdade"/><button type="button" onClick={addCustomSubject} disabled={!customSubject.trim()}><Plus size={16}/> Adicionar</button></div></fieldset><div className="onboarding-actions"><button type="button" className="onboarding-back" onClick={()=>setStep(1)}>Voltar</button><button className="primary" disabled={!selected.length}>Entrar na plataforma <ChevronRight size={17}/></button></div><small>Escolha ou adicione pelo menos uma matéria.</small></form>}
  </section></main>
}
function GuidedTour({ onFinish }) {
  const steps=[
    {target:'[data-tour="welcome"]',title:'Este é o seu resumo de hoje',text:'Aqui você vê o que importa agora: tarefas, progresso e sua rotina de estudos.'},
    {target:'[data-tour="new-task"]',title:'Comece com uma tarefa',text:'Registre o que precisa estudar, escolha a matéria, a data e o tempo estimado.'},
    {target:'[data-tour="focus"]',title:'Use o Modo Foco',text:'Escolha uma matéria e estude por 25 ou 50 minutos. A sessão contará nas suas metas.'},
    {target:'[data-tour="subjects"]',title:'Acompanhe suas matérias',text:'Veja o progresso de cada disciplina e mantenha metas pequenas e realistas.'},
    {target:()=>window.innerWidth<=1000?'[data-tour="menu"]':'[data-tour="navigation"]',title:'Toda a plataforma está aqui',text:'Acesse planejamento, provas, calendário, matérias e metas. Nas configurações, você pode refazer este guia.'}
  ]
  const [step,setStep]=useState(0)
  const [box,setBox]=useState(null)
  useEffect(()=>{
    let timer
    const selector=typeof steps[step].target==='function'?steps[step].target():steps[step].target
    const element=document.querySelector(selector)
    const update=()=>{
      const rect=element?.getBoundingClientRect()
      setBox(rect?{top:rect.top,left:rect.left,width:rect.width,height:rect.height}:null)
    }
    element?.scrollIntoView({behavior:'smooth',block:'center'})
    timer=setTimeout(update,350)
    window.addEventListener('resize',update)
    return()=>{clearTimeout(timer);window.removeEventListener('resize',update)}
  },[step])
  useEffect(()=>{const close=event=>{if(event.key==='Escape')onFinish()};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[onFinish])
  const tooltipStyle=box?{left:Math.max(16,Math.min(box.left,window.innerWidth-336)),top:box.top+box.height+210<window.innerHeight?box.top+box.height+16:Math.max(16,box.top-205)}:{left:'50%',top:'50%',transform:'translate(-50%,-50%)'}
  return <div className="guided-tour" role="dialog" aria-modal="true" aria-label="Apresentação da plataforma"><div className={'tour-blocker '+(box?'':'full')}/>{box&&<div className="tour-highlight" style={{top:box.top-6,left:box.left-6,width:box.width+12,height:box.height+12}}/>}<section className="tour-tooltip" style={tooltipStyle}><div className="tour-count">{step+1} de {steps.length}</div><h2>{steps[step].title}</h2><p>{steps[step].text}</p><div className="tour-progress">{steps.map((_,index)=><i key={index} className={index<=step?'filled':''}/>)}</div><div className="tour-actions"><button type="button" className="tour-skip" onClick={onFinish}>{step===steps.length-1?'Fechar':'Pular apresentação'}</button><span>{step>0&&<button type="button" className="tour-back" onClick={()=>setStep(value=>value-1)}>Voltar</button>}<button type="button" className="tour-next" onClick={()=>step===steps.length-1?onFinish():setStep(value=>value+1)}>{step===steps.length-1?'Começar a usar':'Próximo'} <ChevronRight size={16}/></button></span></div></section></div>
}
function DeleteButton({ onConfirm, item, className = '', size = 17 }) {
  const [open, setOpen] = useState(false)
  return <>
    <button className={className} onClick={()=>setOpen(true)} aria-label={`Excluir ${item}`}><Trash2 size={size}/></button>
    {open && <div className="modal-backdrop" onMouseDown={()=>setOpen(false)}><div className="confirm-modal" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}><div className="confirm-icon"><Trash2 size={22}/></div><h2>Excluir este item?</h2><p><strong>{item}</strong> será removido permanentemente.</p><div className="confirm-actions"><button onClick={()=>setOpen(false)}>Cancelar</button><button className="danger" onClick={()=>{onConfirm();setOpen(false)}}>Excluir</button></div></div></div>}
  </>
}
function EditItemModal({ editing, onClose, subjects, setTasks, setSubjects, setExams }) {
  if(!editing)return null
  const {type,item}=editing
  function save(e){
    e.preventDefault()
    const f=new FormData(e.currentTarget)
    if(type==='task')setTasks(current=>current.map(x=>x.id===item.id?{...x,title:f.get('title').trim(),subject:f.get('subject'),date:f.get('date'),duration:Number(f.get('duration'))}:x))
    if(type==='exam')setExams(current=>current.map(x=>x.id===item.id?{...x,title:f.get('title').trim(),subject:f.get('subject'),professor:f.get('professor').trim(),date:f.get('date')}:x))
    if(type==='subject'){
      const name=f.get('name').trim(),oldName=item.name
      setSubjects(current=>current.map(x=>x.id===item.id?{...x,name,color:f.get('color'),goal:Number(f.get('goal'))}:x))
      if(name!==oldName){setTasks(current=>current.map(x=>x.subject===oldName?{...x,subject:name}:x));setExams(current=>current.map(x=>x.subject===oldName?{...x,subject:name}:x))}
    }
    onClose()
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal edit-modal" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><h2>Editar {type==='task'?'tarefa':type==='exam'?'prova':'matéria'}</h2><p>Atualize somente o que precisar.</p></div><button onClick={onClose}><X/></button></div><form onSubmit={save}>
    {type==='task'&&<><label>Tarefa<input name="title" required defaultValue={item.title} autoFocus/></label><label>Matéria<select name="subject" defaultValue={item.subject}>{subjects.map(s=><option key={s.id}>{s.name}</option>)}</select></label><div className="form-row"><label>Data<input name="date" type="date" required defaultValue={taskDateIso(item.date)}/></label><label>Duração<input name="duration" type="number" min="5" step="5" required defaultValue={item.duration}/></label></div></>}
    {type==='exam'&&<><label>Nome da prova<input name="title" required defaultValue={item.title} autoFocus/></label><label>Matéria<select name="subject" defaultValue={item.subject}>{subjects.map(s=><option key={s.id}>{s.name}</option>)}</select></label><label>Professor(a) — opcional<input name="professor" defaultValue={item.professor||''}/></label><label>Data<input name="date" type="date" required defaultValue={item.date}/></label></>}
    {type==='subject'&&<><label>Nome da matéria<input name="name" required defaultValue={item.name} autoFocus/></label><div className="form-row"><label>Cor<input name="color" type="color" defaultValue={item.color}/></label><label>Meta semanal<input name="goal" type="number" min="1" max="30" required defaultValue={item.goal}/></label></div></>}
    <button className="primary submit">Salvar alterações</button>
  </form></div></div>
}
function WorkspacePage({ active, tasks, subjects, exams, sessions, setTasks, setSubjects, setExams, openTask }) {
  const toggle = id => setTasks(tasks.map(t => t.id === id ? {...t, done: !t.done, completedAt: !t.done ? new Date().toISOString() : null} : t))
  const remove = id => setTasks(tasks.filter(t => t.id !== id))
  const [filter, setFilter] = useState('Todas')
  const [subjectName, setSubjectName] = useState('')
  const [showExam, setShowExam] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1))
  const [selectedDay, setSelectedDay] = useState(localIso())
  const [editing, setEditing] = useState(null)
  const shown = tasks.filter(t => filter === 'Todas' || (filter === 'Concluídas' ? t.done : !t.done))
  const calendarYear=calendarMonth.getFullYear(),calendarMonthIndex=calendarMonth.getMonth()
  const calendarOffset=(new Date(calendarYear,calendarMonthIndex,1).getDay()+6)%7
  const calendarDaysCount=new Date(calendarYear,calendarMonthIndex+1,0).getDate()
  const previousDaysCount=new Date(calendarYear,calendarMonthIndex,0).getDate()
  const calendarCells=Array.from({length:42},(_,index)=>{
    const dayNumber=index-calendarOffset+1
    const date=dayNumber<1?new Date(calendarYear,calendarMonthIndex-1,previousDaysCount+dayNumber):dayNumber>calendarDaysCount?new Date(calendarYear,calendarMonthIndex+1,dayNumber-calendarDaysCount):new Date(calendarYear,calendarMonthIndex,dayNumber)
    return {date,iso:localIso(date),outside:date.getMonth()!==calendarMonthIndex}
  })
  const selectedTasks=tasks.filter(task=>taskDateIso(task.date)===selectedDay)
  const selectedExams=exams.filter(exam=>exam.date===selectedDay)
  const days = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
  const month = [27,28,29,30,31,...Array.from({length:31},(_,i)=>i+1),1,2,3,4,5,6]

  if (active === 'Planejamento') return <>
    <div className="welcome"><div><h1>Planejamento</h1><p>Organize o que precisa ser feito, sem sobrecarregar seu dia.</p></div><button className="primary" onClick={openTask}><Plus size={19}/> Nova tarefa</button></div>
    <section className="exam-section">
      <div className="exam-head"><div><h2>Próximas provas</h2><p>Datas importantes em um só lugar.</p></div><button onClick={()=>setShowExam(!showExam)}><Plus size={17}/> Adicionar prova</button></div>
      {showExam && <form className="exam-form" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);setExams([...exams,{id:Date.now(),title:f.get('title'),subject:f.get('subject'),professor:f.get('professor').trim(),date:f.get('date')}]);setShowExam(false)}}><input name="title" required placeholder="Nome da prova" autoFocus/><select name="subject">{subjects.map(s=><option key={s.id}>{s.name}</option>)}</select><input name="professor" placeholder="Professor(a) — opcional"/><input name="date" type="date" required/><button className="primary">Salvar</button></form>}
      <div className="exam-list">{exams.length ? [...exams].sort((a,b)=>a.date.localeCompare(b.date)).map(exam=><article className="exam-card" key={exam.id}><div className="exam-date"><strong>{new Date(exam.date+'T12:00:00').getDate()}</strong><span>{new Date(exam.date+'T12:00:00').toLocaleDateString('pt-BR',{month:'short'}).replace('.','')}</span></div><div><strong>{exam.title}</strong><p><span className="dot" style={{background:subjects.find(s=>s.name===exam.subject)?.color}}/>{exam.subject}{exam.professor && <> • Prof. {exam.professor}</>}</p></div><div className="item-actions"><button className="edit-item" onClick={()=>setEditing({type:'exam',item:exam})} aria-label="Editar prova"><Pencil size={15}/></button><DeleteButton item={`a prova “${exam.title}”`} size={16} onConfirm={()=>setExams(exams.filter(x=>x.id!==exam.id))}/></div></article>) : <p className="exam-empty">Nenhuma prova cadastrada.</p>}</div>
    </section>
    <div className="filter-tabs">{['Todas','Pendentes','Concluídas'].map(f=><button key={f} className={filter===f?'selected':''} onClick={()=>setFilter(f)}>{f}</button>)}</div>
    <section className="panel phase-page"><div className="panel-head"><div><h2>{filter}</h2><p>{shown.length} tarefas encontradas</p></div></div><div className="task-list">{shown.map(task=><div className={`task ${task.done?'done':''}`} key={task.id}><button className="check" onClick={()=>toggle(task.id)}>{task.done&&<Check size={14}/>}</button><div className="task-body"><strong>{task.title}</strong><div><span className="dot" style={{background:subjects.find(s=>s.name===task.subject)?.color}}/>{task.subject}<span>•</span><Clock3 size={13}/>{task.duration} min</div></div><span className="date">{taskDateLabel(task.date)}</span><div className="item-actions"><button className="edit-item" onClick={()=>setEditing({type:'task',item:task})} aria-label="Editar tarefa"><Pencil size={16}/></button><DeleteButton className="delete" item={`a tarefa “${task.title}”`} onConfirm={()=>remove(task.id)}/></div></div>)}</div></section>
    <EditItemModal editing={editing} onClose={()=>setEditing(null)} subjects={subjects} setTasks={setTasks} setSubjects={setSubjects} setExams={setExams}/>
  </>

  if (active === 'Calendário') return <>
    <div className="welcome"><div><h1>Calendário</h1><p>Veja tarefas e provas nas datas certas.</p></div></div>
    <section className="panel calendar-panel"><div className="calendar-title"><button onClick={()=>setCalendarMonth(new Date(calendarYear,calendarMonthIndex-1,1))} aria-label="Mês anterior"><ChevronRight size={18} className="flip"/></button><h2>{calendarMonth.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</h2><button onClick={()=>setCalendarMonth(new Date(calendarYear,calendarMonthIndex+1,1))} aria-label="Próximo mês"><ChevronRight size={18}/></button></div><div className="calendar-grid">{days.map(d=><b key={d}>{d}</b>)}{calendarCells.map(cell=>{const dayTasks=tasks.filter(task=>taskDateIso(task.date)===cell.iso),dayExams=exams.filter(exam=>exam.date===cell.iso),hasEvents=dayTasks.length||dayExams.length;return <button type="button" key={cell.iso} className={(cell.outside?'muted-day ':'')+(cell.iso===localIso()?'today ':'')+(cell.iso===selectedDay?'selected-day':'')} onClick={()=>setSelectedDay(cell.iso)}><span>{cell.date.getDate()}</span>{hasEvents&&<div className="calendar-events">{[...dayTasks,...dayExams].slice(0,3).map((event,index)=><i key={index} style={{background:subjects.find(s=>s.name===event.subject)?.color||'#6d5ed9'}}/>)}</div>}</button>})}</div></section>
    <section className="panel day-agenda"><div className="panel-head"><div><h2>{new Date(selectedDay+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}</h2><p>{selectedTasks.length+selectedExams.length} compromisso(s)</p></div></div>{!selectedTasks.length&&!selectedExams.length?<p className="exam-empty">Nenhuma tarefa ou prova nesta data.</p>:<div className="day-events">{selectedExams.map(exam=><div className="day-event" key={'exam-'+exam.id}><CalendarDays size={17}/><span><strong>{exam.title}</strong><small>Prova · {exam.subject}{exam.professor?' · Prof. '+exam.professor:''}</small></span></div>)}{selectedTasks.map(task=><div className="day-event" key={'task-'+task.id}><ListTodo size={17}/><span><strong>{task.title}</strong><small>{task.subject} · {task.duration} min</small></span></div>)}</div>}</section>
    <EditItemModal editing={editing} onClose={()=>setEditing(null)} subjects={subjects} setTasks={setTasks} setSubjects={setSubjects} setExams={setExams}/>
  </>
  if (active === 'Matérias') return <>
    <div className="welcome"><div><h1>Matérias</h1><p>Centralize todas as áreas da sua jornada.</p></div></div>
    <form className="quick-add" onSubmit={e=>{e.preventDefault();if(!subjectName.trim())return;setSubjects([...subjects,{id:Date.now(),name:subjectName,color:['#4b9bea','#a868d8','#3ebd93'][subjects.length%3],goal:3}]);setSubjectName('')}}><input value={subjectName} onChange={e=>setSubjectName(e.target.value)} placeholder="Nome da nova matéria"/><button className="primary"><Plus size={18}/> Adicionar</button></form>
    <section className="subjects phase-page"><div className="section-title"><div><h2>Minhas matérias</h2><p>{subjects.length} áreas de estudo</p></div></div><div className="subject-grid">{subjects.map(s=>{const stats=weeklySubjectStats(tasks,s,sessions);return <article className="subject-card" key={s.id}><div className="subject-top"><div className="subject-icon" style={{background:s.color+'18',color:s.color}}>{s.name.slice(0,2).toUpperCase()}</div><span>{stats.pct}%</span></div><h3>{s.name}</h3><p>{stats.completed} de {stats.goal} sessões nesta semana</p><div className="subject-progress"><i style={{width:stats.pct+'%',background:s.color}}/></div><div className="subject-actions"><button className="edit-item" onClick={()=>setEditing({type:'subject',item:s})} aria-label="Editar matéria"><Pencil size={15}/></button><DeleteButton className="subject-delete" item={'a matéria “'+s.name+'”'} size={15} onConfirm={()=>setSubjects(subjects.filter(x=>x.id!==s.id))}/></div></article>})}</div></section>
    <EditItemModal editing={editing} onClose={()=>setEditing(null)} subjects={subjects} setTasks={setTasks} setSubjects={setSubjects} setExams={setExams}/>
  </>

  const weeklyCompleted=tasks.filter(task=>task.done&&isInCurrentWeek(task.completedAt?.slice(0,10)||task.date)).length+sessions.filter(session=>isInCurrentWeek(session.completedAt?.slice(0,10))).length
  const weeklyGoal=subjects.reduce((sum,subject)=>sum+(Number(subject.goal)||0),0)
  const weeklyPct=weeklyGoal?Math.min(100,Math.round(weeklyCompleted/weeklyGoal*100)):0
  const recentSessions=[...sessions].sort((a,b)=>b.completedAt.localeCompare(a.completedAt)).slice(0,7)
  const weeklyFocusMinutes=sessions.filter(session=>isInCurrentWeek(session.completedAt?.slice(0,10))).reduce((sum,session)=>sum+session.minutes,0)
  return <>
    <div className="welcome"><div><h1>Metas</h1><p>Metas pequenas e consistentes constroem grandes resultados.</p></div></div>
    <div className="goal-hero"><div><span>PROGRESSO DA SEMANA</span><strong>{weeklyCompleted} de {weeklyGoal} sessões concluídas</strong><p>{weeklyPct>=100?'Meta semanal alcançada!':'Continue no seu ritmo — cada sessão conta.'}</p></div><div className="goal-circle">{weeklyPct}%</div></div>
    <section className="panel phase-page"><div className="panel-head"><div><h2>Metas por matéria</h2><p>Ajuste quantas sessões deseja concluir por semana.</p></div></div><div className="goal-list">{subjects.map(s=>{const stats=weeklySubjectStats(tasks,s,sessions);return <div className="goal-item" key={s.id}><span className="subject-icon" style={{background:s.color+'18',color:s.color}}>{s.name.slice(0,2).toUpperCase()}</span><div><strong>{s.name}</strong><small>{stats.completed} de {stats.goal} concluídas · {stats.pct}%</small><div className="subject-progress"><i style={{width:stats.pct+'%',background:s.color}}/></div></div><div className="stepper"><button aria-label="Diminuir meta" onClick={()=>setSubjects(subjects.map(x=>x.id===s.id?{...x,goal:Math.max(1,x.goal-1)}:x))}>−</button><b>{s.goal}</b><button aria-label="Aumentar meta" onClick={()=>setSubjects(subjects.map(x=>x.id===s.id?{...x,goal:x.goal+1}:x))}>+</button></div></div>})}</div></section>
    <section className="panel phase-page history-panel"><div className="panel-head"><div><h2>Histórico de foco</h2><p>{weeklyFocusMinutes} minutos registrados nesta semana.</p></div></div>{recentSessions.length?<div className="history-list">{recentSessions.map(session=><div className="history-row" key={session.id}><span className="history-dot" style={{background:subjects.find(subject=>subject.name===session.subject)?.color||'#6d5ed9'}}/><div><strong>{session.subject}</strong><small>{new Date(session.completedAt).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</small></div><b>{session.minutes} min</b></div>)}</div>:<p className="exam-empty">Conclua uma sessão no Modo Foco para iniciar seu histórico.</p>}</section>
    <EditItemModal editing={editing} onClose={()=>setEditing(null)} subjects={subjects} setTasks={setTasks} setSubjects={setSubjects} setExams={setExams}/>
  </>
}
function App() {
  const [tasks, setTasks] = useStoredState('essence-tasks', initialTasks)
  const [exams, setExams] = useStoredState('essence-exams', [])
  const [subjects, setSubjects] = useStoredState('essence-subjects', initialSubjects)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('Hoje')
  const [timer, setTimer] = useState(25 * 60)
  const [focusDuration, setFocusDuration] = useState(25)
  const [focusSubject, setFocusSubject] = useState('')
  const [focusMode, setFocusMode] = useState('focus')
  const [running, setRunning] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accountMessage, setAccountMessage] = useState('')
  const [isOnline, setIsOnline] = useState(()=>navigator.onLine)
  const [settings, setSettings] = useStoredState('essence-settings', { name: 'Aline', notifications: false, reminderTime: '19:00', examDays: 2, theme: 'light', accent: '#6d5ed9', onboardingComplete: false })
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [subscriptionReady, setSubscriptionReady] = useState(false)
  const [checkingSubscription, setCheckingSubscription] = useState(false)
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [cloudReady, setCloudReady] = useState(false)
  const [syncStatus, setSyncStatus] = useState('local')
  useEffect(() => {
    const root=document.documentElement
    root.dataset.theme=settings.theme||'light'
    root.style.setProperty('--accent',settings.accent||'#6d5ed9')
  },[settings.theme,settings.accent])
  useEffect(() => {
    const updateConnection=()=>setIsOnline(navigator.onLine)
    window.addEventListener('online',updateConnection);window.addEventListener('offline',updateConnection)
    return()=>{window.removeEventListener('online',updateConnection);window.removeEventListener('offline',updateConnection)}
  },[])
  useEffect(() => {
    supabase.auth.getSession().then(({data})=>{ setSession(data.session); setAuthReady(true) })
    const {data:listener}=supabase.auth.onAuthStateChange((event,nextSession)=>{setSession(nextSession);setAuthReady(true);if(event==='PASSWORD_RECOVERY')setPasswordRecovery(true);if(!nextSession){setCloudReady(false);setSubscription(null);setSubscriptionReady(false)}})
    return()=>listener.subscription.unsubscribe()
  },[])

  async function checkSubscription(showLoading=true) {
    if(!session?.user?.email)return
    if(showLoading)setCheckingSubscription(true)
    const {data}=await supabase.from('subscriptions').select('status,expires_at,updated_at').eq('email',session.user.email.toLowerCase()).maybeSingle()
    setSubscription(data||null);setSubscriptionReady(true);setCheckingSubscription(false)
  }

  useEffect(() => {
    if(!session?.user?.email)return
    setSubscriptionReady(false);checkSubscription(false)
  },[session?.user?.email])

  useEffect(() => {
    if(!session?.user?.id)return
    let active=true
    async function loadCloudData(){
      setSyncStatus('loading')
      const userId=session.user.id, owner=localStorage.getItem('essence-local-owner')
      const {data,error}=await supabase.from('study_data').select('tasks,subjects,exams,settings').eq('user_id',userId).maybeSingle()
      if(!active)return
      if(error){
        if(owner!==userId){setTasks([]);setSubjects([]);setExams([]);setSettings({name:session.user.email?.split('@')[0]||'Estudante',notifications:false,reminderTime:'19:00',examDays:2,theme:'light',accent:'#6d5ed9',onboardingComplete:false})}
        setCloudReady(true);setSyncStatus('error');return
      }
      if(data){
        const complete=data.settings?.onboardingComplete??Boolean(data.tasks?.length||data.subjects?.length||data.exams?.length)
        setTasks(data.tasks||[]);setSubjects(data.subjects||[]);setExams(data.exams||[]);setSettings(current=>({...current,...data.settings,onboardingComplete:complete}))
      }else{
        const canMigrate=!owner||owner===userId
        const freshSettings={name:session.user.email?.split('@')[0]||'Estudante',notifications:false,reminderTime:'19:00',examDays:2,theme:'light',accent:'#6d5ed9',onboardingComplete:false}
        const payload=canMigrate?{tasks,subjects,exams,settings:{...settings,onboardingComplete:settings.onboardingComplete??Boolean(tasks.length||subjects.length||exams.length)}}:{tasks:[],subjects:[],exams:[],settings:freshSettings}
        if(!canMigrate){setTasks([]);setSubjects([]);setExams([]);setSettings(freshSettings)}else setSettings(payload.settings)
        await supabase.from('study_data').insert({user_id:userId,...payload})
      }
      localStorage.setItem('essence-local-owner',userId);setCloudReady(true);setSyncStatus('synced')
    }
    loadCloudData();return()=>{active=false}
  },[session?.user?.id])

  useEffect(() => {
    if(!session?.user?.id||!cloudReady)return
    setSyncStatus('saving')
    const syncTimer=setTimeout(async()=>{const{error}=await supabase.from('study_data').upsert({user_id:session.user.id,tasks,subjects,exams,settings,updated_at:new Date().toISOString()});setSyncStatus(error?'error':'synced')},700)
    return()=>clearTimeout(syncTimer)
  },[tasks,subjects,exams,settings,session?.user?.id,cloudReady,isOnline])

  useEffect(() => {
    const captureInstall=event=>{event.preventDefault();setInstallPrompt(event)}
    window.addEventListener('beforeinstallprompt',captureInstall);return()=>window.removeEventListener('beforeinstallprompt',captureInstall)
  },[])

  useEffect(() => {
    if(!focusSubject&&subjects.length)setFocusSubject(subjects[0].name)
  },[subjects,focusSubject])

  useEffect(() => {
    if(!running)return
    const id=setInterval(()=>setTimer(value=>Math.max(0,value-1)),1000)
    return()=>clearInterval(id)
  },[running])

  useEffect(() => {
    if(!running||timer!==0)return
    setRunning(false)
    if(focusMode==='focus'){
      const session={id:Date.now(),subject:focusSubject||subjects[0]?.name||'Estudos',minutes:focusDuration,completedAt:new Date().toISOString()}
      setSettings(current=>({...current,focusSessions:[...(current.focusSessions||[]),session].slice(-200)}))
      if('Notification'in window&&Notification.permission==='granted')navigator.serviceWorker?.ready.then(registration=>registration.showNotification('Sessão concluída ✦',{body:focusDuration+' minutos de '+session.subject+'. Hora de uma pausa!',icon:'/icons/icon-192.png',tag:'focus-complete'}))
      try{const context=new AudioContext(),oscillator=context.createOscillator(),gain=context.createGain();oscillator.connect(gain);gain.connect(context.destination);oscillator.frequency.value=740;gain.gain.value=.08;oscillator.start();oscillator.stop(context.currentTime+.35)}catch{}
      setFocusMode('break');setTimer(5*60)
    }else{
      setFocusMode('focus');setTimer(focusDuration*60)
    }
  },[timer,running,focusMode,focusDuration,focusSubject,subjects,setSettings])

  useEffect(() => {
    if(!settings.notifications||!('Notification'in window)||Notification.permission!=='granted')return
    const checkReminders=async()=>{
      const now=new Date(),dateKey=now.toISOString().slice(0,10),time=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      const registration=await navigator.serviceWorker?.ready
      if(time===settings.reminderTime&&localStorage.getItem('essence-daily-notified')!==dateKey){registration?.showNotification('Hora de estudar ✦',{body:`Você tem ${tasks.filter(t=>!t.done).length} tarefa(s) pendente(s).`,icon:'/icons/icon-192.png',tag:'daily-study'});localStorage.setItem('essence-daily-notified',dateKey)}
      const upcoming=exams.map(exam=>({...exam,days:Math.ceil((new Date(exam.date+'T12:00:00')-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/86400000)})).filter(exam=>exam.days>=0&&exam.days<=settings.examDays).sort((a,b)=>a.days-b.days)[0]
      const examKey=upcoming?`${upcoming.id}-${dateKey}`:''
      if(upcoming&&localStorage.getItem('essence-exam-notified')!==examKey){registration?.showNotification('Prova se aproximando',{body:`${upcoming.title} — ${upcoming.days===0?'hoje':`em ${upcoming.days} dia(s)`}.`,icon:'/icons/icon-192.png',tag:'upcoming-exam'});localStorage.setItem('essence-exam-notified',examKey)}
    }
    checkReminders();const reminderId=setInterval(checkReminders,30000);return()=>clearInterval(reminderId)
  },[settings,tasks,exams])
  const completed = tasks.filter(t => t.done).length
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0
  const studiedMinutes = tasks.filter(t => t.done).reduce((sum, t) => sum + t.duration, 0) + (settings.focusSessions||[]).reduce((sum,session)=>sum+session.minutes,0)
  const studiedTime = studiedMinutes >= 60 ? Math.floor(studiedMinutes / 60) + 'h ' + (studiedMinutes % 60) + 'min' : studiedMinutes + ' min'
  const todayLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()).toUpperCase()
  const filtered = useMemo(() => tasks.filter(t => `${t.title} ${t.subject}`.toLowerCase().includes(query.toLowerCase())), [tasks, query])

  async function changePassword() {
    setAccountMessage('')
    if(newPassword.length<8){setAccountMessage('A senha precisa ter pelo menos 8 caracteres.');return}
    if(newPassword!==confirmPassword){setAccountMessage('As senhas precisam ser iguais.');return}
    const {error}=await supabase.auth.updateUser({password:newPassword})
    if(error)setAccountMessage('Não foi possível alterar a senha. Tente novamente.')
    else{setNewPassword('');setConfirmPassword('');setAccountMessage('Senha alterada com sucesso.')}
  }
  function exportBackup() {
    const backup={version:1,exportedAt:new Date().toISOString(),tasks,subjects,exams,settings}
    const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}))
    const link=document.createElement('a');link.href=url;link.download='essence-academy-backup-'+localIso()+'.json';link.click();URL.revokeObjectURL(url)
    setAccountMessage('Backup baixado com sucesso.')
  }
  async function restoreBackup(event) {
    const file=event.target.files?.[0]
    if(!file)return
    try{
      const backup=JSON.parse(await file.text())
      if(!Array.isArray(backup.tasks)||!Array.isArray(backup.subjects)||!Array.isArray(backup.exams)||!backup.settings)throw new Error('invalid')
      if(!window.confirm('Restaurar este backup substituirá os dados atuais. Deseja continuar?'))return
      setTasks(backup.tasks);setSubjects(backup.subjects);setExams(backup.exams);setSettings(current=>({...current,...backup.settings}))
      setAccountMessage('Backup restaurado e sincronizado.')
    }catch{setAccountMessage('Este arquivo não é um backup válido da Essence Academy.')}
    event.target.value=''
  }

  async function saveSettings(e) {
    e.preventDefault(); const data = new FormData(e.currentTarget)
    let notifications = data.get('notifications') === 'on'
    if (notifications && 'Notification' in window && Notification.permission !== 'granted') notifications = (await Notification.requestPermission()) === 'granted'
    setSettings(current=>({ ...current, name: data.get('name').trim() || 'Estudante', notifications, reminderTime: data.get('reminderTime'), examDays: Number(data.get('examDays')), theme: data.get('theme') || 'light', accent: data.get('accent') || '#6d5ed9' })); setSettingsOpen(false)
  }
  function addTask(e) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setTasks(v => [{ id: Date.now(), title: data.get('title'), subject: data.get('subject'), date: data.get('date'), duration: Number(data.get('duration')), done: false }, ...v])
    setModal(false)
  }

  const mins = String(Math.floor(timer / 60)).padStart(2, '0')
  const secs = String(timer % 60).padStart(2, '0')

  if (!authReady) return <LoadingScreen />
  if (!session) return <AuthScreen />
  if (passwordRecovery) return <PasswordResetScreen onDone={()=>setPasswordRecovery(false)} />
  if (!subscriptionReady) return <LoadingScreen />
  const subscriptionAllowed = ['active','beta','canceling'].includes(subscription?.status) || (subscription?.status==='canceled' && subscription?.expires_at && new Date(subscription.expires_at)>new Date())
  if (!subscriptionAllowed) return <SubscriptionScreen email={session.user.email} status={subscription?.status} checking={checkingSubscription} onCheck={()=>checkSubscription(true)} onSignOut={()=>supabase.auth.signOut()} />
  if (!cloudReady) return <LoadingScreen />
  if (!settings.onboardingComplete) return <Onboarding email={session.user.email} onComplete={(name,names,profile)=>{setSubjects(names.map((subject,index)=>({id:Date.now()+index,name:subject,color:['#7c6ee6','#3ebd93','#f3a85f','#ea7186','#4b9bea','#a868d8'][index%6],goal:3})));setTasks([]);setExams([]);setSettings(current=>({...current,name,...profile,onboardingComplete:true}));setTourOpen(true)}} />

  return <div className="app-shell"><a className="skip-link" href="#main-content">Ir para o conteúdo</a>
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><img src="/essence-academy-logo-ui.png" alt=""/></div><span>Essence<span>Academy</span></span></div>
      <button className="close-nav" onClick={() => setMobileNav(false)}><X/></button>
      <nav data-tour="navigation">
        {[[LayoutDashboard,'Hoje'],[ListTodo,'Planejamento'],[CalendarDays,'Calendário'],[BookOpen,'Matérias'],[Target,'Metas']].map(([Icon,label]) =>
          <button key={label} className={active === label ? 'active' : ''} onClick={() => {setActive(label); setMobileNav(false)}}><Icon size={19}/>{label}</button>)}
      </nav>
      <div className="upgrade-card simple"><div className="mini-stars">✦</div><strong>Um passo por vez.</strong><p>Veja o que importa hoje e avance no seu ritmo.</p></div>
      {installPrompt && <button className="settings install-app" onClick={async()=>{await installPrompt.prompt();setInstallPrompt(null)}}><Download size={18}/> Instalar aplicativo</button>}
      <button className="settings" onClick={()=>setSettingsOpen(true)}><Settings size={18}/> Configurações</button>
      <button className="settings logout-nav" onClick={()=>setSignOutOpen(true)}><LogOut size={18}/> Sair da conta</button>
    </aside>

    <main>
      <header>
        <button className="menu-button" data-tour="menu" onClick={() => setMobileNav(true)}><Menu/></button>
        <div className="search"><Search size={18}/><input placeholder="Buscar tarefa ou matéria..." value={query} onChange={e => setQuery(e.target.value)}/></div>
        <div className={`sync-state ${syncStatus}`}><Cloud size={16}/> {syncStatus==='saving'?'Salvando...':syncStatus==='error'?'Sem conexão':'Sincronizado'}</div><div className="streak"><Check size={18}/> <b>{progress}%</b> concluído</div>
        <div className="avatar">{settings.name.split(/\s+/).slice(0,2).map(n=>n[0]).join('').toUpperCase()}</div>
      </header>

      <section className="content" id="main-content">{!isOnline&&<div className="offline-banner" role="status">Você está sem internet. As alterações serão sincronizadas quando a conexão voltar.</div>}
        {active !== 'Hoje' ? <WorkspacePage active={active} tasks={tasks} subjects={subjects} exams={exams} sessions={settings.focusSessions||[]} setTasks={setTasks} setSubjects={setSubjects} setExams={setExams} openTask={()=>setModal(true)}/> : <>
        <div className="welcome" data-tour="welcome"><div><p className="eyebrow">{todayLabel}</p><h1>Olá, {settings.name.split(' ')[0]}! <span>👋</span></h1><p>Você está indo muito bem. Vamos continuar?</p></div><button className="primary" data-tour="new-task" onClick={() => setModal(true)}><Plus size={19}/> Nova tarefa</button></div>

        <div className="stats-grid">
          <article className="stat"><div className="stat-icon purple"><Clock3/></div><div><span>Tempo concluído</span><strong>{studiedTime}</strong><small>Soma das tarefas finalizadas</small></div></article>
          <article className="stat"><div className="stat-icon green"><Check/></div><div><span>Tarefas concluídas</span><strong>{completed} de {tasks.length}</strong><small>{progress}% do planejado</small></div></article>
          <article className="stat"><div className="stat-icon orange"><ListTodo/></div><div><span>Tarefas pendentes</span><strong>{tasks.length - completed}</strong><small>{tasks.length - completed === 0 ? 'Tudo em dia' : 'Continue no seu ritmo'}</small></div></article>
        </div>

        <div className="dashboard-grid">
          <section className="panel tasks-panel"><div className="panel-head"><div><h2>Plano de hoje</h2><p>Uma coisa de cada vez.</p></div><button onClick={() => setModal(true)}>Adicionar <Plus size={17}/></button></div>
            <div className="task-list">{filtered.length ? filtered.map(task => <div className={`task ${task.done ? 'done' : ''}`} key={task.id}>
              <button className="check" onClick={() => setTasks(tasks.map(t => t.id === task.id ? {...t,done:!t.done,completedAt:!t.done?new Date().toISOString():null} : t))}>{task.done && <Check size={14}/>}</button>
              <div className="task-body"><strong>{task.title}</strong><div><span className="dot" style={{background: subjects.find(s=>s.name===task.subject)?.color}}></span>{task.subject}<span>•</span><Clock3 size={13}/>{task.duration} min</div></div>
              <span className="date">{taskDateLabel(task.date)}</span><div className="item-actions"><button className="edit-item" onClick={()=>setEditing({type:'task',item:task})} aria-label="Editar tarefa"><Pencil size={16}/></button><DeleteButton className="delete" item={`a tarefa “${task.title}”`} onConfirm={()=>setTasks(tasks.filter(t=>t.id!==task.id))}/></div>
            </div>) : <div className="empty">Nenhuma tarefa encontrada.</div>}</div>
            <div className="progress-row"><span>Progresso diário</span><b>{progress}%</b><div className="progress"><i style={{width:`${progress}%`}}/></div></div>
          </section>

          <aside className="focus-card" data-tour="focus"><div className="focus-top"><span><Timer size={18}/> {focusMode==='break'?'Pausa curta':'Modo foco'}</span><small>{focusMode==='break'?'5 min':focusDuration+' min'}</small></div>{focusMode==='focus'&&<div className="focus-setup"><select value={focusSubject} onChange={e=>setFocusSubject(e.target.value)} disabled={running} aria-label="Matéria da sessão">{subjects.map(subject=><option key={subject.id}>{subject.name}</option>)}</select><div className="focus-durations">{[25,50].map(minutes=><button type="button" key={minutes} className={focusDuration===minutes?'chosen':''} disabled={running} onClick={()=>{setFocusDuration(minutes);setTimer(minutes*60)}}>{minutes} min</button>)}</div></div>}<div className="timer-ring" style={{background:'conic-gradient(var(--accent) '+Math.round((1-timer/((focusMode==='break'?5:focusDuration)*60))*100)+'%, #ffffff18 0)'}}><div><strong>{mins}:{secs}</strong><span>{focusMode==='break'?'PAUSA':focusSubject||'FOCO'}</span></div></div><h3>{focusMode==='break'?'Respire e recarregue':'Hora de concentrar'}</h3><p>{focusMode==='break'?'Ao terminar, o foco ficará pronto novamente.':'Esta sessão será registrada nas suas metas.'}</p><button onClick={()=>setRunning(!running)}>{running?'Pausar':timer<((focusMode==='break'?5:focusDuration)*60)?'Continuar':'Iniciar sessão'}</button><div className="focus-actions"><button type="button" onClick={()=>{setRunning(false);setFocusMode('break');setTimer(5*60)}}>Pausa 5 min</button><button type="button" onClick={()=>{setRunning(false);setFocusMode('focus');setTimer(focusDuration*60)}}>Reiniciar</button></div></aside>
        </div>

        <section className="subjects" data-tour="subjects"><div className="section-title"><div><h2>Suas matérias</h2><p>Acompanhe o ritmo de cada área</p></div><button>Ver todas <ChevronRight size={17}/></button></div>
          <div className="subject-grid">{subjects.map(s=>{const stats=weeklySubjectStats(tasks,s,settings.focusSessions||[]);return <article key={s.id} className="subject-card"><div className="subject-top"><div className="subject-icon" style={{background:s.color+'18',color:s.color}}>{s.name.slice(0,2).toUpperCase()}</div><span>{stats.pct}%</span></div><h3>{s.name}</h3><p>{stats.completed} de {stats.goal} sessões nesta semana</p><div className="subject-progress"><i style={{width:stats.pct+'%',background:s.color}}/></div></article>})}</div>
        </section>
        </>}
      </section>
    </main>

    {modal && <div className="modal-backdrop" onMouseDown={() => setModal(false)}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><h2>Nova tarefa</h2><p>Planeje seu próximo passo.</p></div><button onClick={()=>setModal(false)}><X/></button></div><form onSubmit={addTask}>
      <label>Tarefa<input required name="title" placeholder="Ex: Revisar capítulo 4" autoFocus/></label>
      <label>Matéria<select name="subject">{subjects.map(s=><option key={s.id}>{s.name}</option>)}</select></label>
      <div className="form-row"><label>Data<input name="date" type="date" required defaultValue={localIso()}/></label><label>Duração<input required name="duration" type="number" min="5" step="5" defaultValue="30"/></label></div>
      <button className="primary submit" type="submit">Adicionar tarefa</button>
    </form></div></div>}
    <EditItemModal editing={editing} onClose={()=>setEditing(null)} subjects={subjects} setTasks={setTasks} setSubjects={setSubjects} setExams={setExams}/>
    {signOutOpen&&<div className="modal-backdrop" onMouseDown={()=>setSignOutOpen(false)}><div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="signout-title" onMouseDown={e=>e.stopPropagation()}><div className="confirm-icon signout-icon"><LogOut size={22}/></div><h2 id="signout-title">Sair da sua conta?</h2><p>Seus dados já salvos continuarão sincronizados.</p><div className="confirm-actions"><button onClick={()=>setSignOutOpen(false)}>Cancelar</button><button className="danger" onClick={()=>{setSignOutOpen(false);supabase.auth.signOut()}}>Sair</button></div></div></div>}
    {settingsOpen && <div className="modal-backdrop" onMouseDown={()=>setSettingsOpen(false)}><div className="modal settings-modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><h2>Configurações</h2><p>Somente o essencial para sua rotina.</p></div><button onClick={()=>setSettingsOpen(false)}><X/></button></div><form onSubmit={saveSettings}>
      <label>Seu nome<input name="name" defaultValue={settings.name}/></label><div className="appearance-setting"><div className="setting-title"><Palette size={19}/><span><strong>Aparência</strong><small>Escolha como o app combina com você.</small></span></div><div className="appearance-controls"><label>Modo<select name="theme" defaultValue={settings.theme||'light'}><option value="light">Claro</option><option value="dark">Escuro</option></select></label><label>Cor principal<div className="color-choice"><input name="accent" type="color" defaultValue={settings.accent||'#6d5ed9'}/><span>{settings.accent||'#6d5ed9'}</span></div></label></div></div>
      <div className="notification-setting"><div><Bell size={19}/><span><strong>Lembretes</strong><small>Receba avisos enquanto o app estiver aberto.</small></span></div><label className="switch"><input name="notifications" type="checkbox" defaultChecked={settings.notifications}/><i/></label></div>
      <div className="form-row"><label>Horário diário<input name="reminderTime" type="time" defaultValue={settings.reminderTime}/></label><label>Avisar prova antes<select name="examDays" defaultValue={settings.examDays}><option value="1">1 dia</option><option value="2">2 dias</option><option value="3">3 dias</option><option value="7">7 dias</option></select></label></div>
      <section className="settings-section"><div className="setting-title"><span><strong>Segurança</strong><small>Altere a senha da sua conta.</small></span></div><label>Nova senha<PasswordField minLength="8" value={newPassword} onChange={e=>setNewPassword(e.target.value)} autoComplete="new-password"/></label><label>Confirmar nova senha<PasswordField minLength="8" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password"/></label><button type="button" className="secondary-action" onClick={changePassword}>Alterar senha</button></section>
      <section className="settings-section"><div className="setting-title"><span><strong>Conheça a plataforma</strong><small>Veja novamente o passo a passo das principais áreas.</small></span></div><button type="button" className="secondary-action" onClick={()=>{setSettingsOpen(false);setActive('Hoje');setTourOpen(true)}}><BookOpen size={15}/> Refazer apresentação</button></section>
      <section className="settings-section"><div className="setting-title"><span><strong>Backup dos estudos</strong><small>Baixe ou restaure seus dados.</small></span></div><div className="backup-actions"><button type="button" className="secondary-action" onClick={exportBackup}><Download size={15}/> Baixar backup</button><label className="secondary-action file-action">Restaurar backup<input type="file" accept="application/json,.json" onChange={restoreBackup}/></label></div></section>
      {accountMessage&&<div className="auth-message account-message" role="status">{accountMessage}</div>}
      <div className="account-row"><span><strong>Conta conectada</strong><small>{session.user.email}</small></span><button type="button" onClick={()=>setSignOutOpen(true)}><LogOut size={16}/> Sair</button></div><p className="permission-note">O navegador solicitará sua permissão ao ativar os lembretes.</p><button className="primary submit">Salvar configurações</button>
    </form></div></div>}
    {tourOpen&&<GuidedTour onFinish={()=>{setTourOpen(false);setSettings(current=>({...current,tourComplete:true}))}}/>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js'))
}
