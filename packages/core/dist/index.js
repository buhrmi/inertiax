"use strict";var de=Object.create;var I=Object.defineProperty;var pe=Object.getOwnPropertyDescriptor;var he=Object.getOwnPropertyNames;var ue=Object.getPrototypeOf,fe=Object.prototype.hasOwnProperty;var me=(t,e)=>{for(var i in e)I(t,i,{get:e[i],enumerable:!0})},J=(t,e,i,r)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of he(e))!fe.call(t,n)&&n!==i&&I(t,n,{get:()=>e[n],enumerable:!(r=pe(e,n))||r.enumerable});return t};var O=(t,e,i)=>(i=t!=null?de(ue(t)):{},J(e||!t||!t.__esModule?I(i,"default",{value:t,enumerable:!0}):i,t)),ge=t=>J(I({},"__esModule",{value:!0}),t);var Pe={};me(Pe,{createHeadManager:()=>H,hrefToUrl:()=>b,mergeDataIntoQueryString:()=>k,router:()=>xe,setupProgress:()=>j,shouldIntercept:()=>$,urlWithoutHash:()=>w});module.exports=ge(Pe);var G=O(require("axios"),1);function T(t,e){let i;return function(...r){clearTimeout(i),i=setTimeout(()=>t.apply(this,r),e)}}function E(t,e){return document.dispatchEvent(new CustomEvent(`inertia:${t}`,e))}var z=t=>E("before",{cancelable:!0,detail:{visit:t}}),B=t=>E("error",{detail:{errors:t}}),Q=t=>E("exception",{cancelable:!0,detail:{exception:t}}),C=t=>E("finish",{detail:{visit:t}}),Y=t=>E("invalid",{cancelable:!0,detail:{response:t}}),S=t=>E("navigate",{detail:{page:t}}),Z=t=>E("progress",{detail:{progress:t}}),ee=t=>E("start",{detail:{visit:t}}),te=t=>E("success",{detail:{page:t}});function F(t){return t instanceof File||t instanceof Blob||t instanceof FileList&&t.length>0||t instanceof FormData&&Array.from(t.values()).some(e=>F(e))||typeof t=="object"&&t!==null&&Object.values(t).some(e=>F(e))}function U(t,e=new FormData,i=null){t=t||{};for(let r in t)Object.prototype.hasOwnProperty.call(t,r)&&re(e,ie(i,r),t[r]);return e}function ie(t,e){return t?t+"["+e+"]":e}function re(t,e,i){if(Array.isArray(i))return Array.from(i.keys()).forEach(r=>re(t,ie(e,r.toString()),i[r]));if(i instanceof Date)return t.append(e,i.toISOString());if(i instanceof File)return t.append(e,i,i.name);if(i instanceof Blob)return t.append(e,i);if(typeof i=="boolean")return t.append(e,i?"1":"0");if(typeof i=="string")return t.append(e,i);if(typeof i=="number")return t.append(e,`${i}`);if(i==null)return t.append(e,"");U(i,t,e)}var ne={modal:null,listener:null,show(t){typeof t=="object"&&(t=`All Inertia requests must receive a valid Inertia response, however a plain JSON response was received.<hr>${JSON.stringify(t)}`);let e=document.createElement("html");e.innerHTML=t,e.querySelectorAll("a").forEach(r=>r.setAttribute("target","_top")),this.modal=document.createElement("div"),this.modal.style.position="fixed",this.modal.style.width="100vw",this.modal.style.height="100vh",this.modal.style.padding="50px",this.modal.style.boxSizing="border-box",this.modal.style.backgroundColor="rgba(0, 0, 0, .6)",this.modal.style.zIndex=2e5,this.modal.addEventListener("click",()=>this.hide());let i=document.createElement("iframe");if(i.style.backgroundColor="white",i.style.borderRadius="5px",i.style.width="100%",i.style.height="100%",this.modal.appendChild(i),document.body.prepend(this.modal),document.body.style.overflow="hidden",!i.contentWindow)throw new Error("iframe not yet ready.");i.contentWindow.document.open(),i.contentWindow.document.write(e.outerHTML),i.contentWindow.document.close(),this.listener=this.hideOnEscape.bind(this),document.addEventListener("keydown",this.listener)},hide(){this.modal.outerHTML="",this.modal=null,document.body.style.overflow="visible",document.removeEventListener("keydown",this.listener)},hideOnEscape(t){t.keyCode===27&&this.hide()}};var oe=O(require("deepmerge"),1),N=O(require("qs"),1);function b(t){return new URL(t.toString(),window.location.toString())}function k(t,e,i,r="brackets"){let n=/^https?:\/\//.test(e.toString()),l=n||e.toString().startsWith("/"),m=!l&&!e.toString().startsWith("#")&&!e.toString().startsWith("?"),d=e.toString().includes("?")||t==="get"&&Object.keys(i).length,p=e.toString().includes("#"),c=new URL(e.toString(),"http://localhost");return t==="get"&&Object.keys(i).length&&(c.search=N.stringify((0,oe.default)(N.parse(c.search,{ignoreQueryPrefix:!0}),i),{encodeValuesOnly:!0,arrayFormat:r}),i={}),[[n?`${c.protocol}//${c.host}`:"",l?c.pathname:"",m?c.pathname.substring(1):"",d?c.search:"",p?c.hash:""].join(""),i]}function w(t){return t=new URL(t.href),t.hash="",t}var se=typeof window>"u",A=class{constructor(){this.visitId=null}init({initialPage:e,resolveComponent:i,swapComponent:r}){this.page=e,this.resolveComponent=i,this.swapComponent=r,this.setNavigationType(),this.clearRememberedStateOnReload(),this.isBackForwardVisit()?this.handleBackForwardVisit(this.page):this.isLocationVisit()?this.handleLocationVisit(this.page):this.handleInitialPageVisit(this.page),this.setupEventListeners()}setNavigationType(){this.navigationType=window.performance&&window.performance.getEntriesByType("navigation").length>0?window.performance.getEntriesByType("navigation")[0].type:"navigate"}clearRememberedStateOnReload(){this.navigationType==="reload"&&window.history.state?.rememberedState&&delete window.history.state.rememberedState}handleInitialPageVisit(e){this.page.url+=window.location.hash,this.setPage(e,{preserveScroll:!0,preserveState:!0}).then(()=>S(e))}setupEventListeners(){window.addEventListener("popstate",this.handlePopstateEvent.bind(this)),document.addEventListener("scroll",T(this.handleScrollEvent.bind(this),100),!0),document.addEventListener("click",e=>{let i=e.target;if(i.closest("[data-inertia-ignore]"))return;let r=i.closest("a"),n=i.closest("[data-inertia-frame-id]")?.dataset.inertiaFrameId,l=i.closest("[data-hint]")?.dataset.hint,m=i.closest("[data-component]")?.dataset.component;if(!(!r||r.rel=="external"||r.target=="_blank")&&r.href&&r.href.startsWith(location.origin)){let d=r.attributes.getNamedItem("href")?.value,p=r.dataset["preserve-scroll"],c=r.dataset["preserve-state"];if(e.preventDefault(),e.stopPropagation(),d?.startsWith("#")){let s=this.page;s.url=r.href,this.setPage(s,{preserveScroll:p,preserveState:c}).then(()=>{S(s)})}else this.visit(r.href,{method:r.dataset.method,target:r.dataset.target||n,hint:l,component:m,preserveScroll:p,preserveState:c})}})}scrollRegions(){return document.querySelectorAll("[scroll-region]")}handleScrollEvent(e){typeof e.target.hasAttribute=="function"&&e.target.hasAttribute("scroll-region")&&this.saveScrollPositions()}saveScrollPositions(){this.replaceState({...history.state,scrollRegions:Array.from(this.scrollRegions()).map(e=>({top:e.scrollTop,left:e.scrollLeft}))})}resetScrollPositions(){window.scrollTo(0,0),this.scrollRegions().forEach(e=>{typeof e.scrollTo=="function"?e.scrollTo(0,0):(e.scrollTop=0,e.scrollLeft=0)}),this.saveScrollPositions(),window.location.hash&&setTimeout(()=>document.getElementById(window.location.hash.slice(1))?.scrollIntoView())}restoreScrollPositions(){this.page.scrollRegions&&this.scrollRegions().forEach((e,i)=>{let r=this.page.scrollRegions[i];if(r)typeof e.scrollTo=="function"?e.scrollTo(r.left,r.top):(e.scrollTop=r.top,e.scrollLeft=r.left);else return})}isBackForwardVisit(){return window.history.state&&this.navigationType==="back_forward"}handleBackForwardVisit(e){let i;e.props?i=e:(window.history.state.version=e.version,i=window.history.state),this.setPage(i,{preserveScroll:!0,preserveState:!0}).then(()=>{this.restoreScrollPositions(),S(e)})}locationVisit(e,i){try{let r={preserveScroll:i};window.sessionStorage.setItem("inertiaLocationVisit",JSON.stringify(r)),window.location.href=e.href,w(window.location).href===w(e).href&&window.location.reload()}catch{return!1}}isLocationVisit(){try{return window.sessionStorage.getItem("inertiaLocationVisit")!==null}catch{return!1}}handleLocationVisit(e){let i=JSON.parse(window.sessionStorage.getItem("inertiaLocationVisit")||"");window.sessionStorage.removeItem("inertiaLocationVisit"),e.url+=window.location.hash,e.rememberedState=window.history.state?.rememberedState??{},e.scrollRegions=window.history.state?.scrollRegions??[],this.setPage(e,{preserveScroll:i.preserveScroll,preserveState:!0}).then(()=>{i.preserveScroll&&this.restoreScrollPositions(),S(e)})}isLocationVisitResponse(e){return!!(e&&e.status===409&&e.headers["x-inertia-location"])}isInertiaResponse(e){return!!e?.headers["x-inertia"]}createVisitId(){return this.visitId={},this.visitId}cancelVisit(e,{cancelled:i=!1,interrupted:r=!1}){e&&!e.completed&&!e.cancelled&&!e.interrupted&&(e.cancelToken.abort(),e.onCancel(),e.completed=!1,e.cancelled=i,e.interrupted=r,C(e),e.onFinish(e))}finishVisit(e){!e.cancelled&&!e.interrupted&&(e.completed=!0,e.cancelled=!1,e.interrupted=!1,C(e),e.onFinish(e))}resolvePreserveOption(e,i){return typeof e=="function"?e(i):e==="errors"?Object.keys(i.props.errors||{}).length>0:e}cancel(){this.activeVisit&&this.cancelVisit(this.activeVisit,{cancelled:!0})}visit(e,{method:i="get",data:r={},replace:n=!1,preserveScroll:l=!1,preserveState:m=!1,preserveURL:d=!1,only:p=[],headers:c={},errorBag:s="",forceFormData:y=!1,target:h=null,component:u=null,hint:f=u,onCancelToken:R=()=>{},onBefore:x=()=>{},onStart:q=()=>{},onProgress:W=()=>{},onFinish:le=()=>{},onCancel:ce=()=>{},onSuccess:_=()=>{},onError:K=()=>{},transformProps:D=()=>{},queryStringArrayFormat:M="brackets"}={}){let P=typeof e=="string"?b(e):e;if((F(r)||y)&&!(r instanceof FormData)&&(r=U(r)),!(r instanceof FormData)){let[o,a]=k(i,P,r,M);P=b(o),r=a}let L={url:P,method:i,data:r,replace:n,preserveScroll:l,preserveState:m,preserveURL:d,only:p,headers:c,errorBag:s,target:h,hint:f,component:u,forceFormData:y,transformProps:D,queryStringArrayFormat:M,noProgress:!1,cancelled:!1,completed:!1,interrupted:!1};if(x(L)===!1||!z(L))return;this.activeVisit&&this.cancelVisit(this.activeVisit,{interrupted:!0}),this.saveScrollPositions(),L.target&&(L.noProgress=!0);let X=this.createVisitId();if(this.activeVisit={...L,onCancelToken:R,onBefore:x,onStart:q,onProgress:W,onFinish:le,onCancel:ce,onSuccess:_,onError:K,queryStringArrayFormat:M,cancelToken:new AbortController},R({cancel:()=>{this.activeVisit&&this.cancelVisit(this.activeVisit,{cancelled:!0})}}),f&&(console.log("hint",f),Promise.resolve(this.resolveComponent(f)).then(o=>{h&&h!=="_top"&&h!=="_parent"&&h!=="main"?this.swapComponent({component:o,page:{...this.page,target:h},preserveState:!1}):this.swapComponent({component:o,page:this.page,preserveState:!1})})),ee(L),u){this.page.component=u,this.page.url=w(P).href,(!h||h==="_top"||h==="_parent"||h==="main")&&(n=n||b(this.page.url).href===window.location.href,n?this.replaceState(this.page):this.pushState(this.page)),l||this.resetScrollPositions(),n||S(this.page),C(this.activeVisit);return}q(L),(0,G.default)({method:i,url:w(P).href,data:i==="get"?{}:r,params:i==="get"?r:{},signal:this.activeVisit.cancelToken.signal,headers:{...c,Accept:"text/html, application/xhtml+xml","X-Requested-With":"XMLHttpRequest","X-Inertia":!0,...p.length?{"X-Inertia-Partial-Component":this.page.component,"X-Inertia-Partial-Data":p.join(",")}:{},...s&&s.length?{"X-Inertia-Error-Bag":s}:{},...this.page.version?{"X-Inertia-Version":this.page.version}:{}},onUploadProgress:o=>{r instanceof FormData&&(o.percentage=o.progress?Math.round(o.progress*100):0,Z(o),W(o))}}).then(o=>{if(!this.isInertiaResponse(o))return Promise.reject({response:o});let a=o.data;o.headers["x-inertia-frame"]&&(h=o.headers["x-inertia-frame"]),p.length&&a.component===this.page.component&&(a.props={...this.page.props,...a.props}),l=this.resolvePreserveOption(l,a),m=this.resolvePreserveOption(m,a),m&&window.history.state?.rememberedState&&a.component===this.page.component&&(a.rememberedState=window.history.state.rememberedState);let v=P,V=b(a.url);return v.hash&&!V.hash&&w(v).href===V.href&&(V.hash=v.hash,a.url=V.href),D&&D(a.props),this.setPage(a,{target:h,visitId:X,replace:n,preserveScroll:l,preserveState:m,preserveURL:d})}).then(o=>{let a=o.props.errors||{};if(Object.keys(a).length>0){let v=s?a[s]?a[s]:{}:a;return B(v),K(v)}return te(o),_(o)}).catch(o=>{if(this.isInertiaResponse(o.response))return this.setPage(o.response.data,{visitId:X});if(this.isLocationVisitResponse(o.response)){let a=b(o.response.headers["x-inertia-location"]),v=P;v.hash&&!a.hash&&w(v).href===a.href&&(a.hash=v.hash),this.locationVisit(a,l===!0)}else if(o.response)Y(o.response)&&ne.show(o.response.data);else return Promise.reject(o)}).then(()=>{this.activeVisit&&this.finishVisit(this.activeVisit)}).catch(o=>{if(!G.default.isCancel(o)){let a=Q(o);if(this.activeVisit&&this.finishVisit(this.activeVisit),a)return Promise.reject(o)}})}setPage(e,{visitId:i=this.createVisitId(),replace:r=!1,preserveURL:n=!1,preserveScroll:l=!1,preserveState:m=!1,target:d=null}={}){return Promise.resolve(this.resolveComponent(e.component)).then(p=>(i===this.visitId&&(e.scrollRegions=e.scrollRegions||[],e.rememberedState=e.rememberedState||{},n&&(e.url=window.location.href),!d||d==="_top"||d==="_parent"||d==="main"?(r=r||b(e.url).href===window.location.href,r?this.replaceState(e):this.pushState(e)):e.target=d,this.swapComponent({component:p,page:e,preserveState:m}).then(()=>{l||this.resetScrollPositions(),r||S(e)})),e))}pushState(e){this.page=e,window.history.pushState(e,"",e.url)}replaceState(e){this.page=e,window.history.replaceState(e,"",e.url)}handlePopstateEvent(e){if(e.state!==null&&e.state.component){let i=e.state,r=this.createVisitId();Promise.resolve(this.resolveComponent(i.component)).then(n=>{r===this.visitId&&(this.page=i,this.swapComponent({component:n,page:i,preserveState:!1}).then(()=>{this.restoreScrollPositions(),S(i)}))})}else{if(!this.page.url)return;let i=b(this.page.url);i.hash=window.location.hash,this.replaceState({...history.state,url:i.href}),this.resetScrollPositions()}}get(e,i={},r={}){return this.visit(e,{...r,method:"get",data:i})}reload(e={}){return this.visit(window.location.href,{preserveScroll:!0,preserveState:!0,preserveURL:!0,...e})}replace(e,i={}){return console.warn(`Inertia.replace() has been deprecated and will be removed in a future release. Please use Inertia.${i.method??"get"}() instead.`),this.visit(e,{preserveState:!0,...i,replace:!0})}post(e,i={},r={}){return this.visit(e,{preserveState:!0,...r,method:"post",data:i})}put(e,i={},r={}){return this.visit(e,{preserveState:!0,...r,method:"put",data:i})}patch(e,i={},r={}){return this.visit(e,{preserveState:!0,...r,method:"patch",data:i})}delete(e,i={}){return this.visit(e,{preserveState:!0,...i,method:"delete"})}remember(e,i="default"){se||this.replaceState({...history.state,rememberedState:{...this.page?.rememberedState,[i]:e}})}restore(e="default"){if(!se)return window.history.state?.rememberedState?.[e]}on(e,i){let r=n=>{let l=i(n);n.cancelable&&!n.defaultPrevented&&l===!1&&n.preventDefault()};return document.addEventListener(`inertia:${e}`,r),()=>document.removeEventListener(`inertia:${e}`,r)}};var ve={buildDOMElement(t){let e=document.createElement("template");e.innerHTML=t;let i=e.content.firstChild;if(!t.startsWith("<script "))return i;let r=document.createElement("script");return r.innerHTML=i.innerHTML,i.getAttributeNames().forEach(n=>{r.setAttribute(n,i.getAttribute(n)||"")}),r},isInertiaManagedElement(t){return t.nodeType===Node.ELEMENT_NODE&&t.getAttribute("inertia")!==null},findMatchingElementIndex(t,e){let i=t.getAttribute("inertia");return i!==null?e.findIndex(r=>r.getAttribute("inertia")===i):-1},update:T(function(t){let e=t.map(r=>this.buildDOMElement(r));Array.from(document.head.childNodes).filter(r=>this.isInertiaManagedElement(r)).forEach(r=>{let n=this.findMatchingElementIndex(r,e);if(n===-1){r?.parentNode?.removeChild(r);return}let l=e.splice(n,1)[0];l&&!r.isEqualNode(l)&&r?.parentNode?.replaceChild(l,r)}),e.forEach(r=>document.head.appendChild(r))},1)};function H(t,e,i){let r={},n=0;function l(){let s=n+=1;return r[s]=[],s.toString()}function m(s){s===null||Object.keys(r).indexOf(s)===-1||(delete r[s],c())}function d(s,y=[]){s!==null&&Object.keys(r).indexOf(s)>-1&&(r[s]=y),c()}function p(){let s=e(""),y={...s?{title:`<title inertia="">${s}</title>`}:{}},h=Object.values(r).reduce((u,f)=>u.concat(f),[]).reduce((u,f)=>{if(f.indexOf("<")===-1)return u;if(f.indexOf("<title ")===0){let x=f.match(/(<title [^>]+>)(.*?)(<\/title>)/);return u.title=x?`${x[1]}${e(x[2])}${x[3]}`:f,u}let R=f.match(/ inertia="[^"]+"/);return R?u[R[0]]=f:u[Object.keys(u).length]=f,u},y);return Object.values(h)}function c(){t?i(p()):ve.update(p())}return c(),{forceUpdate:c,createProvider:function(){let s=l();return{update:y=>d(s,y),disconnect:()=>m(s)}}}}var g=O(require("nprogress"),1),ae=null;function be(t){document.addEventListener("inertia:start",Ee(t)),document.addEventListener("inertia:progress",we),document.addEventListener("inertia:finish",ye)}function Ee(t){return function(e){e.detail.visit.noProgress||(ae=setTimeout(()=>g.default.start(),t))}}function we(t){g.default.isStarted()&&t.detail.progress?.percentage&&g.default.set(Math.max(g.default.status,t.detail.progress.percentage/100*.9))}function ye(t){if(clearTimeout(ae),g.default.isStarted())t.detail.visit.completed?g.default.done():t.detail.visit.interrupted?g.default.set(0):t.detail.visit.cancelled&&(g.default.done(),g.default.remove());else return}function Se(t){let e=document.createElement("style");e.type="text/css",e.textContent=`
    #nprogress {
      pointer-events: none;
    }

    #nprogress .bar {
      background: ${t};

      position: fixed;
      z-index: 1031;
      top: 0;
      left: 0;

      width: 100%;
      height: 2px;
    }

    #nprogress .peg {
      display: block;
      position: absolute;
      right: 0px;
      width: 100px;
      height: 100%;
      box-shadow: 0 0 10px ${t}, 0 0 5px ${t};
      opacity: 1.0;

      -webkit-transform: rotate(3deg) translate(0px, -4px);
          -ms-transform: rotate(3deg) translate(0px, -4px);
              transform: rotate(3deg) translate(0px, -4px);
    }

    #nprogress .spinner {
      display: block;
      position: fixed;
      z-index: 1031;
      top: 15px;
      right: 15px;
    }

    #nprogress .spinner-icon {
      width: 18px;
      height: 18px;
      box-sizing: border-box;

      border: solid 2px transparent;
      border-top-color: ${t};
      border-left-color: ${t};
      border-radius: 50%;

      -webkit-animation: nprogress-spinner 400ms linear infinite;
              animation: nprogress-spinner 400ms linear infinite;
    }

    .nprogress-custom-parent {
      overflow: hidden;
      position: relative;
    }

    .nprogress-custom-parent #nprogress .spinner,
    .nprogress-custom-parent #nprogress .bar {
      position: absolute;
    }

    @-webkit-keyframes nprogress-spinner {
      0%   { -webkit-transform: rotate(0deg); }
      100% { -webkit-transform: rotate(360deg); }
    }
    @keyframes nprogress-spinner {
      0%   { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `,document.head.appendChild(e)}function j({delay:t=250,color:e="#29d",includeCSS:i=!0,showSpinner:r=!1}={}){be(t),g.default.configure({showSpinner:r}),i&&Se(e)}function $(t){let e=t.currentTarget.tagName.toLowerCase()==="a";return!(t.target&&(t?.target).isContentEditable||t.defaultPrevented||e&&t.which>1||e&&t.altKey||e&&t.ctrlKey||e&&t.metaKey||e&&t.shiftKey)}var xe=new A;
//# sourceMappingURL=index.js.map
