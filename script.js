import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { 
  getFirestore, collection, doc, getDocs, setDoc, deleteDoc 
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

// ===== Modal Avisos =====
const btnAvisos = document.getElementById("btnAvisos");
const modalAvisos = document.getElementById("modalAvisos");
const btnFecharModal = document.getElementById("btnFecharModal");
const btnSalvarAviso = document.getElementById("btnSalvarAviso");
const txtAviso = document.getElementById("txtAviso");
const listaAvisos = document.getElementById("listaAvisos");

const avisosRef = collection(db, "avisos");

// ===== Função utilitária =====
const normalizar = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// ===== Firestore: carregar todas as listas =====
async function carregarListas() {
  try {
    const snapshot = await getDocs(collection(db, "listas"));
    listas = {};
    snapshot.forEach(docItem => {
      listas[docItem.id] = docItem.data().nomes || [];
    });
    renderSidebar();
  } catch (error) {
    console.error("Erro ao carregar listas:", error);
    ulListas.innerHTML = "<li style='color:red'>Não foi possível carregar as listas. Verifique as regras do Firestore.</li>";
  }
}

// ===== Firestore: salvar lista =====
async function salvarLista(nome) {
  if (!listas[nome]) return;
  try {
    await setDoc(doc(db, "listas", nome), { nomes: listas[nome] });
  } catch (error) {
    console.error("Erro ao salvar lista:", error);
    alert("Não foi possível salvar a lista. Verifique as regras do Firestore.");
  }
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

  if(nomesOrdenados.length === 0){
    const li = document.createElement("li");
    li.textContent = "Nenhuma lista encontrada.";
    li.style.fontStyle = "italic";
    ulListas.appendChild(li);
    return;
  }

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

// ===== O resto do script continua igual (criarListaPorInicial, selecionarLista, excluirLista, renderNomes, adicionarNomes, excluirNome, busca) =====

// ===== Modal Avisos =====
btnAvisos.addEventListener("click", () => {
  modalAvisos.style.display = "flex";
  carregarAvisos();
});
btnFecharModal.addEventListener("click", () => { modalAvisos.style.display = "none"; });
btnSalvarAviso.addEventListener("click", async () => {
  const texto = txtAviso.value.trim();
  if(!texto) return;
  try {
    await setDoc(doc(avisosRef, Date.now().toString()), {
      texto,
      timestamp: new Date()
    });
    txtAviso.value="";
    carregarAvisos();
  } catch(e){
    console.error("Erro ao salvar aviso:", e);
    alert("Não foi possível salvar o aviso. Verifique as regras do Firestore.");
  }
});
async function carregarAvisos(){
  try {
    const snapshot = await getDocs(avisosRef);
    listaAvisos.innerHTML="";
    const avisosArray = [];
    snapshot.forEach(docItem => {
      avisosArray.push(docItem.data().texto);
    });
    avisosArray.reverse().forEach(a=>{
      const li = document.createElement("li");
      li.textContent=a;
      listaAvisos.appendChild(li);
    });
  } catch(e){
    console.error("Erro ao carregar avisos:", e);
    listaAvisos.innerHTML="<li style='color:red'>Não foi possível carregar os avisos.</li>";
  }
}

// ===== Inicialização =====
carregarListas();
