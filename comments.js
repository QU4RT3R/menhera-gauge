// 친구들의 한마디: Firebase Firestore에 저장되고, 새 댓글은 새로고침 없이 바로 나타난다.
import { firebaseConfig } from "./firebase-config.js";

const SDK = "https://www.gstatic.com/firebasejs/12.16.0";
const COOLDOWN_MS = 20_000;
const NAME_KEY = "menhera-gauge:name";

const $ = (id) => document.getElementById(id);
const form = $("cform"), nameEl = $("cname"), textEl = $("ctext"),
      sendBtn = $("csend"), msg = $("cmsg"), list = $("clist");

try { nameEl.value = localStorage.getItem(NAME_KEY) || ""; } catch {}

function fmt(date) {
  if (!date) return "방금";
  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false
  });
}

export function renderComments(items) {
  list.innerHTML = "";
  if (!items.length) {
    const li = document.createElement("li");
    li.className = "cempty";
    li.textContent = "아직 댓글이 없어요. 첫 마디를 남겨 주세요.";
    list.appendChild(li);
    return;
  }
  for (const c of items) {
    const li = document.createElement("li");
    const n = document.createElement("span"); n.className = "cn"; n.textContent = c.name;
    const t = document.createElement("span"); t.className = "ct"; t.textContent = fmt(c.date);
    const p = document.createElement("p"); p.textContent = c.text;
    li.append(n, t, p);
    list.appendChild(li);
  }
}

function disable(text) {
  for (const el of [nameEl, textEl, sendBtn]) el.disabled = true;
  msg.textContent = text;
}

async function start() {
  // 로컬 미리보기용 가짜 데이터
  if (window.__MOCK_COMMENTS) { renderComments(window.__MOCK_COMMENTS); return; }
  if (!firebaseConfig) {
    renderComments([]);
    disable("댓글 기능을 준비하는 중이에요.");
    return;
  }

  const [{ initializeApp }, fs] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-firestore.js`)
  ]);
  const { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } = fs;
  const db = getFirestore(initializeApp(firebaseConfig));
  const col = collection(db, "comments");

  onSnapshot(
    query(col, orderBy("createdAt", "desc"), limit(60)),
    (snap) => renderComments(snap.docs.map(d => {
      const v = d.data({ serverTimestamps: "estimate" });
      return { name: v.name, text: v.text, date: v.createdAt?.toDate?.() };
    })),
    () => { msg.textContent = "댓글을 불러오지 못했어요. 잠시 뒤 새로고침해 주세요."; }
  );

  let lastSent = 0;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = nameEl.value.trim().slice(0, 20);
    const text = textEl.value.trim().slice(0, 200);
    if (!name) { msg.textContent = "이름을 적어 주세요."; nameEl.focus(); return; }
    if (!text) { msg.textContent = "댓글 내용을 적어 주세요."; textEl.focus(); return; }
    const wait = COOLDOWN_MS - (Date.now() - lastSent);
    if (wait > 0) { msg.textContent = `${Math.ceil(wait / 1000)}초 뒤에 다시 남길 수 있어요.`; return; }

    sendBtn.disabled = true;
    msg.textContent = "남기는 중";
    try {
      await addDoc(col, { name, text, createdAt: serverTimestamp() });
      lastSent = Date.now();
      textEl.value = "";
      msg.textContent = "남겼어요.";
      try { localStorage.setItem(NAME_KEY, name); } catch {}
    } catch {
      msg.textContent = "남기지 못했어요. 이름은 20자, 댓글은 200자까지 쓸 수 있어요.";
    } finally {
      sendBtn.disabled = false;
    }
  });
}

start();
