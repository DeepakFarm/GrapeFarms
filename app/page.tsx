"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import {
  Sprout, LayoutDashboard, SprayCan, Droplets, Users, ReceiptText, MapPinned,
  Package, Plus, Search, Download, Globe2, Menu, X, ArrowUpRight, TrendingDown,
  Wallet, AlertTriangle, CalendarDays, Trash2, LogOut, Leaf, ShoppingCart,
  ClipboardList, Filter, RefreshCw, ShieldCheck
} from "lucide-react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

type Section = "dashboard" | "pesticides" | "fertilizers" | "labour" | "expenses" | "plots" | "reports";
type Lang = "en" | "mr";
type Plot = {id:string;name:string;crop_name:string;area:number|null;area_unit:string;notes:string};
type Item = {id:string;category:"pesticide"|"fertilizer";name:string;brand:string;unit:string;low_stock_threshold:number;notes:string};
type Tx = {id:string;item_id:string;transaction_type:"purchase"|"usage"|"adjustment";transaction_date:string;quantity:number;unit_price:number;total_cost:number;supplier:string;plot_id:string|null;purpose:string;dosage:string;notes:string};
type Labour = {id:string;work_date:string;work_category:string;worker_name:string;worker_count:number;days:number;rate_per_worker:number;extra_cost:number;plot_id:string|null;notes:string};
type Expense = {id:string;expense_date:string;category:string;description:string;amount:number;payment_method:string;plot_id:string|null;notes:string};
type Farm = {id:string;name:string;owner_id:string};

const T = {
 en:{dashboard:"Dashboard",pesticides:"Pesticides · Spray",fertilizers:"Fertilizers · Drip",labour:"Labour costs",expenses:"Other expenses",plots:"Crops & plots",reports:"Reports & export",overview:"Farm overview",overviewSub:"Track inventory, field activity and spending in one place.",totalSpend:"Total recorded expenses",stockValue:"Purchase value",lowStock:"Low-stock items",applications:"Applications logged",quickActions:"Quick actions",quickSub:"Record common farm activities",addPurchase:"Add stock purchase",recordUsage:"Record spray / drip usage",addLabour:"Add labour entry",addExpense:"Add expense",spendByType:"Spending by category",recentActivity:"Recent stock activity",recentSub:"Latest purchase and usage records",inventory:"Inventory",item:"Item",stock:"Available stock",used:"Used",purchased:"Purchased",purchase:"Purchase",usage:"Usage",date:"Date",quantity:"Quantity",unit:"Unit",price:"Price (₹)",total:"Total (₹)",supplier:"Supplier",cropPlot:"Crop / plot",purpose:"Purpose / target",dosage:"Dosage",notes:"Notes",actions:"Actions",search:"Search items...",addItem:"Add item",recordPurchase:"Record purchase",recordUsageTitle:"Record usage",noRecords:"No records yet. Add your first entry to begin tracking.",name:"Name",brand:"Brand",category:"Category",threshold:"Low-stock alert at",save:"Save entry",cancel:"Cancel",pesticide:"Pesticide",fertilizer:"Fertilizer",selectItem:"Select item",selectPlot:"Select crop / plot (optional)",plotName:"Plot name",cropName:"Crop name",area:"Area",areaUnit:"Area unit",addPlot:"Add crop / plot",plotsTitle:"Crops & plots",plotsSub:"Organize activity by field, block or crop.",labourTitle:"Labour costs",labourSub:"Track workers, workdays and wages.",workerName:"Worker / team name",workerCount:"Number of workers",days:"Days worked",rate:"Rate per worker / day (₹)",extraCost:"Extra payment (₹)",workCategory:"Work category",miscTitle:"Other expenses",miscSub:"Record transport, fuel, repairs, electricity and more.",expenseCategory:"Expense category",description:"Description",amount:"Amount (₹)",paymentMethod:"Payment method",cash:"Cash",upi:"UPI",bank:"Bank transfer",other:"Other",reportsTitle:"Reports & export",reportsSub:"Review spending and download your records.",fromDate:"From date",toDate:"To date",exportCSV:"Export CSV",totalLabour:"Labour total",totalMisc:"Miscellaneous total",totalInputs:"Spray + drip purchases",stockLedger:"Stock ledger",expensesReport:"Expense summary",language:"Language",farmName:"Farm name",createFarm:"Create farm",signIn:"Sign in",signUp:"Create account",email:"Email address",password:"Password",fullName:"Full name",signInSub:"Sign in to access your shared farm records.",createAccount:"Create account",signOut:"Sign out",setupTitle:"Connect your farm workspace",setupSub:"Create or join a farm to begin. Your records are saved to the shared database.",createWorkspace:"Create farm workspace",farmPlaceholder:"e.g. Lavate Farm",noFarm:"No farm workspace found for this account.",connectTitle:"Database setup required",connectSub:"This project needs a Supabase project before shared login and storage can work.",configSteps:"1. Create a Supabase project. 2. Run supabase/schema.sql in SQL Editor. 3. Add your project URL and anon key to Vercel environment variables.",refresh:"Refresh",low:"Low stock",ok:"In stock",purchaseDate:"Purchase date",workDate:"Work date",expenseDate:"Expense date",plotRequired:"Please select a plot if this usage applies to a specific field.",confirmDelete:"Delete this record?",delete:"Delete",allTime:"All time",month:"This month",filter:"Filter",stockCost:"Stock purchase cost",totalExpenses:"Total expenses",nothing:"Nothing to show yet",inviteHint:"To share access, add each family member or worker's account to farm_members in Supabase and assign a role.",stockNote:"Stock balances are calculated from purchase and usage transactions. Usage entries reduce stock; purchases increase it.",signingIn:"Please wait...",invalid:"Please fill all required fields.",success:"Saved successfully.",chooseFarm:"Choose a farm",appTitle:"FarmLedger",appSub:"Inventory & expenses",signedAs:"Signed in",farms:"Farm workspace"},
 mr:{dashboard:"डॅशबोर्ड",pesticides:"कीटकनाशके · फवारणी",fertilizers:"खते · ठिबक",labour:"मजुरी खर्च",expenses:"इतर खर्च",plots:"पिके व प्लॉट",reports:"अहवाल व एक्सपोर्ट",overview:"शेतीचा आढावा",overviewSub:"साठा, शेतातील कामे आणि खर्च एकाच ठिकाणी नोंदवा.",totalSpend:"एकूण नोंदवलेला खर्च",stockValue:"खरेदी मूल्य",lowStock:"कमी साठा असलेल्या वस्तू",applications:"नोंदवलेले वापर",quickActions:"जलद नोंदी",quickSub:"शेतीतील कामांची नोंद करा",addPurchase:"साठा खरेदी नोंदवा",recordUsage:"फवारणी / ठिबक वापर नोंदवा",addLabour:"मजुरी नोंदवा",addExpense:"खर्च नोंदवा",spendByType:"प्रकारानुसार खर्च",recentActivity:"अलीकडील साठा नोंदी",recentSub:"नवीन खरेदी आणि वापर",inventory:"साठा",item:"वस्तू",stock:"उपलब्ध साठा",used:"वापरले",purchased:"खरेदी",purchase:"खरेदी",usage:"वापर",date:"तारीख",quantity:"प्रमाण",unit:"एकक",price:"किंमत (₹)",total:"एकूण (₹)",supplier:"पुरवठादार",cropPlot:"पीक / प्लॉट",purpose:"उद्देश / लक्ष्य",dosage:"मात्रा",notes:"नोंदी",actions:"कृती",search:"वस्तू शोधा...",addItem:"वस्तू जोडा",recordPurchase:"खरेदी नोंदवा",recordUsageTitle:"वापर नोंदवा",noRecords:"अजून नोंदी नाहीत. सुरुवात करण्यासाठी पहिली नोंद जोडा.",name:"नाव",brand:"ब्रँड",category:"प्रकार",threshold:"कमी साठ्याची मर्यादा",save:"नोंद जतन करा",cancel:"रद्द करा",pesticide:"कीटकनाशक",fertilizer:"खत",selectItem:"वस्तू निवडा",selectPlot:"पीक / प्लॉट निवडा (ऐच्छिक)",plotName:"प्लॉटचे नाव",cropName:"पिकाचे नाव",area:"क्षेत्रफळ",areaUnit:"क्षेत्रफळ एकक",addPlot:"पीक / प्लॉट जोडा",plotsTitle:"पिके व प्लॉट",plotsSub:"शेत, विभाग किंवा पिकानुसार नोंदी ठेवा.",labourTitle:"मजुरी खर्च",labourSub:"कामगार, कामाचे दिवस आणि मजुरी नोंदवा.",workerName:"कामगार / गटाचे नाव",workerCount:"कामगारांची संख्या",days:"कामाचे दिवस",rate:"प्रति कामगार / दिवस दर (₹)",extraCost:"अतिरिक्त रक्कम (₹)",workCategory:"कामाचा प्रकार",miscTitle:"इतर खर्च",miscSub:"वाहतूक, इंधन, दुरुस्ती, वीज इत्यादी नोंदवा.",expenseCategory:"खर्चाचा प्रकार",description:"वर्णन",amount:"रक्कम (₹)",paymentMethod:"पेमेंट पद्धत",cash:"रोख",upi:"UPI",bank:"बँक ट्रान्सफर",other:"इतर",reportsTitle:"अहवाल व एक्सपोर्ट",reportsSub:"खर्च तपासा आणि नोंदी डाउनलोड करा.",fromDate:"पासून तारीख",toDate:"पर्यंत तारीख",exportCSV:"CSV डाउनलोड",totalLabour:"एकूण मजुरी",totalMisc:"एकूण इतर खर्च",totalInputs:"फवारणी + ठिबक खरेदी",stockLedger:"साठा नोंदवही",expensesReport:"खर्चाचा सारांश",language:"भाषा",farmName:"शेताचे नाव",createFarm:"शेत तयार करा",signIn:"लॉगिन",signUp:"खाते तयार करा",email:"ईमेल पत्ता",password:"पासवर्ड",fullName:"पूर्ण नाव",signInSub:"सामायिक शेत नोंदी पाहण्यासाठी लॉगिन करा.",createAccount:"खाते तयार करा",signOut:"लॉगआउट",setupTitle:"शेतीचे कार्यक्षेत्र जोडा",setupSub:"सुरुवात करण्यासाठी शेत तयार करा किंवा सामील व्हा. नोंदी डेटाबेसमध्ये जतन होतात.",createWorkspace:"शेताचे कार्यक्षेत्र तयार करा",noFarm:"या खात्यासाठी शेताचे कार्यक्षेत्र सापडले नाही.",connectTitle:"डेटाबेस सेटअप आवश्यक",connectSub:"सामायिक लॉगिन आणि साठ्यासाठी या प्रकल्पाला Supabase जोडणे आवश्यक आहे.",configSteps:"१. Supabase प्रकल्प तयार करा. २. SQL Editor मध्ये supabase/schema.sql चालवा. ३. Vercel मध्ये प्रकल्प URL आणि anon key जोडा.",refresh:"रिफ्रेश",low:"कमी साठा",ok:"पुरेसा साठा",purchaseDate:"खरेदी तारीख",workDate:"कामाची तारीख",expenseDate:"खर्चाची तारीख",plotRequired:"विशिष्ट शेतासाठी वापर असल्यास प्लॉट निवडा.",confirmDelete:"ही नोंद हटवायची?",delete:"हटवा",allTime:"सर्व कालावधी",month:"या महिन्यात",filter:"फिल्टर",stockCost:"साठा खरेदी खर्च",totalExpenses:"एकूण खर्च",nothing:"दाखवण्यासाठी नोंदी नाहीत",inviteHint:"कुटुंबीय किंवा कामगारांना प्रवेश देण्यासाठी Supabase मधील farm_members तक्त्यात त्यांचे खाते जोडा आणि भूमिका निवडा.",stockNote:"साठा खरेदी आणि वापर नोंदींवरून मोजला जातो. वापर साठा कमी करतो आणि खरेदी साठा वाढवते.",signingIn:"कृपया थांबा...",invalid:"कृपया आवश्यक माहिती भरा.",success:"यशस्वीरित्या जतन झाले.",chooseFarm:"शेत निवडा",appTitle:"FarmLedger",appSub:"साठा आणि खर्च",signedAs:"लॉगिन",farms:"शेताचे कार्यक्षेत्र"}
} as const;

const today = () => new Date().toISOString().slice(0,10);
const money = (n:number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(n||0));
const num = (n:number) => new Intl.NumberFormat("en-IN",{maximumFractionDigits:3}).format(Number(n||0));
const unitOptions = ["ml","L","g","kg","packet","bottle","bag","piece"];
const csvCell = (v:unknown) => `"${String(v ?? "").replaceAll('"','""')}"`;
function downloadCSV(filename:string, rows:Record<string,unknown>[]) {
  if (!rows.length) { alert("No data to export yet."); return; }
  const keys = Array.from(new Set(rows.flatMap(r=>Object.keys(r))));
  const content = "\ufeff" + [keys.map(csvCell).join(","),...rows.map(r=>keys.map(k=>csvCell(r[k])).join(","))].join("\r\n");
  const blob = new Blob([content],{type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

export default function Home() {
  const [lang,setLang] = useState<Lang>("en");
  const [section,setSection] = useState<Section>("dashboard");
  const [user,setUser] = useState<any>(null);
  const [sessionReady,setSessionReady] = useState(false);
  const [authMode,setAuthMode] = useState<"signin"|"signup">("signin");
  const [email,setEmail] = useState(""); const [password,setPassword] = useState(""); const [fullName,setFullName] = useState("");
  const [farm,setFarm] = useState<Farm|null>(null); const [farmName,setFarmName] = useState("");
  const [plots,setPlots] = useState<Plot[]>([]); const [items,setItems] = useState<Item[]>([]); const [txs,setTxs] = useState<Tx[]>([]);
  const [labour,setLabour] = useState<Labour[]>([]); const [expenses,setExpenses] = useState<Expense[]>([]);
  const [query,setQuery] = useState(""); const [modal,setModal] = useState<""|"item"|"purchase"|"usage"|"plot"|"labour"|"expense">("");
  const [busy,setBusy] = useState(false); const [notice,setNotice] = useState<{text:string;kind:"success"|"error"|"info"}|null>(null);
  const [itemCategory,setItemCategory] = useState<"pesticide"|"fertilizer">("pesticide");
  const [form,setForm] = useState<Record<string,string>>({});
  const t = T[lang];

  useEffect(()=>{
    if(!supabase){setSessionReady(true);return;}
    supabase.auth.getSession().then(({data})=>{setUser(data.session?.user??null);setSessionReady(true);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{setUser(session?.user??null);});
    return ()=>subscription.unsubscribe();
  },[]);

  async function loadWorkspace() {
    if(!supabase||!user)return;
    setBusy(true);
    const {data:members,error:memberErr}=await supabase.from("farm_members").select("farm_id,role").eq("user_id",user.id).limit(1);
    if(memberErr){setNotice({text:memberErr.message,kind:"error"});setBusy(false);return;}
    let farmId=members?.[0]?.farm_id;
    if(!farmId){
      const {data:owned}=await supabase.from("farms").select("*").eq("owner_id",user.id).limit(1);
      if(owned?.[0]){
        farmId=owned[0].id;
        await supabase.from("farm_members").upsert({farm_id:farmId,user_id:user.id,role:"owner"});
      }
    }
    if(!farmId){setFarm(null);setBusy(false);return;}
    const {data:farmData}=await supabase.from("farms").select("*").eq("id",farmId).single();
    if(!farmData){setFarm(null);setBusy(false);return;}
    setFarm(farmData as Farm);
    const [p,i,tx,l,e]=await Promise.all([
      supabase.from("plots").select("*").eq("farm_id",farmId).order("created_at",{ascending:false}),
      supabase.from("inventory_items").select("*").eq("farm_id",farmId).order("name"),
      supabase.from("stock_transactions").select("*").eq("farm_id",farmId).order("transaction_date",{ascending:false}),
      supabase.from("labour_entries").select("*").eq("farm_id",farmId).order("work_date",{ascending:false}),
      supabase.from("misc_expenses").select("*").eq("farm_id",farmId).order("expense_date",{ascending:false})
    ]);
    const errs=[p.error,i.error,tx.error,l.error,e.error].filter(Boolean);
    if(errs.length){setNotice({text:errs.map(x=>x!.message).join(" · "),kind:"error"});}
    setPlots((p.data??[]) as Plot[]);setItems((i.data??[]) as Item[]);setTxs((tx.data??[]) as Tx[]);setLabour((l.data??[]) as Labour[]);setExpenses((e.data??[]) as Expense[]);
    setBusy(false);
  }

  useEffect(()=>{if(user&&supabase)void loadWorkspace();},[user]);

  async function authenticate(ev:FormEvent) {
    ev.preventDefault(); if(!supabase)return;setBusy(true);setNotice(null);
    if(authMode==="signup"){
      const {error}=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName}}});
      if(error)setNotice({text:error.message,kind:"error"});
      else setNotice({text:"Account created. If email confirmation is enabled, confirm your email and then sign in.",kind:"success"});
    } else {
      const {error}=await supabase.auth.signInWithPassword({email,password});
      if(error)setNotice({text:error.message,kind:"error"});
    }
    setBusy(false);
  }

  async function createFarm(ev:FormEvent) {
    ev.preventDefault();if(!supabase||!user||!farmName.trim())return;setBusy(true);
    const {data,error}=await supabase.from("farms").insert({name:farmName.trim(),owner_id:user.id}).select("*").single();
    if(error){setNotice({text:error.message,kind:"error"});setBusy(false);return;}
    const {error:memberError}=await supabase.from("farm_members").insert({farm_id:data.id,user_id:user.id,role:"owner"});
    if(memberError){setNotice({text:memberError.message,kind:"error"});setBusy(false);return;}
    setFarm(data as Farm);setFarmName("");setNotice({text:t.success,kind:"success"});setBusy(false);await loadWorkspace();
  }

  function openModal(kind:typeof modal,defaults:Record<string,string>={}){setForm({date:today(),unit:"ml",threshold:"0",workers:"1",days:"1",rate:"0",extra:"0",payment:"Cash",category:kind==="item"?itemCategory:"Other",...defaults});setModal(kind);setNotice(null);}
  function closeModal(){setModal("");setForm({});}
  function setF(k:string,v:string){setForm(old=>({...old,[k]:v}));}

  async function submitModal(ev:FormEvent) {
    ev.preventDefault();if(!supabase||!farm)return;
    setBusy(true);setNotice(null);
    const plot_id=form.plot_id||null;
    let error:any=null;
    if(modal==="item"){
      if(!form.name?.trim()){setNotice({text:t.invalid,kind:"error"});setBusy(false);return;}
      const {error:e}=await supabase.from("inventory_items").insert({farm_id:farm.id,category:itemCategory,name:form.name.trim(),brand:form.brand||"",unit:form.unit,low_stock_threshold:Number(form.threshold||0),notes:form.notes||""});error=e;
    } else if(modal==="purchase"||modal==="usage"){
      const qty=Number(form.quantity), price=Number(form.price||0);
      if(!form.item_id||!Number.isFinite(qty)||qty<=0||(modal==="purchase"&&price<0)){setNotice({text:t.invalid,kind:"error"});setBusy(false);return;}
      const item=items.find(i=>i.id===form.item_id);
      const payload={farm_id:farm.id,item_id:form.item_id,transaction_type:modal==="purchase"?"purchase":"usage",transaction_date:form.date||today(),quantity:qty,unit_price:modal==="purchase"?price:0,total_cost:modal==="purchase"?qty*price:0,supplier:form.supplier||"",plot_id,purpose:form.purpose||"",dosage:form.dosage||"",notes:form.notes||"",created_by:user?.id};
      const balance=stockFor(form.item_id);
      if(modal==="usage"&&qty>balance){setNotice({text:`Usage (${num(qty)} ${item?.unit}) exceeds available stock (${num(balance)} ${item?.unit}).`,kind:"error"});setBusy(false);return;}
      const {error:e}=await supabase.from("stock_transactions").insert(payload);error=e;
    } else if(modal==="plot"){
      if(!form.name?.trim()||!form.crop_name?.trim()){setNotice({text:t.invalid,kind:"error"});setBusy(false);return;}
      const {error:e}=await supabase.from("plots").insert({farm_id:farm.id,name:form.name.trim(),crop_name:form.crop_name.trim(),area:form.area?Number(form.area):null,area_unit:form.area_unit||"acre",notes:form.notes||""});error=e;
    } else if(modal==="labour"){
      const workers=Number(form.workers||1),days=Number(form.days||1),rate=Number(form.rate||0),extra=Number(form.extra||0);
      if(!form.work_category?.trim()||workers<=0||days<=0||rate<0||extra<0){setNotice({text:t.invalid,kind:"error"});setBusy(false);return;}
      const {error:e}=await supabase.from("labour_entries").insert({farm_id:farm.id,work_date:form.date||today(),work_category:form.work_category,worker_name:form.worker_name||"",worker_count:workers,days,rate_per_worker:rate,extra_cost:extra,plot_id,notes:form.notes||"",created_by:user?.id});error=e;
    } else if(modal==="expense"){
      const amount=Number(form.amount);
      if(!form.description?.trim()||!Number.isFinite(amount)||amount<0){setNotice({text:t.invalid,kind:"error"});setBusy(false);return;}
      const {error:e}=await supabase.from("misc_expenses").insert({farm_id:farm.id,expense_date:form.date||today(),category:form.category||"Other",description:form.description,amount,payment_method:form.payment||"Cash",plot_id,notes:form.notes||"",created_by:user?.id});error=e;
    }
    if(error){setNotice({text:error.message,kind:"error"});setBusy(false);return;}
    closeModal();await loadWorkspace();setNotice({text:t.success,kind:"success"});setBusy(false);
  }

  async function removeRecord(table:string,id:string){
    if(!supabase||!confirm(t.confirmDelete))return;setBusy(true);
    const {error}=await supabase.from(table).delete().eq("id",id);
    if(error)setNotice({text:error.message,kind:"error"});else{setNotice({text:t.success,kind:"success"});await loadWorkspace();}
    setBusy(false);
  }

  const stockFor=(id:string)=>txs.reduce((sum,x)=>sum+(x.item_id===id?(x.transaction_type==="usage"?-Number(x.quantity):Number(x.quantity)):0),0);
  const purchasesFor=(id:string)=>txs.filter(x=>x.item_id===id&&x.transaction_type==="purchase").reduce((s,x)=>s+Number(x.quantity),0);
  const usedFor=(id:string)=>txs.filter(x=>x.item_id===id&&x.transaction_type==="usage").reduce((s,x)=>s+Number(x.quantity),0);
  const purchaseValue=txs.filter(x=>x.transaction_type==="purchase").reduce((s,x)=>s+Number(x.total_cost),0);
  const labourTotal=labour.reduce((s,x)=>s+Number(x.worker_count)*Number(x.days)*Number(x.rate_per_worker)+Number(x.extra_cost),0);
  const miscTotal=expenses.reduce((s,x)=>s+Number(x.amount),0);
  const totalSpend=purchaseValue+labourTotal+miscTotal;
  const lowItems=items.filter(i=>stockFor(i.id)<=Number(i.low_stock_threshold));
  const usageCount=txs.filter(x=>x.transaction_type==="usage").length;
  const txx=useMemo(()=>txs.filter(x=>x.transaction_type==="purchase"||x.transaction_type==="usage").slice().sort((a,b)=>b.transaction_date.localeCompare(a.transaction_date)),[txs]);
  const recent=txx.slice(0,6);
  const spendCategories=[{label:t.pesticides,value:txs.filter(x=>x.transaction_type==="purchase"&&items.find(i=>i.id===x.item_id)?.category==="pesticide").reduce((s,x)=>s+Number(x.total_cost),0)},{label:t.fertilizers,value:txs.filter(x=>x.transaction_type==="purchase"&&items.find(i=>i.id===x.item_id)?.category==="fertilizer").reduce((s,x)=>s+Number(x.total_cost),0)},{label:t.labour,value:labourTotal},{label:t.expenses,value:miscTotal}];
  const totalCategory=spendCategories.reduce((s,x)=>s+x.value,0)||1;
  const currentItems=items.filter(i=>section==="pesticides"?i.category==="pesticide":section==="fertilizers"?i.category==="fertilizer":true).filter(i=>(i.name+" "+i.brand).toLowerCase().includes(query.toLowerCase()));
  const plotName=(id:string|null)=>plots.find(p=>p.id===id)?.name||"—";
  const itemName=(id:string)=>items.find(i=>i.id===id)?.name||"Deleted item";
  const nav: {key:Section;label:string;icon:any}[]=[
    {key:"dashboard",label:t.dashboard,icon:LayoutDashboard},{key:"pesticides",label:t.pesticides,icon:SprayCan},{key:"fertilizers",label:t.fertilizers,icon:Droplets},{key:"labour",label:t.labour,icon:Users},{key:"expenses",label:t.expenses,icon:ReceiptText},{key:"plots",label:t.plots,icon:MapPinned},{key:"reports",label:t.reports,icon:ClipboardList}
  ];

  if(!sessionReady)return <div className="auth-wrap"><div className="auth-card"><Sprout size={34}/><p>{t.signingIn}</p></div></div>;

  if(!supabaseConfigured){
    return <div className="auth-wrap"><div className="auth-card"><div className="brand-mark"><Sprout/></div><h1>{t.connectTitle}</h1><p>{t.connectSub}</p><div className="notice">{t.configSteps}</div><p><b>Environment variables</b></p><code>NEXT_PUBLIC_SUPABASE_URL</code><br/><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code><p className="footer-note">Do not use a Supabase service-role key in browser environment variables. Only the anon/public key belongs here.</p><button className="btn" onClick={()=>setLang(lang==="en"?"mr":"en")}><Globe2 size={16}/>{lang==="en"?"मराठी":"English"}</button></div></div>;
  }

  if(!user){
    return <div className="auth-wrap"><form className="auth-card" onSubmit={authenticate}><div className="brand"><div className="brand-mark"><Sprout/></div><div><div className="brand-name">FarmLedger</div><div className="brand-sub">Inventory & expenses</div></div></div><h1>{authMode==="signin"?t.signIn:t.createAccount}</h1><p>{t.signInSub}</p>
      {authMode==="signup"&&<div className="field"><label>{t.fullName}</label><input required value={fullName} onChange={e=>setFullName(e.target.value)} autoComplete="name"/></div>}
      <div className="field"><label>{t.email}</label><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></div>
      <div className="field"><label>{t.password}</label><input required type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={authMode==="signin"?"current-password":"new-password"}/></div>
      {notice&&<div className={`notice ${notice.kind==="error"?"error":notice.kind==="success"?"success":""}`}>{notice.text}</div>}
      <button className="btn primary" disabled={busy}>{busy?t.signingIn:authMode==="signin"?t.signIn:t.createAccount}</button>
      <button type="button" className="btn" onClick={()=>{setAuthMode(authMode==="signin"?"signup":"signin");setNotice(null);}}>{authMode==="signin"?t.signUp:t.signIn}</button>
      <div className="footer-note">Private farm data · Shared with invited farm members · ₹ INR</div>
      <div className="divider"/><button type="button" className="btn" onClick={()=>setLang(lang==="en"?"mr":"en")}><Globe2 size={16}/>{lang==="en"?"मराठी":"English"}</button>
    </form></div>;
  }

  if(!farm){
    return <div className="auth-wrap"><form className="auth-card" onSubmit={createFarm}><div className="brand-mark"><Sprout/></div><h1>{t.setupTitle}</h1><p>{t.setupSub}</p><div className="field"><label>{t.farmName}</label><input value={farmName} onChange={e=>setFarmName(e.target.value)} required placeholder="e.g. Lavate Farm"/></div>{notice&&<div className={`notice ${notice.kind==="error"?"error":"success"}`}>{notice.text}</div>}<button className="btn primary" disabled={busy}><Plus size={16}/>{t.createWorkspace}</button><p className="footer-note">{t.inviteHint}</p><button type="button" className="btn" onClick={()=>supabase?.auth.signOut()}><LogOut size={15}/>{t.signOut}</button></form></div>;
  }

  function exportInventory(){
    downloadCSV("farm-inventory.csv",items.map(i=>({item:i.name,category:i.category,brand:i.brand,unit:i.unit,purchased:purchasesFor(i.id),used:usedFor(i.id),remaining:stockFor(i.id),low_stock_threshold:i.low_stock_threshold,purchase_cost:txs.filter(x=>x.item_id===i.id&&x.transaction_type==="purchase").reduce((s,x)=>s+Number(x.total_cost),0)})));
  }
  function exportLedger(){
    downloadCSV("farm-stock-ledger.csv",txs.map(x=>({date:x.transaction_date,type:x.transaction_type,item:itemName(x.item_id),quantity:x.quantity,unit:items.find(i=>i.id===x.item_id)?.unit||"",unit_price:x.unit_price,total_cost:x.total_cost,supplier:x.supplier,plot:plotName(x.plot_id),purpose:x.purpose,dosage:x.dosage,notes:x.notes})));
  }
  function exportExpenses(){
    downloadCSV("farm-expenses.csv",[
      ...labour.map(x=>({date:x.work_date,type:"Labour",category:x.work_category,description:x.worker_name,amount:Number(x.worker_count)*Number(x.days)*Number(x.rate_per_worker)+Number(x.extra_cost),plot:plotName(x.plot_id),notes:x.notes})),
      ...expenses.map(x=>({date:x.expense_date,type:"Miscellaneous",category:x.category,description:x.description,amount:x.amount,payment_method:x.payment_method,plot:plotName(x.plot_id),notes:x.notes})),
      ...txs.filter(x=>x.transaction_type==="purchase").map(x=>({date:x.transaction_date,type:"Input purchase",category:items.find(i=>i.id===x.item_id)?.category||"",description:itemName(x.item_id),amount:x.total_cost,plot:plotName(x.plot_id),notes:x.notes}))
    ]);
  }

  const PageHead=({title,sub,button}:{title:string;sub:string;button?:React.ReactNode})=><div className="page-head"><div><div className="eyebrow">{farm?.name ?? ""}</div><h1>{title}</h1><p>{sub}</p></div>{button}</div>;
  const Stat=({icon:Icon,label,value,foot}:{icon:any;label:string;value:string;foot:string})=><div className="stat"><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={17}/></span></div><div className="stat-value">{value}</div><div className="stat-foot">{foot}</div></div>;

  function renderInventory(category:"pesticide"|"fertilizer"){
    const title=category==="pesticide"?t.pesticides:t.fertilizers;
    const list=items.filter(i=>i.category===category).filter(i=>(i.name+" "+i.brand).toLowerCase().includes(query.toLowerCase()));
    return <><PageHead title={title} sub={category==="pesticide"?"Track spray chemical stock, application dates, dosage and field usage.":"Track water-soluble fertilizers, drip application and remaining stock."} button={<button className="btn primary" onClick={()=>{setItemCategory(category);openModal("item",{unit:category==="pesticide"?"ml":"kg"});}}><Plus size={16}/>{t.addItem}</button>}/>
      <div className="stats"><Stat icon={Package} label={t.inventory} value={String(list.length)} foot="Registered products"/><Stat icon={ShoppingCart} label={t.purchased} value={num(list.reduce((s,i)=>s+purchasesFor(i.id),0))} foot="Across different units"/><Stat icon={TrendingDown} label={t.used} value={String(list.reduce((s,i)=>s+(usedFor(i.id)>0?1:0),0))} foot="Products used"/><Stat icon={AlertTriangle} label={t.lowStock} value={String(list.filter(i=>stockFor(i.id)<=Number(i.low_stock_threshold)).length)} foot="At or below threshold"/></div>
      <div className="panel"><div className="toolbar"><input className="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search}/><div className="inline-actions"><button className="btn" onClick={()=>openModal("purchase",{category})}><Plus size={15}/>{t.recordPurchase}</button><button className="btn primary" onClick={()=>openModal("usage",{category})}><SprayCan size={15}/>{t.recordUsageTitle}</button></div></div>
      <div className="table-wrap"><table><thead><tr><th>{t.item}</th><th>{t.purchased}</th><th>{t.used}</th><th>{t.stock}</th><th>{t.price}</th><th>Status</th><th>{t.actions}</th></tr></thead><tbody>{list.map(i=>{const bal=stockFor(i.id);const cost=txs.filter(x=>x.item_id===i.id&&x.transaction_type==="purchase").reduce((s,x)=>s+Number(x.total_cost),0);return <tr key={i.id}><td><div className="item-name">{i.name}</div><div className="subtext">{i.brand||"—"} · {i.unit}</div></td><td>{num(purchasesFor(i.id))} {i.unit}</td><td>{num(usedFor(i.id))} {i.unit}</td><td><b>{num(bal)} {i.unit}</b></td><td>{money(cost)}</td><td><span className={`pill ${bal<=Number(i.low_stock_threshold)?"low":""}`}>{bal<=Number(i.low_stock_threshold)?t.low:t.ok}</span></td><td><div className="inline-actions"><button className="btn small" onClick={()=>openModal("purchase",{item_id:i.id})}>{t.purchase}</button><button className="btn small" onClick={()=>openModal("usage",{item_id:i.id})}>{t.usage}</button><button className="btn small danger" title={t.delete} onClick={()=>removeRecord("inventory_items",i.id)}><Trash2 size={13}/></button></div></td></tr>})}{list.length===0&&<tr><td colSpan={7}><div className="empty">{t.noRecords}</div></td></tr>}</tbody></table></div><p className="footer-note">{t.stockNote}</p></div>
      <div className="panel" style={{marginTop:16}}><div className="panel-head"><div><h2>{t.recentActivity}</h2><div className="panel-sub">{t.recentSub}</div></div><button className="btn small" onClick={exportLedger}><Download size={14}/>{t.exportCSV}</button></div><div className="table-wrap"><table><thead><tr><th>{t.date}</th><th>{t.item}</th><th>{t.category}</th><th>{t.quantity}</th><th>{t.total}</th><th>{t.cropPlot}</th><th>{t.purpose}</th></tr></thead><tbody>{txs.filter(x=>items.find(i=>i.id===x.item_id)?.category===category).slice(0,8).map(x=><tr key={x.id}><td>{x.transaction_date}</td><td>{itemName(x.item_id)}</td><td><span className={`pill ${x.transaction_type==="usage"?"warn":""}`}>{x.transaction_type}</span></td><td>{num(x.quantity)} {items.find(i=>i.id===x.item_id)?.unit}</td><td>{x.transaction_type==="purchase"?money(x.total_cost):"—"}</td><td>{plotName(x.plot_id)}</td><td>{x.purpose||"—"}</td></tr>)}</tbody></table></div></div></>;
  }

  function renderDashboard(){
    return <><PageHead title={t.overview} sub={t.overviewSub} button={<button className="btn" onClick={()=>void loadWorkspace()}><RefreshCw size={15}/>{t.refresh}</button>}/>
      <div className="stats"><Stat icon={Wallet} label={t.totalSpend} value={money(totalSpend)} foot="Input purchases + labour + other costs"/><Stat icon={Package} label={t.stockValue} value={money(purchaseValue)} foot="Total input purchase cost"/><Stat icon={AlertTriangle} label={t.lowStock} value={String(lowItems.length)} foot="Items at or below threshold"/><Stat icon={SprayCan} label={t.applications} value={String(usageCount)} foot="Spray / drip usage entries"/></div>
      {lowItems.length>0&&<div className="notice"><b>{t.lowStock}:</b> {lowItems.map(i=>`${i.name} (${num(stockFor(i.id))} ${i.unit})`).join(", ")}</div>}
      <div className="grid-2"><div className="panel"><div className="panel-head"><div><h2>{t.spendByType}</h2><div className="panel-sub">Based on recorded transactions</div></div><Wallet size={18} color="#2f7a57"/></div><div className="bar-list">{spendCategories.map(c=><div className="bar-row" key={c.label}><span>{c.label}</span><div className="bar-track"><div className="bar-fill" style={{width:`${Math.min(100,c.value/totalCategory*100)}%`}}/></div><span className="bar-value">{money(c.value)}</span></div>)}</div><div className="divider"/><div className="chart-legend"><span><i className="dot"/>Recorded costs only</span><span>Not a crop profitability estimate</span></div></div>
        <div className="panel"><div className="panel-head"><div><h2>{t.quickActions}</h2><div className="panel-sub">{t.quickSub}</div></div><ArrowUpRight size={18}/></div><div className="quick-grid"><button className="quick-action" onClick={()=>{setItemCategory("pesticide");openModal("item",{unit:"ml"});}}><span className="quick-icon"><SprayCan/></span><span><strong>{t.addItem}</strong><small>{t.pesticide}</small></span></button><button className="quick-action" onClick={()=>openModal("purchase")}><span className="quick-icon"><ShoppingCart/></span><span><strong>{t.addPurchase}</strong><small>Update available stock</small></span></button><button className="quick-action" onClick={()=>openModal("usage")}><span className="quick-icon"><Droplets/></span><span><strong>{t.recordUsage}</strong><small>Track crop applications</small></span></button><button className="quick-action" onClick={()=>openModal("labour")}><span className="quick-icon"><Users/></span><span><strong>{t.addLabour}</strong><small>Workers and wage costs</small></span></button><button className="quick-action" onClick={()=>openModal("expense")}><span className="quick-icon"><ReceiptText/></span><span><strong>{t.addExpense}</strong><small>Fuel, transport, repairs…</small></span></button><button className="quick-action" onClick={()=>openModal("plot")}><span className="quick-icon"><MapPinned/></span><span><strong>{t.addPlot}</strong><small>Organize farm records</small></span></button></div></div></div>
      <div className="panel" style={{marginTop:16}}><div className="panel-head"><div><h2>{t.recentActivity}</h2><div className="panel-sub">{t.recentSub}</div></div><button className="btn small" onClick={exportLedger}><Download size={14}/>{t.exportCSV}</button></div><div className="table-wrap"><table><thead><tr><th>{t.date}</th><th>{t.item}</th><th>{t.category}</th><th>{t.quantity}</th><th>{t.total}</th><th>{t.cropPlot}</th></tr></thead><tbody>{recent.map(x=><tr key={x.id}><td>{x.transaction_date}</td><td><b>{itemName(x.item_id)}</b></td><td><span className={`pill ${x.transaction_type==="usage"?"warn":""}`}>{x.transaction_type}</span></td><td>{num(x.quantity)} {items.find(i=>i.id===x.item_id)?.unit}</td><td>{x.transaction_type==="purchase"?money(x.total_cost):"—"}</td><td>{plotName(x.plot_id)}</td></tr>)}{recent.length===0&&<tr><td colSpan={6}><div className="empty">{t.noRecords}</div></td></tr>}</tbody></table></div></div>
    </>;
  }

  function renderPlots(){
    return <><PageHead title={t.plotsTitle} sub={t.plotsSub} button={<button className="btn primary" onClick={()=>openModal("plot")}><Plus size={16}/>{t.addPlot}</button>}/><div className="panel"><div className="table-wrap"><table><thead><tr><th>{t.plotName}</th><th>{t.cropName}</th><th>{t.area}</th><th>{t.notes}</th><th>{t.actions}</th></tr></thead><tbody>{plots.map(p=><tr key={p.id}><td><b>{p.name}</b></td><td><span className="pill">{p.crop_name}</span></td><td>{p.area?`${num(p.area)} ${p.area_unit}`:"—"}</td><td>{p.notes||"—"}</td><td><button className="btn small danger" onClick={()=>removeRecord("plots",p.id)}><Trash2 size={13}/>{t.delete}</button></td></tr>)}{plots.length===0&&<tr><td colSpan={5}><div className="empty">{t.noRecords}</div></td></tr>}</tbody></table></div></div></>;
  }

  function renderLabour(){
    return <><PageHead title={t.labourTitle} sub={t.labourSub} button={<button className="btn primary" onClick={()=>openModal("labour")}><Plus size={16}/>{t.addLabour}</button>}/><div className="stats"><Stat icon={Users} label={t.labour} value={money(labourTotal)} foot="Workers × days × rate + extras"/><Stat icon={CalendarDays} label="Entries" value={String(labour.length)} foot="Recorded work sessions"/><Stat icon={MapPinned} label={t.plots} value={String(new Set(labour.map(x=>x.plot_id).filter(Boolean)).size)} foot="Plots with labour records"/><Stat icon={Wallet} label="Average entry" value={money(labour.length?labourTotal/labour.length:0)} foot="Across recorded entries"/></div><div className="panel"><div className="toolbar"><span className="muted">{labour.length} entries</span><button className="btn" onClick={()=>downloadCSV("farm-labour.csv",labour.map(x=>({date:x.work_date,category:x.work_category,worker:x.worker_name,workers:x.worker_count,days:x.days,rate:x.rate_per_worker,extra:x.extra_cost,total:Number(x.worker_count)*Number(x.days)*Number(x.rate_per_worker)+Number(x.extra_cost),plot:plotName(x.plot_id),notes:x.notes}))) }><Download size={15}/>{t.exportCSV}</button></div><div className="table-wrap"><table><thead><tr><th>{t.date}</th><th>{t.workCategory}</th><th>{t.workerName}</th><th>Workers × days</th><th>{t.price}</th><th>{t.total}</th><th>{t.cropPlot}</th><th>{t.actions}</th></tr></thead><tbody>{labour.map(x=><tr key={x.id}><td>{x.work_date}</td><td>{x.work_category}</td><td>{x.worker_name||"—"}</td><td>{x.worker_count} × {x.days}</td><td>{money(x.rate_per_worker)}</td><td><b>{money(Number(x.worker_count)*Number(x.days)*Number(x.rate_per_worker)+Number(x.extra_cost))}</b></td><td>{plotName(x.plot_id)}</td><td><button className="btn small danger" onClick={()=>removeRecord("labour_entries",x.id)}><Trash2 size={13}/></button></td></tr>)}{labour.length===0&&<tr><td colSpan={8}><div className="empty">{t.noRecords}</div></td></tr>}</tbody></table></div></div></>;
  }

  function renderExpenses(){
    return <><PageHead title={t.miscTitle} sub={t.miscSub} button={<button className="btn primary" onClick={()=>openModal("expense")}><Plus size={16}/>{t.addExpense}</button>}/><div className="stats"><Stat icon={Wallet} label={t.totalMisc} value={money(miscTotal)} foot="All recorded miscellaneous expenses"/><Stat icon={ReceiptText} label="Entries" value={String(expenses.length)} foot="Expense records"/><Stat icon={CalendarDays} label="Categories" value={String(new Set(expenses.map(x=>x.category)).size)} foot="Types of spending"/><Stat icon={TrendingDown} label="Average entry" value={money(expenses.length?miscTotal/expenses.length:0)} foot="Across recorded expenses"/></div><div className="panel"><div className="toolbar"><span className="muted">{expenses.length} entries</span><button className="btn" onClick={()=>downloadCSV("farm-misc-expenses.csv",expenses.map(x=>({date:x.expense_date,category:x.category,description:x.description,amount:x.amount,payment:x.payment_method,plot:plotName(x.plot_id),notes:x.notes}))) }><Download size={15}/>{t.exportCSV}</button></div><div className="table-wrap"><table><thead><tr><th>{t.date}</th><th>{t.expenseCategory}</th><th>{t.description}</th><th>{t.paymentMethod}</th><th>{t.amount}</th><th>{t.cropPlot}</th><th>{t.notes}</th><th>{t.actions}</th></tr></thead><tbody>{expenses.map(x=><tr key={x.id}><td>{x.expense_date}</td><td><span className="pill">{x.category}</span></td><td><b>{x.description}</b></td><td>{x.payment_method}</td><td><b>{money(x.amount)}</b></td><td>{plotName(x.plot_id)}</td><td>{x.notes||"—"}</td><td><button className="btn small danger" onClick={()=>removeRecord("misc_expenses",x.id)}><Trash2 size={13}/></button></td></tr>)}{expenses.length===0&&<tr><td colSpan={8}><div className="empty">{t.noRecords}</div></td></tr>}</tbody></table></div></div></>;
  }

  function renderReports(){
    return <><PageHead title={t.reportsTitle} sub={t.reportsSub} button={<button className="btn primary" onClick={exportExpenses}><Download size={16}/>{t.exportCSV}</button>}/><div className="report-cards"><div className="report-card"><small>{t.totalInputs}</small><strong>{money(purchaseValue)}</strong></div><div className="report-card"><small>{t.totalLabour}</small><strong>{money(labourTotal)}</strong></div><div className="report-card"><small>{t.totalMisc}</small><strong>{money(miscTotal)}</strong></div></div><div className="panel" style={{marginTop:16}}><div className="panel-head"><div><h2>{t.expensesReport}</h2><div className="panel-sub">Recorded costs grouped by category</div></div></div><div className="bar-list">{spendCategories.map(c=><div className="bar-row" key={c.label}><span>{c.label}</span><div className="bar-track"><div className="bar-fill" style={{width:`${Math.min(100,c.value/totalCategory*100)}%`}}/></div><span className="bar-value">{money(c.value)}</span></div>)}</div><div className="divider"/><div className="report-cards"><div className="report-card"><small>{t.totalExpenses}</small><strong>{money(totalSpend)}</strong></div><div className="report-card"><small>{t.inventory}</small><strong>{items.length} items</strong></div><div className="report-card"><small>{t.plots}</small><strong>{plots.length} plots</strong></div></div></div><div className="panel" style={{marginTop:16}}><div className="panel-head"><div><h2>{t.stockLedger}</h2><div className="panel-sub">Full transaction history for audit and reconciliation</div></div><button className="btn" onClick={exportLedger}><Download size={15}/>{t.exportCSV}</button></div><div className="table-wrap"><table><thead><tr><th>{t.date}</th><th>{t.item}</th><th>{t.category}</th><th>{t.quantity}</th><th>{t.price}</th><th>{t.total}</th><th>{t.cropPlot}</th><th>{t.purpose}</th></tr></thead><tbody>{txs.map(x=><tr key={x.id}><td>{x.transaction_date}</td><td>{itemName(x.item_id)}</td><td><span className={`pill ${x.transaction_type==="usage"?"warn":""}`}>{x.transaction_type}</span></td><td>{num(x.quantity)} {items.find(i=>i.id===x.item_id)?.unit}</td><td>{money(x.unit_price)}</td><td>{money(x.total_cost)}</td><td>{plotName(x.plot_id)}</td><td>{x.purpose||"—"}</td></tr>)}{txs.length===0&&<tr><td colSpan={8}><div className="empty">{t.noRecords}</div></td></tr>}</tbody></table></div></div></>;
  }

  function renderModal(){
    if(!modal)return null;
    const title=modal==="item"?t.addItem:modal==="purchase"?t.recordPurchase:modal==="usage"?t.recordUsageTitle:modal==="plot"?t.addPlot:modal==="labour"?t.addLabour:t.addExpense;
    const category=modal==="item"?itemCategory:form.category;
    const filteredItems=items.filter(i=>!form.category||i.category===form.category||!["pesticide","fertilizer"].includes(form.category)).filter(i=>!form.item_id||i.id===form.item_id);
    return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeModal();}}><div className="modal"><div className="modal-head"><div><h2>{title}</h2><p>{farm.name} · {t.language==="Language"?"":""}{lang==="en"?"English":"मराठी"}</p></div><button className="btn small" onClick={closeModal}><X size={16}/></button></div>
      {notice&&<div className={`notice ${notice.kind==="error"?"error":notice.kind==="success"?"success":""}`}>{notice.text}</div>}
      <form onSubmit={submitModal}><div className="form-grid">
      {modal==="item"&&<><div className="field"><label>{t.category}</label><select value={itemCategory} onChange={e=>setItemCategory(e.target.value as any)}><option value="pesticide">{t.pesticide}</option><option value="fertilizer">{t.fertilizer}</option></select></div><div className="field"><label>{t.name} *</label><input required value={form.name||""} onChange={e=>setF("name",e.target.value)}/></div><div className="field"><label>{t.brand}</label><input value={form.brand||""} onChange={e=>setF("brand",e.target.value)}/></div><div className="field"><label>{t.unit}</label><select value={form.unit||"ml"} onChange={e=>setF("unit",e.target.value)}>{unitOptions.map(u=><option key={u}>{u}</option>)}</select></div><div className="field"><label>{t.threshold}</label><input type="number" min="0" step="any" value={form.threshold||"0"} onChange={e=>setF("threshold",e.target.value)}/></div><div className="field full"><label>{t.notes}</label><textarea value={form.notes||""} onChange={e=>setF("notes",e.target.value)}/></div></>}
      {(modal==="purchase"||modal==="usage")&&<><div className="field"><label>{t.item} *</label><select required value={form.item_id||""} onChange={e=>{const i=items.find(x=>x.id===e.target.value);setF("item_id",e.target.value);if(i)setF("category",i.category);}}><option value="">{t.selectItem}</option>{items.filter(i=>!form.category||i.category===form.category||!["pesticide","fertilizer"].includes(form.category)).map(i=><option key={i.id} value={i.id}>{i.name} — {i.category} ({num(stockFor(i.id))} {i.unit})</option>)}</select>{form.item_id&&<small>Available: {num(stockFor(form.item_id))} {items.find(i=>i.id===form.item_id)?.unit}</small>}</div><div className="field"><label>{t.date}</label><input required type="date" value={form.date||today()} onChange={e=>setF("date",e.target.value)}/></div><div className="field"><label>{t.quantity} *</label><input required type="number" min=".001" step="any" value={form.quantity||""} onChange={e=>setF("quantity",e.target.value)}/></div>{modal==="purchase"&&<><div className="field"><label>{t.price} / {t.unit}</label><input type="number" min="0" step=".01" value={form.price||""} onChange={e=>setF("price",e.target.value)}/><small>Total purchase cost is calculated automatically.</small></div><div className="field"><label>{t.supplier}</label><input value={form.supplier||""} onChange={e=>setF("supplier",e.target.value)}/></div></>}{modal==="usage"&&<><div className="field"><label>{t.cropPlot}</label><select value={form.plot_id||""} onChange={e=>setF("plot_id",e.target.value)}><option value="">{t.selectPlot}</option>{plots.map(p=><option key={p.id} value={p.id}>{p.name} — {p.crop_name}</option>)}</select></div><div className="field"><label>{t.purpose}</label><input value={form.purpose||""} onChange={e=>setF("purpose",e.target.value)} placeholder="e.g. aphids, fungal disease, nutrition"/></div><div className="field"><label>{t.dosage}</label><input value={form.dosage||""} onChange={e=>setF("dosage",e.target.value)} placeholder="e.g. ml per 15 L tank"/></div></>}<div className="field full"><label>{t.notes}</label><textarea value={form.notes||""} onChange={e=>setF("notes",e.target.value)}/></div></>}
      {modal==="plot"&&<><div className="field"><label>{t.plotName} *</label><input required value={form.name||""} onChange={e=>setF("name",e.target.value)}/></div><div className="field"><label>{t.cropName} *</label><input required value={form.crop_name||""} onChange={e=>setF("crop_name",e.target.value)}/></div><div className="field"><label>{t.area}</label><input type="number" min="0" step="any" value={form.area||""} onChange={e=>setF("area",e.target.value)}/></div><div className="field"><label>{t.areaUnit}</label><select value={form.area_unit||"acre"} onChange={e=>setF("area_unit",e.target.value)}><option>acre</option><option>hectare</option><option>guntha</option><option>sq ft</option></select></div><div className="field full"><label>{t.notes}</label><textarea value={form.notes||""} onChange={e=>setF("notes",e.target.value)}/></div></>}
      {modal==="labour"&&<><div className="field"><label>{t.date}</label><input type="date" required value={form.date||today()} onChange={e=>setF("date",e.target.value)}/></div><div className="field"><label>{t.workCategory} *</label><select value={form.work_category||""} required onChange={e=>setF("work_category",e.target.value)}><option value="">Choose</option>{["Spraying","Drip irrigation","Weeding","Pruning","Harvesting","Planting","Fertilizer application","Land preparation","Transport","General work","Other"].map(x=><option key={x}>{x}</option>)}</select></div><div className="field"><label>{t.workerName}</label><input value={form.worker_name||""} onChange={e=>setF("worker_name",e.target.value)}/></div><div className="field"><label>{t.cropPlot}</label><select value={form.plot_id||""} onChange={e=>setF("plot_id",e.target.value)}><option value="">{t.selectPlot}</option>{plots.map(p=><option key={p.id} value={p.id}>{p.name} — {p.crop_name}</option>)}</select></div><div className="field"><label>{t.workerCount}</label><input required type="number" min="1" step="1" value={form.workers||"1"} onChange={e=>setF("workers",e.target.value)}/></div><div className="field"><label>{t.days}</label><input required type="number" min=".01" step=".01" value={form.days||"1"} onChange={e=>setF("days",e.target.value)}/></div><div className="field"><label>{t.rate}</label><input required type="number" min="0" step=".01" value={form.rate||"0"} onChange={e=>setF("rate",e.target.value)}/></div><div className="field"><label>{t.extraCost}</label><input type="number" min="0" step=".01" value={form.extra||"0"} onChange={e=>setF("extra",e.target.value)}/></div><div className="field full"><label>{t.notes}</label><textarea value={form.notes||""} onChange={e=>setF("notes",e.target.value)}/></div></>}
      {modal==="expense"&&<><div className="field"><label>{t.date}</label><input required type="date" value={form.date||today()} onChange={e=>setF("date",e.target.value)}/></div><div className="field"><label>{t.expenseCategory}</label><select value={form.category||"Other"} onChange={e=>setF("category",e.target.value)}>{["Fuel","Electricity","Equipment repair","Transport","Machinery rental","Irrigation","Seeds","Rent","Packaging","Phone / internet","Other"].map(x=><option key={x}>{x}</option>)}</select></div><div className="field full"><label>{t.description} *</label><input required value={form.description||""} onChange={e=>setF("description",e.target.value)}/></div><div className="field"><label>{t.amount} *</label><input required type="number" min="0" step=".01" value={form.amount||""} onChange={e=>setF("amount",e.target.value)}/></div><div className="field"><label>{t.paymentMethod}</label><select value={form.payment||"Cash"} onChange={e=>setF("payment",e.target.value)}><option>Cash</option><option>UPI</option><option>Bank transfer</option><option>Credit</option><option>Other</option></select></div><div className="field"><label>{t.cropPlot}</label><select value={form.plot_id||""} onChange={e=>setF("plot_id",e.target.value)}><option value="">{t.selectPlot}</option>{plots.map(p=><option key={p.id} value={p.id}>{p.name} — {p.crop_name}</option>)}</select></div><div className="field full"><label>{t.notes}</label><textarea value={form.notes||""} onChange={e=>setF("notes",e.target.value)}/></div></>}
      </div><div className="modal-actions"><button type="button" className="btn" onClick={closeModal}>{t.cancel}</button><button className="btn primary" disabled={busy}>{busy?t.signingIn:t.save}</button></div></form></div></div>;
  }

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><Sprout size={23}/></div><div><div className="brand-name">FarmLedger</div><div className="brand-sub">{t.appSub}</div></div></div><div><div className="nav-label">Workspace</div><div className="nav-list">{nav.map(n=><button key={n.key} className={`nav-btn ${section===n.key?"active":""}`} onClick={()=>{setSection(n.key);setQuery("");}}><n.icon size={17}/>{n.label}</button>)}</div></div><div className="sidebar-bottom"><div><ShieldCheck size={14} style={{display:"inline",marginRight:6}}/>{t.signedAs}</div><b>{user.email}</b><div style={{marginTop:7}}>{t.inviteHint}</div></div></aside>
    <main className="main"><header className="topbar"><div style={{display:"flex",alignItems:"center",gap:10}}><span className="mobile-menu"><Sprout size={23} color="#1f5b43"/></span><div><b>{farm.name}</b><div><small>{t.appTitle} / {t.appSub}</small></div></div></div><div className="top-actions"><div className="lang-toggle"><button className={lang==="en"?"active":""} onClick={()=>setLang("en")}>EN</button><button className={lang==="mr"?"active":""} onClick={()=>setLang("mr")}>मराठी</button></div><button className="btn small" onClick={()=>void loadWorkspace()} title={t.refresh}><RefreshCw size={14}/></button><button className="btn small" onClick={()=>supabase?.auth.signOut()}><LogOut size={14}/><span>{t.signOut}</span></button></div></header>
      <div className="content">{notice&&<div className={`notice ${notice.kind==="error"?"error":notice.kind==="success"?"success":""}`}>{notice.text}<button style={{float:"right",border:0,background:"transparent"}} onClick={()=>setNotice(null)}><X size={13}/></button></div>}
        {section==="dashboard"&&renderDashboard()}{section==="pesticides"&&renderInventory("pesticide")}{section==="fertilizers"&&renderInventory("fertilizer")}{section==="plots"&&renderPlots()}{section==="labour"&&renderLabour()}{section==="expenses"&&renderExpenses()}{section==="reports"&&renderReports()}
      </div></main>
    {renderModal()}
  </div>;
}
