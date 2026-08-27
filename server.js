import express from "express";
import multer from "multer";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
const PORT=process.env.PORT||3000;
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||"DEGISTIR";
const SITE_URL=process.env.SITE_URL||`http://localhost:${PORT}`;
const uploadDir=process.env.UPLOAD_DIR||path.join(__dirname,"uploads");
fs.mkdirSync(uploadDir,{recursive:true});

app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));

const allowed=new Set(["image/jpeg","image/png","image/webp","image/heic","image/heif"]);
const storage=multer.diskStorage({
  destination:uploadDir,
  filename:(req,file,cb)=>{
    const ext=path.extname(file.originalname).toLowerCase();
    cb(null,`${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  }
});
const upload=multer({
  storage,
  limits:{fileSize:15*1024*1024,files:20},
  fileFilter:(req,file,cb)=>cb(null,allowed.has(file.mimetype))
});
const sessions=new Set();

function mimeFor(name){
  const e=path.extname(name).toLowerCase();
  return ({".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",".webp":"image/webp",".heic":"image/heic",".heif":"image/heif"})[e]||"application/octet-stream";
}
function auth(req,res,next){
  const token=req.headers.authorization?.replace("Bearer ","");
  if(!token||!sessions.has(token)) return res.status(401).json({error:"Yetkisiz"});
  next();
}

app.get("/",(req,res)=>res.redirect("/upload"));
app.get("/upload",(req,res)=>res.sendFile(path.join(__dirname,"public","upload.html")));
app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"public","admin.html")));
app.get("/health",(req,res)=>res.status(200).send("ok"));

app.post("/api/upload",upload.array("photos",20),(req,res)=>{
  res.json({ok:true,count:(req.files||[]).length});
});

app.post("/api/login",(req,res)=>{
  if(req.body?.password!==ADMIN_PASSWORD) return res.status(401).json({error:"Şifre hatalı"});
  const token=crypto.randomBytes(32).toString("hex");
  sessions.add(token);
  res.json({token});
});

app.get("/api/photos",auth,(req,res)=>{
  const photos=fs.readdirSync(uploadDir)
    .filter(f=>allowed.has(mimeFor(f)))
    .map(name=>{
      const s=fs.statSync(path.join(uploadDir,name));
      return {id:name,size:s.size,uploadedAt:s.mtime.toISOString(),url:`/api/photo/${encodeURIComponent(name)}`};
    })
    .sort((a,b)=>b.uploadedAt.localeCompare(a.uploadedAt));
  res.json(photos);
});

app.get("/api/photo/:name",auth,(req,res)=>{
  const safe=path.basename(req.params.name), p=path.join(uploadDir,safe);
  if(!fs.existsSync(p)) return res.sendStatus(404);
  res.type(mimeFor(safe)).sendFile(p);
});

app.get("/api/photo/:name/download",auth,(req,res)=>{
  const safe=path.basename(req.params.name), p=path.join(uploadDir,safe);
  if(!fs.existsSync(p)) return res.sendStatus(404);
  res.download(p,safe);
});

app.delete("/api/photo/:name",auth,(req,res)=>{
  const safe=path.basename(req.params.name), p=path.join(uploadDir,safe);
  if(fs.existsSync(p)) fs.unlinkSync(p);
  res.json({ok:true});
});

app.get("/api/qr",async(req,res)=>{
  const target=`${SITE_URL}/upload`;
  res.type("png").send(await QRCode.toBuffer(target,{width:900,margin:2}));
});

app.listen(PORT,"0.0.0.0",()=>console.log(`Site: ${SITE_URL}`));
