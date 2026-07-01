import{k as N,l as O,r as z,ar as B,n as M,m as u,o as I,N as g,s as q,t as f,au as b,aR as P,aS as k,av as s}from"./index-DGcjDeBw.js";function A(a){return N("MuiLinearProgress",a)}O("MuiLinearProgress",["root","colorPrimary","colorSecondary","determinate","indeterminate","buffer","query","dashed","bar","bar1","bar2"]);const y=4,v=k`
  0% {
    left: -35%;
    right: 100%;
  }

  60% {
    left: 100%;
    right: -90%;
  }

  100% {
    left: 100%;
    right: -90%;
  }
`,T=typeof v!="string"?P`
        animation: ${v} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
      `:null,C=k`
  0% {
    left: -200%;
    right: 100%;
  }

  60% {
    left: 107%;
    right: -8%;
  }

  100% {
    left: 107%;
    right: -8%;
  }
`,U=typeof C!="string"?P`
        animation: ${C} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;
      `:null,h=k`
  0% {
    opacity: 1;
    background-position: 0 -23px;
  }

  60% {
    opacity: 0;
    background-position: 0 -23px;
  }

  100% {
    opacity: 1;
    background-position: -200px -23px;
  }
`,D=typeof h!="string"?P`
        animation: ${h} 3s infinite linear;
      `:null,w=a=>{const{classes:r,variant:t,color:o}=a,d={root:["root",`color${g(o)}`,t],dashed:["dashed"],bar1:["bar","bar1"],bar2:["bar","bar2",t==="buffer"&&`color${g(o)}`]};return q(d,A,r)},x=(a,r)=>a.vars?a.vars.palette.LinearProgress[`${r}Bg`]:a.palette.mode==="light"?a.lighten(a.palette[r].main,.62):a.darken(a.palette[r].main,.5),K=f("span",{name:"MuiLinearProgress",slot:"Root",overridesResolver:(a,r)=>{const{ownerState:t}=a;return[r.root,r[`color${g(t.color)}`],r[t.variant]]}})(b(({theme:a})=>({position:"relative",overflow:"hidden",display:"block",height:4,zIndex:0,"@media print":{colorAdjust:"exact"},variants:[...Object.entries(a.palette).filter(s()).map(([r])=>({props:{color:r},style:{backgroundColor:x(a,r)}})),{props:({ownerState:r})=>r.color==="inherit"&&r.variant!=="buffer",style:{"&::before":{content:'""',position:"absolute",left:0,top:0,right:0,bottom:0,backgroundColor:"currentColor",opacity:.3}}},{props:{variant:"buffer"},style:{backgroundColor:"transparent"}},{props:{variant:"query"},style:{transform:"rotate(180deg)"}}]}))),E=f("span",{name:"MuiLinearProgress",slot:"Dashed"})(b(({theme:a})=>({position:"absolute",marginTop:0,height:"100%",width:"100%",backgroundSize:"10px 10px",backgroundPosition:"0 -23px",variants:[{props:{color:"inherit"},style:{opacity:.3,backgroundImage:"radial-gradient(currentColor 0%, currentColor 16%, transparent 42%)"}},...Object.entries(a.palette).filter(s()).map(([r])=>{const t=x(a,r);return{props:{color:r},style:{backgroundImage:`radial-gradient(${t} 0%, ${t} 16%, transparent 42%)`}}})]})),D||{animation:`${h} 3s infinite linear`}),S=f("span",{name:"MuiLinearProgress",slot:"Bar1",overridesResolver:(a,r)=>[r.bar,r.bar1]})(b(({theme:a})=>({width:"100%",position:"absolute",left:0,bottom:0,top:0,transition:"transform 0.2s linear",transformOrigin:"left",variants:[{props:{color:"inherit"},style:{backgroundColor:"currentColor"}},...Object.entries(a.palette).filter(s()).map(([r])=>({props:{color:r},style:{backgroundColor:(a.vars||a).palette[r].main}})),{props:{variant:"determinate"},style:{transition:`transform .${y}s linear`}},{props:{variant:"buffer"},style:{zIndex:1,transition:`transform .${y}s linear`}},{props:({ownerState:r})=>r.variant==="indeterminate"||r.variant==="query",style:{width:"auto"}},{props:({ownerState:r})=>r.variant==="indeterminate"||r.variant==="query",style:T||{animation:`${v} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite`}}]}))),X=f("span",{name:"MuiLinearProgress",slot:"Bar2",overridesResolver:(a,r)=>[r.bar,r.bar2]})(b(({theme:a})=>({width:"100%",position:"absolute",left:0,bottom:0,top:0,transition:"transform 0.2s linear",transformOrigin:"left",variants:[...Object.entries(a.palette).filter(s()).map(([r])=>({props:{color:r},style:{"--LinearProgressBar2-barColor":(a.vars||a).palette[r].main}})),{props:({ownerState:r})=>r.variant!=="buffer"&&r.color!=="inherit",style:{backgroundColor:"var(--LinearProgressBar2-barColor, currentColor)"}},{props:({ownerState:r})=>r.variant!=="buffer"&&r.color==="inherit",style:{backgroundColor:"currentColor"}},{props:{color:"inherit"},style:{opacity:.3}},...Object.entries(a.palette).filter(s()).map(([r])=>({props:{color:r,variant:"buffer"},style:{backgroundColor:x(a,r),transition:`transform .${y}s linear`}})),{props:({ownerState:r})=>r.variant==="indeterminate"||r.variant==="query",style:{width:"auto"}},{props:({ownerState:r})=>r.variant==="indeterminate"||r.variant==="query",style:U||{animation:`${C} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite`}}]}))),V=z.forwardRef(function(r,t){const o=B({props:r,name:"MuiLinearProgress"}),{className:d,color:R="primary",value:m,valueBuffer:L,variant:i="indeterminate",...j}=o,n={...o,color:R,variant:i},l=w(n),$=M(),p={},c={bar1:{},bar2:{}};if((i==="determinate"||i==="buffer")&&m!==void 0){p["aria-valuenow"]=Math.round(m),p["aria-valuemin"]=0,p["aria-valuemax"]=100;let e=m-100;$&&(e=-e),c.bar1.transform=`translateX(${e}%)`}if(i==="buffer"&&L!==void 0){let e=(L||0)-100;$&&(e=-e),c.bar2.transform=`translateX(${e}%)`}return u.jsxs(K,{className:I(l.root,d),ownerState:n,role:"progressbar",...p,ref:t,...j,children:[i==="buffer"?u.jsx(E,{className:l.dashed,ownerState:n}):null,u.jsx(S,{className:l.bar1,ownerState:n,style:c.bar1}),i==="determinate"?null:u.jsx(X,{className:l.bar2,ownerState:n,style:c.bar2})]})});export{V as L};
