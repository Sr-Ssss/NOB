/* global process */
const BUD=+process.env.TINTA||12;
const N=['Pingo','Seta','Clipe','Aparo','Cartao','Tesoura','Borrao'];
const sets={base:[[1,1,2,1],[2,2,4,1],[2,2,2,1],[3,2,2,2],[3,5,1,1],[4,4,2,3],[5,6,1,3]]};
for(const a of process.argv.slice(2)){const[n,j]=a.split('=');sets[n]=JSON.parse(j)}
const R=n=>Math.random()*n|0, W=6,H=8;
function armies(C){const o=[];for(let a=0;a<7;a++)for(let b=a+1;b<7;b++)for(let c=b+1;c<7;c++)
 for(let i=1;i<=BUD;i++)for(let j=1;j<=BUD;j++)for(let k=1;k<=BUD;k++)if(C[a][0]*i+C[b][0]*j+C[c][0]*k===BUD&&(a!==0||i<=(+process.env.CAP||99))){const v=Array(7).fill(0);v[a]=i;v[b]=j;v[c]=k;o.push(v)}return o}
const d=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
function game(C,A,B,first){const u=[];[A,B].forEach((v,s)=>{let l=[];v.forEach((n,c)=>{while(n--)l.push(c)});l.sort((a,b)=>(b>=4)-(a>=4));
 l.forEach((c,i)=>u.push({c,s,h:C[c][1],x:[2,3,1,4,0,5][i%6],y:s?H-1-(i/6|0)*1:(i/6|0)}))});
 const pts=[0,0];
 const hit=(t,n,by)=>{const q=Math.min(n,t.h);t.h-=n;pts[by]+=q;if(t.h<=0&&n>0&&!t.dead){t.dead=1;if(t.c===6)for(const o of u)if(o.h>0&&d(o,t)===1)hit(o,1,1-t.s*1===o.s?t.s:o.s^1)}};
 const atk=(m,t)=>{let n=C[m.c][3];if(m.c===0&&u.some(o=>o!==m&&o.h>0&&o.s===m.s&&o.c===0&&d(o,t)===1))n++;
  let r=[];while(n--)r.push(1+R(6));const val=x=>x<4?0:x<6?1:2;if(m.c===5){r.sort((a,b)=>a-b);if(r[0]<4)r[0]=1+R(6)}
  let k=r.reduce((s,x)=>s+val(x),0),D=1+(u.some(o=>o!==t&&o.h>0&&o.s===t.s&&o.c===4&&d(o,t)===1)?1:0);while(D--)if(R(6)>2)k--;hit(t,Math.max(0,k),m.s)};
 for(let t=0;t<8;t++){for(const m of u)m.done=0;let s=first;
  for(;;){let av=u.filter(m=>m.h>0&&!m.done&&m.s===s);if(!av.length){s^=1;av=u.filter(m=>m.h>0&&!m.done&&m.s===s);if(!av.length)break}
   let best=null;for(const m of av){const occ=(x,y)=>u.find(o=>o!==m&&o.h>0&&o.x===x&&o.y===y);
    let seen=new Map([[m.x+m.y*W,[m.x,m.y,0]]]),q=[[m.x,m.y,0]];while(q.length){const[x,y,p]=q.shift();if(p>=C[m.c][2])continue;for(let dx=-1;dx<2;dx++)for(let dy=-1;dy<2;dy++){const X=x+dx,Y=y+dy,k=X+Y*W;if(X<0||Y<0||X>=W||Y>=H||seen.has(k))continue;const oc=occ(X,Y);if(oc&&m.c!==1)continue;const e=[X,Y,p+1];seen.set(k,e);q.push(e)}}
    const foes=u.filter(o=>o.h>0&&o.s!==s);for(const[x,y]of seen.values()){if(occ(x,y))continue;const P={x,y};let near=99;for(const f of foes)near=Math.min(near,d(P,f));
     const danger=foes.filter(f=>d(P,f)<=1).length;
     let base=-near*.15-Math.random()*.05-(m.c===3?danger*.5:0);let o={m,x,y,sc:base};if(!best||o.sc>best.sc)best=o;
     for(const f of foes){const D=d(P,f);if(m.c===3?(D>1&&D<=3):D===1){let e=C[m.c][3]*.67+(m.c===0&&u.some(z=>z!==m&&z.h>0&&z.s===s&&z.c===0&&d(z,f)===1)?.67:0)-.4;
       o={m,x,y,f,sc:base+5+Math.min(e,f.h)/1+e/f.h*C[f.c][0]};if(o.sc>best.sc)best=o}
      else if(m.c===2&&D>1&&D<=3){const px=f.x+Math.sign(x-f.x),py=f.y+Math.sign(y-f.y);if(!occ(px,py)&&!(px===x&&py===y)){const g=u.filter(z=>z.h>0&&z.s===s&&!z.done&&z!==m&&d(z,{x:px,y:py})<=C[z.c][2]+1&&d(z,f)>C[z.c][2]+1).length;o={m,x,y,f,pull:[px,py],sc:base+4+g};if(o.sc>best.sc)best=o}}}}}
   const{m,x,y,f,pull}=best;m.x=x;m.y=y;m.done=1;if(pull){f.x=pull[0];f.y=pull[1]}else if(f)atk(m,f);
   const l0=u.some(o=>o.h>0&&!o.s),l1=u.some(o=>o.h>0&&o.s);if(!l0||!l1)return[l0&&!l1?0:l1&&!l0?1:-1,t+1,1];s^=1}}
 return[pts[0]>pts[1]?0:pts[1]>pts[0]?1:-1,8,0]}
for(const[n,C]of Object.entries(sets)){const L=armies(C),w=Array(7).fill(0),g=Array(7).fill(0),aw=L.map(()=>0),ag=L.map(()=>0);let f=0,T=0,ko=0,dr=0;const M=24000;
 // sortear por trio, depois exercito
 const tr={};L.forEach((v,i)=>{const k=v.map(x=>+!!x).join('');(tr[k]??=[]).push(i)});const K=Object.values(tr),pick=()=>{const t=K[R(K.length)];return t[R(t.length)]};
 for(let i=0;i<M;i++){const a=pick(),b=pick(),fi=i%2,[r,t,k]=game(C,L[a],L[b],fi);T+=t;ko+=k;if(r<0)dr++;if(r===fi)f++;[a,b].forEach((z,s)=>{const q=r<0?.5:+(r===s);ag[z]++;aw[z]+=q;L[z].forEach((x,c)=>{if(x){g[c]++;w[c]+=q}})})}
 const rk=L.map((v,i)=>[aw[i]/ag[i],ag[i],v]).filter(x=>x[1]>40).sort((a,b)=>b[0]-a[0]),s=x=>(x[0]*100|0)+'% '+x[2].map((q,i)=>q?q+N[i]:'').filter(Boolean).join('+');
 console.log(n,'trios',K.length,N.map((x,i)=>x+' '+(100*w[i]/g[i]).toFixed(1)).join(' | '),'1o',(100*f/M).toFixed(1),'voltas',(T/M).toFixed(1),'KO',(100*ko/M).toFixed(0),'emp',(100*dr/M).toFixed(1));
 console.log('  top',rk.slice(0,3).map(s).join('; '),' fundo',rk.slice(-3).map(s).join('; '))}
