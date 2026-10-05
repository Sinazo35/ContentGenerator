const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const pageNames={dashboard:"Dashboard",text:"Text Generator",image:"Image Generator",code:"Code Generator",publish:"Publish",history:"History",settings:"Settings"};
let historyData=JSON.parse(localStorage.getItem("novaHistory")||"[]");
let latest=JSON.parse(localStorage.getItem("novaLatest")||"null");
let selectedStyle="Realistic",selectedRatio="1:1",historyFilter="all";
let generatedImageUrl=null;

function icons(){ if(window.lucide) lucide.createIcons(); }
function toast(msg){$("#toast span").textContent=msg;$("#toast").classList.add("show");setTimeout(()=>$("#toast").classList.remove("show"),2200)}
function navigate(page){
  $$(".page").forEach(x=>x.classList.remove("active")); $("#"+page).classList.add("active");
  $$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  $("#pageTitle").textContent=pageNames[page]; $("#sidebar").classList.remove("open");$("#overlay").classList.remove("show");
  if(page==="history") renderHistory(); if(page==="publish") renderShare(); window.scrollTo({top:0,behavior:"smooth"});
}
$$("[data-page]").forEach(b=>b.onclick=()=>navigate(b.dataset.page));
$$("[data-go]").forEach(b=>b.onclick=()=>navigate(b.dataset.go));
$("#menuBtn").onclick=()=>{$("#sidebar").classList.add("open");$("#overlay").classList.add("show")};
$("#closeSidebar").onclick=$("#overlay").onclick=()=>{$("#sidebar").classList.remove("open");$("#overlay").classList.remove("show")};
$("#newGeneration").onclick=()=>navigate("text");
$("#avatar").onclick=()=>navigate("settings");

function saveItem(type,prompt,content,meta={}){
  const item={id:Date.now(),type,prompt,content,meta,date:new Date().toLocaleString()};
  historyData.unshift(item);historyData=historyData.slice(0,50);latest=item;
  localStorage.setItem("novaHistory",JSON.stringify(historyData));localStorage.setItem("novaLatest",JSON.stringify(latest));updateStats();
}
function updateStats(){
  $("#statTotal").textContent=historyData.length;$("#statText").textContent=historyData.filter(x=>x.type==="text").length;
  $("#statImage").textContent=historyData.filter(x=>x.type==="image").length;$("#statCode").textContent=historyData.filter(x=>x.type==="code").length;
}
function loading(btn,label,done){
  const old=btn.innerHTML;btn.disabled=true;btn.innerHTML=`<span class="spinner">◌</span> ${label}`;
  setTimeout(()=>{btn.innerHTML=old;btn.disabled=false;icons();done()},900);
}
$("#textPrompt").oninput=e=>$("#generateText").disabled=!e.target.value.trim();
$("#imagePrompt").oninput=e=>$("#generateImage").disabled=!e.target.value.trim();
$("#codePrompt").oninput=e=>$("#generateCode").disabled=!e.target.value.trim();

function textOutput(){
  const p=$("#textPrompt").value.trim(),format=$("#textFormat").value,tone=$("#textTone").value,platform=$("#textPlatform").value,length=$("#textLength").value;
  const openings={
    "Professional":"Here’s a clear, professional way to bring this idea to life:",
    "Friendly":"Here’s a warm and engaging take on your idea:",
    "Casual":"Here’s a relaxed version you can use:",
    "Creative":"Let’s turn that idea into something memorable:",
    "Formal":"Please consider the following polished content:",
    "Persuasive":"Here’s a compelling version designed to inspire action:"
  };
  let body=`${openings[tone]}\n\n${p}\n\n`;
  if(format==="Social Media Post"||format==="Caption") body+=`Bring your idea to life with confidence, clarity and a little creativity. Created for ${platform==="General"?"your audience":platform}.`;
  else if(format==="Email") body+=`I hope you're well. I’m reaching out regarding ${p.toLowerCase()}. I’d appreciate the opportunity to discuss this further. Thank you for your time and consideration.`;
  else if(format==="Article") body+=`This topic creates an opportunity to explore the key ideas, practical value and impact behind it. A strong approach starts with understanding the goal, focusing on the audience and communicating the message clearly.`;
  else if(format==="Product Description") body+=`Designed with usability and value in mind, this solution turns the idea into a practical experience that is clear, useful and easy to understand.`;
  else body+=`Ideas begin as small sparks. This one can grow into a story that feels thoughtful, original and worth remembering.`;
  if(length==="Long") body+=`\n\nThe strongest content also gives the audience a clear reason to care. Keep the message focused, use language that fits the context, and finish with a meaningful next step. This makes the result easier to understand and more useful to the people it is meant for.`;
  if(length==="Short") body=body.split("\n\n").slice(0,2).join("\n\n");
  if($("#hashtags").checked) body+=`\n\n#NazoStudio #AIContent #CreativeAI`;
  return body;
}
function doText(){
  loading($("#generateText"),"Generating...",()=>{
    const out=textOutput();$("#textEmpty").classList.add("hidden");$("#textResult").classList.remove("hidden");$("#textActions").classList.remove("hidden");
    $("#textResult").textContent=out;$("#charCount").textContent=out.length+" characters";saveItem("text",$("#textPrompt").value,out,{format:$("#textFormat").value});toast("Content generated");
  });
}
$("#generateText").onclick=doText;$("#regenText").onclick=doText;
$("#copyText").onclick=async()=>{await navigator.clipboard.writeText($("#textResult").innerText);toast("Copied to clipboard")};
$("#editText").onclick=()=>{const r=$("#textResult");const edit=r.contentEditable!=="true";r.contentEditable=edit;$("#editText").innerHTML=edit?'<i data-lucide="check"></i>Done':'<i data-lucide="pencil"></i>Edit';icons();if(edit)r.focus()};
$("#downloadText").onclick=()=>download("nazo-content.txt",$("#textResult").innerText,"text/plain");

$$("#styleGroup .chip").forEach(b=>b.onclick=()=>{$$("#styleGroup .chip").forEach(x=>x.classList.remove("active"));b.classList.add("active");selectedStyle=b.textContent});
$$("#ratioGroup .ratio").forEach(b=>b.onclick=()=>{$$("#ratioGroup .ratio").forEach(x=>x.classList.remove("active"));b.classList.add("active");selectedRatio=b.dataset.ratio});
async function doImage(){
 const btn=$("#generateImage");
 const p=$("#imagePrompt").value.trim();
 const key=localStorage.getItem("nazoImageApiKey")||"";
 if(!key){toast("Add your image API key in Settings first");navigate("settings");return;}
 const sizes={"1:1":[1024,1024],"4:5":[1024,1280],"16:9":[1280,720]};
 const [width,height]=sizes[selectedRatio]||sizes["1:1"];
 const fullPrompt=`${p}. Visual style: ${selectedStyle}. High quality, polished composition.`;
 btn.disabled=true;btn.innerHTML='<span class="spinner">◌</span> Generating image...';
 $("#imageEmpty").classList.add("hidden");
 $("#imageResult").classList.remove("hidden");
 $("#imageResult").classList.add("image-loading");
 const img=$("#generatedImage");
 try{
   const url=new URL(`https://gen.pollinations.ai/image/${encodeURIComponent(fullPrompt)}`);
   url.search=new URLSearchParams({model:"tongyi-mai/z-image-turbo",width,height,seed:Math.floor(Math.random()*2147483647)}).toString();
   const response=await fetch(url,{headers:{Authorization:`Bearer ${key}`}});
   if(!response.ok){
     let detail="";
     try{const data=await response.json();detail=data.error?.message||data.message||"";}catch{}
     const messages={401:"Pollinations rejected this API key. Check the key in Settings.",403:"This API key cannot generate images or has insufficient balance. Check your Pollinations account.",429:"Pollinations is receiving too many requests. Wait a moment and try again."};
     const message=messages[response.status]||detail||`Pollinations image service returned ${response.status}`;
     throw new Error(message);
   }
   const contentType=response.headers.get("content-type")||"";
   if(!contentType.startsWith("image/"))throw new Error("Image service returned an unexpected response");
   const objectUrl=URL.createObjectURL(await response.blob());
   try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error("Could not display the generated image"));img.src=objectUrl;});}
   catch(error){URL.revokeObjectURL(objectUrl);throw error;}
   if(generatedImageUrl)URL.revokeObjectURL(generatedImageUrl);
   generatedImageUrl=objectUrl;
   $("#imageResult").classList.remove("image-loading");$("#imageActions").classList.remove("hidden");
   img.dataset.source=objectUrl;saveItem("image",p,p,{style:selectedStyle,ratio:selectedRatio});toast("Image generated successfully");
 }catch(e){
   $("#imageResult").classList.remove("image-loading");
   if(!generatedImageUrl){$("#imageResult").classList.add("hidden");$("#imageEmpty").classList.remove("hidden");}
  const message=e instanceof TypeError?"Could not reach Pollinations. Check your internet connection and try again.":e.message;
  toast(`Image generation failed: ${message}`);
 }finally{btn.innerHTML='<i data-lucide="sparkles"></i>Generate Image';btn.disabled=!p;icons();}
}
$("#generateImage").onclick=doImage;$("#regenImage").onclick=doImage;
$("#downloadImage").onclick=async()=>{
 const url=$("#generatedImage").dataset.source;if(!url)return;
 try{const r=await fetch(url);const blob=await r.blob();const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="nazo-generated-image.jpg";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast("Image downloaded");}
 catch(e){window.open(url,"_blank");toast("Image opened for download");}
};

const templates={
Python:p=>`# Generated by Nazo Studio\n# ${p}\n\ndef main():\n    """Main application entry point."""\n    message = "Hello from Nazo Studio"\n    print(message)\n\nif __name__ == "__main__":\n    main()`,
Java:p=>`// Generated by Nazo Studio\n// ${p}\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Nazo Studio");\n    }\n}`,
JavaScript:p=>`// Generated by Nazo Studio\n// ${p}\nconst createApp = () => {\n  const message = "Hello from Nazo Studio";\n  console.log(message);\n};\n\ncreateApp();`,
"HTML/CSS":p=>`<!-- Generated by Nazo Studio: ${p} -->\n<div class="nazo-card">\n  <h1>Hello from Nazo Studio</h1>\n  <p>Your generated component starts here.</p>\n</div>\n\n<style>\n.nazo-card {\n  padding: 2rem;\n  border-radius: 1rem;\n  box-shadow: 0 1rem 3rem rgba(0,0,0,.08);\n}\n</style>`,
SQL:p=>`-- Generated by Nazo Studio\n-- ${p}\nCREATE TABLE nazo_project (\n    id INT PRIMARY KEY AUTO_INCREMENT,\n    title VARCHAR(120) NOT NULL,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nSELECT * FROM nazo_project ORDER BY created_at DESC;`,
Other:p=>`// Nazo Studio generated starter\n// Request: ${p}\n// Connect your preferred AI/code-generation API\n// to replace this local demonstration output.`
};
function codeLines(code){return code.split("\n").map(l=>`<span class="code-line">${escapeHtml(l)||" "}</span>`).join("")}
function escapeHtml(s){return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}
function doCode(){
 loading($("#generateCode"),"Generating code...",()=>{
  const lang=$("#codeLanguage").value,p=$("#codePrompt").value.trim(),code=(templates[lang]||templates.Other)(p);
  $("#codeEmpty").classList.add("hidden");$("#codeResult").classList.remove("hidden");$("#codeActions").classList.remove("hidden");$("#codeResult code").innerHTML=codeLines(code);$("#codeResult").dataset.raw=code;$("#languageLabel").textContent=lang.toUpperCase();saveItem("code",p,code,{language:lang});toast("Code generated");
 });
}
$("#generateCode").onclick=doCode;$("#regenCode").onclick=doCode;
$("#copyCode").onclick=async()=>{const c=$("#codeResult").dataset.raw;if(!c)return toast("Generate code first");await navigator.clipboard.writeText(c);toast("Code copied")};
$("#downloadCode").onclick=()=>{const c=$("#codeResult").dataset.raw;if(!c)return;const ext={Python:"py",Java:"java",JavaScript:"js","HTML/CSS":"html",SQL:"sql",Other:"txt"}[$("#codeLanguage").value];download(`nazo-code.${ext}`,c,"text/plain")};

function download(name,content,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href);toast("Download started")}
function renderShare(){
 const p=$("#sharePreview");if(!latest){p.innerHTML='<i data-lucide="sparkles"></i><p>Generate something first, then come back here to share it.</p>';icons();return}
 if(latest.type==="image"&&generatedImageUrl){p.innerHTML=`<span class="pill">IMAGE</span><img class="share-image" src="${generatedImageUrl}" alt="Generated image"><p>${escapeHtml(latest.prompt)}</p>`;}
 else p.innerHTML=`<span class="pill">${latest.type.toUpperCase()}</span><p>${escapeHtml((latest.content||latest.prompt).slice(0,650))}</p>`;
 icons();
}
function renderHistory(){
 const q=$("#quickSearch").value.toLowerCase();let data=historyData.filter(x=>(historyFilter==="all"||x.type===historyFilter)&&(`${x.prompt} ${x.content}`.toLowerCase().includes(q)));
 const box=$("#historyList");if(!data.length){box.innerHTML='<div class="history-empty"><h3>No generations yet</h3><p>Your text, image and code creations will appear here.</p></div>';return}
 box.innerHTML=data.map(x=>`<div class="history-item"><div class="history-type"><i data-lucide="${x.type==="text"?"file-text":x.type==="image"?"image":"code-2"}"></i></div><div class="history-copy"><strong>${x.type} generation</strong><p>${escapeHtml(x.prompt)}</p><small>${x.date}</small></div><div class="history-buttons"><button title="Reuse" data-reuse="${x.id}"><i data-lucide="rotate-ccw"></i></button><button title="Delete" data-delete="${x.id}"><i data-lucide="trash-2"></i></button></div></div>`).join("");icons();
 $$("[data-delete]").forEach(b=>b.onclick=()=>{historyData=historyData.filter(x=>x.id!=b.dataset.delete);localStorage.setItem("novaHistory",JSON.stringify(historyData));renderHistory();updateStats();toast("History item deleted")});
 $$("[data-reuse]").forEach(b=>b.onclick=()=>reuse(historyData.find(x=>x.id==b.dataset.reuse)));
}
function reuse(x){if(x.type==="text"){$("#textPrompt").value=x.prompt;$("#generateText").disabled=false;navigate("text")}else if(x.type==="image"){$("#imagePrompt").value=x.prompt;$("#generateImage").disabled=false;navigate("image")}else{$("#codePrompt").value=x.prompt;$("#generateCode").disabled=false;if(x.meta.language)$("#codeLanguage").value=x.meta.language;navigate("code")}toast("Loaded into generator")}
$$("#historyTabs button").forEach(b=>b.onclick=()=>{$$("#historyTabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");historyFilter=b.dataset.filter;renderHistory()});
$("#clearHistory").onclick=()=>{historyData=[];localStorage.setItem("novaHistory","[]");renderHistory();updateStats();toast("History cleared")};
$("#quickSearch").oninput=()=>{navigate("history");renderHistory()};

const savedImageKey=localStorage.getItem("nazoImageApiKey")||"";
if($("#imageApiKey"))$("#apiKeyStatus").textContent=savedImageKey?"API key saved in this browser. Leave the field blank to keep using it.":"No API key saved yet.";
if($("#saveApiKey"))$("#saveApiKey").onclick=()=>{const key=$("#imageApiKey").value.trim();if(!key)return toast("Enter a new API key to replace the saved key");localStorage.setItem("nazoImageApiKey",key);$("#imageApiKey").value="";$("#apiKeyStatus").textContent="API key saved in this browser.";toast("Image API key saved")};

function applyTheme(theme){localStorage.setItem("novaTheme",theme);const dark=theme==="dark"||(theme==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.body.classList.toggle("dark",dark);$$("#themeControl button").forEach(b=>b.classList.toggle("active",b.dataset.theme===theme))}
$$("#themeControl button").forEach(b=>b.onclick=()=>applyTheme(b.dataset.theme));
applyTheme(localStorage.getItem("novaTheme")||"light");
updateStats();renderHistory();icons();
