import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { 
  getFirestore, collection, doc, getDocs, setDoc, deleteDoc,
  addDoc, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ===== Configuração Firebase =====
const firebaseConfig = {
  apiKey: "AIzaSyASloaca2g86x0EWHsSZlJk9C4-yS8BB58",
  authDomain: "cadastros-470b4.firebaseapp.com",
  projectId: "cadastros-470b4",
  storageBucket: "cadastros-470b4.firebasestorage.app",
  messagingSenderId: "527841011004",
  appId: "1:527841011004:web:7d346b27cc9bd91070ea39"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== Variáveis Globais =====
let listas = {};
let listaSelecionada = null;

const ulListas = document.getElementById("listaDeListas");
const tituloLista = document.getElementById("tituloLista");
const acoesLista = document.getElementById("acoesLista");
const btnCriarLista = document.getElementById("btnCriarLista");
const inputInicial = document.getElementById("novaInicial");

const btnExcluirLista = document.getElementById("btnExcluirLista");
const cardAdicao = document.getElementById("adicaoNomes");
const textareaNomes = document.getElementById("novoNomeTextarea");
const btnAdicionarNomes = document.getElementById("btnAdicionarNomes");
const ulNomes = document.getElementById("listaNomes");
const searchInput = document.getElementById("searchInput");

// ===== Função utilitária =====
const normalizar = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// ===== Firestore: carregar todas as listas =====
async function carregarListas() {
  const snapshot = await getDocs(collection(db, "listas"));
  listas = {};
  snapshot.forEach(docItem => {
    listas[docItem.id] = docItem.data().nomes || [];
  });
  renderSidebar();
}

// ===== Firestore: salvar lista =====
async function salvarLista(nome) {
  if (!listas[nome]) return;
  await setDoc(doc(db, "listas", nome), { nomes: listas[nome] });
}

// ===== Renderizar sidebar =====
function renderSidebar() {
  ulListas.innerHTML = "";
  const nomesOrdenados = Object.keys(listas).sort((a,b)=>{
    const re=/^([A-Z]{1,2})(\d+)$/;
    const ma=a.match(re), mb=b.match(re);
    if(ma && mb){ 
      const la=ma[1].toUpperCase(), lb=mb[1].toUpperCase();
      if(la!==lb) return la.localeCompare(lb);
      return parseInt(ma[2])-parseInt(mb[2]);
    }
    return a.localeCompare(b,"pt-BR");
  });

  nomesOrdenados.forEach(nome=>{
    const li=document.createElement("li");
    li.className = "lista-item";
    const spanNome=document.createElement("span");
    spanNome.className="nome-lista"; 
    spanNome.textContent=nome;

    const acoes=document.createElement("div"); 
    acoes.className="row-actions";
    const btnDel=document.createElement("button");
    btnDel.className="btn-mini"; 
    btnDel.textContent="Excluir";
    btnDel.onclick=(e)=>{ e.stopPropagation(); excluirLista(nome); };
    acoes.appendChild(btnDel);

    li.appendChild(spanNome); 
    li.appendChild(acoes);
    li.onclick=()=>selecionarLista(nome);
    ulListas.appendChild(li);
  });
}

// ===== Criar nova lista =====
async function criarLista(){
  const raw = inputInicial.value.trim();
  if(!raw){ 
    alert("Informe o nome da nova caixa."); 
    return; 
  }

  // Checa se é só letras (1 ou 2) → modo automático
  const matchInicial = raw.match(/^([A-Za-z]{1,2})$/);
  let novoNome;

  if(matchInicial){ 
    const inicial = matchInicial[1].toUpperCase();
    // Procura o maior número existente para essa inicial
    let maxNum = 0;
    for(const nome of Object.keys(listas)){
      const m = nome.match(/^([A-Z]{1,2})(\d+)$/);
      if(m && m[1] === inicial){ 
        const n = parseInt(m[2],10); 
        if(n > maxNum) maxNum = n; 
      }
    }
    novoNome = `${inicial}${maxNum+1}`;
  } else {
    // Nome personalizado: usa exatamente o que o usuário digitou
    novoNome = raw;
  }

  if(listas[novoNome]){
    alert("Já existe uma caixa com esse nome.");
    return;
  }

  listas[novoNome] = [];
  inputInicial.value = "";
  renderSidebar();
  selecionarLista(novoNome);
  await salvarLista(novoNome);
}



// ===== Selecionar lista =====
function selecionarLista(nome){
  listaSelecionada=nome;
  tituloLista.textContent=`Lista: ${nome}`;
  acoesLista.style.display="flex";
  cardAdicao.style.display="block";
  textareaNomes.value="";
  renderNomes();
}

// ===== Excluir lista =====
async function excluirLista(nome){
  if(!listas[nome]) return;
  if(confirm(`Excluir a lista "${nome}"? Esta ação não pode ser desfeita.`)){
    delete listas[nome];
    await deleteDoc(doc(db, "listas", nome));
    if(listaSelecionada===nome){
      listaSelecionada=null;
      tituloLista.textContent="Selecione uma lista";
      acoesLista.style.display="none";
      cardAdicao.style.display="none";
      ulNomes.innerHTML="";
    }
    renderSidebar();
  }
}

// ===== Renderizar nomes da lista selecionada =====
function renderNomes(){
  ulNomes.innerHTML="";
  if(!listaSelecionada) return;
  listas[listaSelecionada].forEach((nome,index)=>{
    const li=document.createElement("li");
    const span=document.createElement("span"); span.className="nome"; span.textContent=nome;

    const actions=document.createElement("div"); actions.className="row-actions";
    const btnExcluir=document.createElement("button"); 
    btnExcluir.className="btn-mini"; btnExcluir.textContent="Excluir";
    btnExcluir.onclick=()=>excluirNome(index);

    actions.appendChild(btnExcluir);
    li.appendChild(span); 
    li.appendChild(actions);
    ulNomes.appendChild(li);
  });
}

// ===== Adicionar nomes à lista =====
async function adicionarNomes(){
  if(!listaSelecionada){ alert("Selecione uma lista primeiro."); return; }
  const texto=textareaNomes.value.trim();
  if(!texto) return;
  const nomes=texto.split(/[\n,;]+/g).map(n=>n.trim()).filter(n=>n.length>0);
  if(nomes.length===0) return;

  listas[listaSelecionada].push(...nomes);
  textareaNomes.value="";
  renderNomes();
  await salvarLista(listaSelecionada);
}

// ===== Excluir nome =====
async function excluirNome(index){
  if(!listaSelecionada) return;
  if(index<0 || index>=listas[listaSelecionada].length) return;
  if(confirm("Excluir este nome?")){
    listas[listaSelecionada].splice(index,1);
    renderNomes();
    await salvarLista(listaSelecionada);
  }
}

// ===== Busca =====
function executarBusca(query){
  const q=normalizar(query);
  if(!q){ 
    if(listaSelecionada) renderNomes(); 
    else ulNomes.innerHTML=""; 
    return; 
  }
  const resultados=[];
  for(const [lista, nomes] of Object.entries(listas)){
    nomes.forEach(nome=>{
      if(normalizar(nome).includes(q)) resultados.push({nome,lista});
    });
  }
  ulNomes.innerHTML="";
  tituloLista.textContent="Resultados da busca";
  if(resultados.length===0){
    const li=document.createElement("li");
    li.innerHTML="<span class='nome'>Nenhum resultado encontrado.</span>";
    ulNomes.appendChild(li);
    return;
  }
  resultados.forEach(r=>{
    const li=document.createElement("li");
    const span=document.createElement("span"); span.className="nome"; 
    span.textContent=`${r.nome} (Lista: ${r.lista})`;
    const actions=document.createElement("div"); actions.className="row-actions";
    const btnAbrir=document.createElement("button"); btnAbrir.className="btn-mini"; btnAbrir.textContent="Abrir lista";
    btnAbrir.onclick=()=>selecionarLista(r.lista);
    actions.appendChild(btnAbrir);
    li.appendChild(span); li.appendChild(actions);
    ulNomes.appendChild(li);
  });
}

// ===== Event listeners =====
btnCriarLista.addEventListener("click", criarLista);
inputInicial.addEventListener("keyup", e=>{ if(e.key==="Enter") criarLista(); });
btnExcluirLista.addEventListener("click", ()=>{ if(listaSelecionada) excluirLista(listaSelecionada); });
btnAdicionarNomes.addEventListener("click", adicionarNomes);
searchInput.addEventListener("input", e=>executarBusca(e.target.value));

// ===== Avisos =====
const modalAvisos = document.getElementById("modalAvisos");
const btnFecharAvisos = document.getElementById("btnFecharAvisos");
const btnAdicionarAviso = document.getElementById("btnAdicionarAviso");
const textareaAviso = document.getElementById("novoAviso");
const ulAvisos = document.getElementById("listaAvisos");
const btnAvisos = document.getElementById("btnAvisos");

const avisosRef = collection(db, "avisos");

btnAvisos.addEventListener("click", ()=>{ modalAvisos.style.display = "flex"; });
btnFecharAvisos.addEventListener("click", ()=>{ modalAvisos.style.display = "none"; });

btnAdicionarAviso.addEventListener("click", async ()=>{
  const texto = textareaAviso.value.trim();
  if(!texto) return alert("Digite algum aviso.");
  await addDoc(avisosRef, { texto, timestamp: new Date() });
  textareaAviso.value = "";
});

// Listar avisos em tempo real
const q = query(avisosRef, orderBy("timestamp", "desc"));
onSnapshot(q, snapshot=>{
  ulAvisos.innerHTML="";
  snapshot.forEach(docItem=>{
    const li = document.createElement("li");
    li.className = "nome";
    li.textContent = docItem.data().texto;
    ulAvisos.appendChild(li);
  });
});

// ===== Inicialização =====
carregarListas();
