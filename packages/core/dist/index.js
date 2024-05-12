"use strict";var le=Object.create;var I=Object.defineProperty;var ce=Object.getOwnPropertyDescriptor;var de=Object.getOwnPropertyNames;var pe=Object.getPrototypeOf,he=Object.prototype.hasOwnProperty;var ue=(t,e)=>{for(var i in e)I(t,i,{get:e[i],enumerable:!0})},K=(t,e,i,r)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of de(e))!he.call(t,n)&&n!==i&&I(t,n,{get:()=>e[n],enumerable:!(r=ce(e,n))||r.enumerable});return t};var O=(t,e,i)=>(i=t!=null?le(pe(t)):{},K(e||!t||!t.__esModule?I(i,"default",{value:t,enumerable:!0}):i,t)),fe=t=>K(I({},"__esModule",{value:!0}),t);var ye={};ue(ye,{createHeadManager:()=>j,hrefToUrl:()=>b,mergeDataIntoQueryString:()=>N,router:()=>xe,setupProgress:()=>H,shouldIntercept:()=>$,urlWithoutHash:()=>w});module.exports=fe(ye);var G=O(require("axios"),1);function T(t,e){let i;return function(...r){clearTimeout(i),i=setTimeout(()=>t.apply(this,r),e)}}function v(t,e){return document.dispatchEvent(new CustomEvent(`inertia:${t}`,e))}var X=t=>v("before",{cancelable:!0,detail:{visit:t}}),J=t=>v("error",{detail:{errors:t}}),z=t=>v("exception",{cancelable:!0,detail:{exception:t}}),U=t=>v("finish",{detail:{visit:t}}),B=t=>v("invalid",{cancelable:!0,detail:{response:t}}),S=t=>v("navigate",{detail:{page:t}}),Q=t=>v("progress",{detail:{progress:t}}),Y=t=>v("start",{detail:{visit:t}}),Z=t=>v("success",{detail:{page:t}});function C(t){return t instanceof File||t instanceof Blob||t instanceof FileList&&t.length>0||t instanceof FormData&&Array.from(t.values()).some(e=>C(e))||typeof t=="object"&&t!==null&&Object.values(t).some(e=>C(e))}function M(t,e=new FormData,i=null){t=t||{};for(let r in t)Object.prototype.hasOwnProperty.call(t,r)&&te(e,ee(i,r),t[r]);return e}function ee(t,e){return t?t+"["+e+"]":e}function te(t,e,i){if(Array.isArray(i))return Array.from(i.keys()).forEach(r=>te(t,ee(e,r.toString()),i[r]));if(i instanceof Date)return t.append(e,i.toISOString());if(i instanceof File)return t.append(e,i,i.name);if(i instanceof Blob)return t.append(e,i);if(typeof i=="boolean")return t.append(e,i?"1":"0");if(typeof i=="string")return t.append(e,i);if(typeof i=="number")return t.append(e,`${i}`);if(i==null)return t.append(e,"");M(i,t,e)}var ie={modal:null,listener:null,show(t){typeof t=="object"&&(t=`All Inertia requests must receive a valid Inertia response, however a plain JSON response was received.<hr>${JSON.stringify(t)}`);let e=document.createElement("html");e.innerHTML=t,e.querySelectorAll("a").forEach(r=>r.setAttribute("target","_top")),this.modal=document.createElement("div"),this.modal.style.position="fixed",this.modal.style.width="100vw",this.modal.style.height="100vh",this.modal.style.padding="50px",this.modal.style.boxSizing="border-box",this.modal.style.backgroundColor="rgba(0, 0, 0, .6)",this.modal.style.zIndex=2e5,this.modal.addEventListener("click",()=>this.hide());let i=document.createElement("iframe");if(i.style.backgroundColor="white",i.style.borderRadius="5px",i.style.width="100%",i.style.height="100%",this.modal.appendChild(i),document.body.prepend(this.modal),document.body.style.overflow="hidden",!i.contentWindow)throw new Error("iframe not yet ready.");i.contentWindow.document.open(),i.contentWindow.document.write(e.outerHTML),i.contentWindow.document.close(),this.listener=this.hideOnEscape.bind(this),document.addEventListener("keydown",this.listener)},hide(){this.modal.outerHTML="",this.modal=null,document.body.style.overflow="visible",document.removeEventListener("keydown",this.listener)},hideOnEscape(t){t.keyCode===27&&this.hide()}};var re=O(require("deepmerge"),1),F=O(require("qs"),1);function b(t){return new URL(t.toString(),window.location.toString())}function N(t,e,i,r="brackets"){let n=/^https?:\/\//.test(e.toString()),l=n||e.toString().startsWith("/"),u=!l&&!e.toString().startsWith("#")&&!e.toString().startsWith("?"),d=e.toString().includes("?")||t==="get"&&Object.keys(i).length,f=e.toString().includes("#"),c=new URL(e.toString(),"http://localhost");return t==="get"&&Object.keys(i).length&&(c.search=F.stringify((0,re.default)(F.parse(c.search,{ignoreQueryPrefix:!0}),i),{encodeValuesOnly:!0,arrayFormat:r}),i={}),[[n?`${c.protocol}//${c.host}`:"",l?c.pathname:"",u?c.pathname.substring(1):"",d?c.search:"",f?c.hash:""].join(""),i]}function w(t){return t=new URL(t.href),t.hash="",t}var ne=typeof window>"u",k=class{constructor(){this.visitId=null}init({initialPage:e,resolveComponent:i,swapComponent:r}){this.page=e,this.resolveComponent=i,this.swapComponent=r,this.setNavigationType(),this.clearRememberedStateOnReload(),this.isBackForwardVisit()?this.handleBackForwardVisit(this.page):this.isLocationVisit()?this.handleLocationVisit(this.page):this.handleInitialPageVisit(this.page),this.setupEventListeners()}setNavigationType(){this.navigationType=window.performance&&window.performance.getEntriesByType("navigation").length>0?window.performance.getEntriesByType("navigation")[0].type:"navigate"}clearRememberedStateOnReload(){this.navigationType==="reload"&&window.history.state?.rememberedState&&delete window.history.state.rememberedState}handleInitialPageVisit(e){this.page.url+=window.location.hash,this.setPage(e,{preserveScroll:!0,preserveState:!0}).then(()=>S(e))}setupEventListeners(){window.addEventListener("popstate",this.handlePopstateEvent.bind(this)),document.addEventListener("scroll",T(this.handleScrollEvent.bind(this),100),!0),document.addEventListener("click",e=>{let i=e.target,r=i.closest("a"),n=i.closest("[data-inertia-frame-id]")?.dataset.inertiaFrameId;!r||r.rel=="external"||r.target=="_blank"||r.href&&r.href.startsWith(location.origin)&&(e.preventDefault(),e.stopPropagation(),this.visit(r.href,{method:r.dataset.method,target:r.dataset.target||n}))})}scrollRegions(){return document.querySelectorAll("[scroll-region]")}handleScrollEvent(e){typeof e.target.hasAttribute=="function"&&e.target.hasAttribute("scroll-region")&&this.saveScrollPositions()}saveScrollPositions(){this.replaceState({...this.page,scrollRegions:Array.from(this.scrollRegions()).map(e=>({top:e.scrollTop,left:e.scrollLeft}))})}resetScrollPositions(){window.scrollTo(0,0),this.scrollRegions().forEach(e=>{typeof e.scrollTo=="function"?e.scrollTo(0,0):(e.scrollTop=0,e.scrollLeft=0)}),this.saveScrollPositions(),window.location.hash&&setTimeout(()=>document.getElementById(window.location.hash.slice(1))?.scrollIntoView())}restoreScrollPositions(){this.page.scrollRegions&&this.scrollRegions().forEach((e,i)=>{let r=this.page.scrollRegions[i];if(r)typeof e.scrollTo=="function"?e.scrollTo(r.left,r.top):(e.scrollTop=r.top,e.scrollLeft=r.left);else return})}isBackForwardVisit(){return window.history.state&&this.navigationType==="back_forward"}handleBackForwardVisit(e){let i;e.props?i=e:(window.history.state.version=e.version,i=window.history.state),this.setPage(i,{preserveScroll:!0,preserveState:!0}).then(()=>{this.restoreScrollPositions(),S(e)})}locationVisit(e,i){try{let r={preserveScroll:i};window.sessionStorage.setItem("inertiaLocationVisit",JSON.stringify(r)),window.location.href=e.href,w(window.location).href===w(e).href&&window.location.reload()}catch{return!1}}isLocationVisit(){try{return window.sessionStorage.getItem("inertiaLocationVisit")!==null}catch{return!1}}handleLocationVisit(e){let i=JSON.parse(window.sessionStorage.getItem("inertiaLocationVisit")||"");window.sessionStorage.removeItem("inertiaLocationVisit"),e.url+=window.location.hash,e.rememberedState=window.history.state?.rememberedState??{},e.scrollRegions=window.history.state?.scrollRegions??[],this.setPage(e,{preserveScroll:i.preserveScroll,preserveState:!0}).then(()=>{i.preserveScroll&&this.restoreScrollPositions(),S(e)})}isLocationVisitResponse(e){return!!(e&&e.status===409&&e.headers["x-inertia-location"])}isInertiaResponse(e){return!!e?.headers["x-inertia"]}createVisitId(){return this.visitId={},this.visitId}cancelVisit(e,{cancelled:i=!1,interrupted:r=!1}){e&&!e.completed&&!e.cancelled&&!e.interrupted&&(e.cancelToken.abort(),e.onCancel(),e.completed=!1,e.cancelled=i,e.interrupted=r,U(e),e.onFinish(e))}finishVisit(e){!e.cancelled&&!e.interrupted&&(e.completed=!0,e.cancelled=!1,e.interrupted=!1,U(e),e.onFinish(e))}resolvePreserveOption(e,i){return typeof e=="function"?e(i):e==="errors"?Object.keys(i.props.errors||{}).length>0:e}cancel(){this.activeVisit&&this.cancelVisit(this.activeVisit,{cancelled:!0})}visit(e,{method:i="get",data:r={},replace:n=!1,preserveScroll:l=!1,preserveState:u=!1,preserveURL:d=!1,only:f=[],headers:c={},errorBag:a="",forceFormData:E=!1,target:P=null,onCancelToken:p=()=>{},onBefore:h=()=>{},onStart:R=()=>{},onProgress:x=()=>{},onFinish:se=()=>{},onCancel:ae=()=>{},onSuccess:q=()=>{},onError:W=()=>{},transformProps:A=()=>{},queryStringArrayFormat:D="brackets"}={}){let y=typeof e=="string"?b(e):e;if((C(r)||E)&&!(r instanceof FormData)&&(r=M(r)),!(r instanceof FormData)){let[o,s]=N(i,y,r,D);y=b(o),r=s}let L={url:y,method:i,data:r,replace:n,preserveScroll:l,preserveState:u,preserveURL:d,only:f,headers:c,errorBag:a,target:P,forceFormData:E,transformProps:A,queryStringArrayFormat:D,cancelled:!1,completed:!1,interrupted:!1};if(h(L)===!1||!X(L))return;this.activeVisit&&this.cancelVisit(this.activeVisit,{interrupted:!0}),this.saveScrollPositions();let _=this.createVisitId();this.activeVisit={...L,onCancelToken:p,onBefore:h,onStart:R,onProgress:x,onFinish:se,onCancel:ae,onSuccess:q,onError:W,queryStringArrayFormat:D,cancelToken:new AbortController},p({cancel:()=>{this.activeVisit&&this.cancelVisit(this.activeVisit,{cancelled:!0})}}),Y(L),R(L),(0,G.default)({method:i,url:w(y).href,data:i==="get"?{}:r,params:i==="get"?r:{},signal:this.activeVisit.cancelToken.signal,headers:{...c,Accept:"text/html, application/xhtml+xml","X-Requested-With":"XMLHttpRequest","X-Inertia":!0,...f.length?{"X-Inertia-Partial-Component":this.page.component,"X-Inertia-Partial-Data":f.join(",")}:{},...a&&a.length?{"X-Inertia-Error-Bag":a}:{},...this.page.version?{"X-Inertia-Version":this.page.version}:{}},onUploadProgress:o=>{r instanceof FormData&&(o.percentage=o.progress?Math.round(o.progress*100):0,Q(o),x(o))}}).then(o=>{if(!this.isInertiaResponse(o))return Promise.reject({response:o});let s=o.data;o.headers["x-inertia-frame"]&&(P=o.headers["x-inertia-frame"]),f.length&&s.component===this.page.component&&(s.props={...this.page.props,...s.props}),l=this.resolvePreserveOption(l,s),u=this.resolvePreserveOption(u,s),u&&window.history.state?.rememberedState&&s.component===this.page.component&&(s.rememberedState=window.history.state.rememberedState);let g=y,V=b(s.url);return g.hash&&!V.hash&&w(g).href===V.href&&(V.hash=g.hash,s.url=V.href),A&&A(s.props),this.setPage(s,{target:P,visitId:_,replace:n,preserveScroll:l,preserveState:u,preserveURL:d})}).then(o=>{let s=o.props.errors||{};if(Object.keys(s).length>0){let g=a?s[a]?s[a]:{}:s;return J(g),W(g)}return Z(o),q(o)}).catch(o=>{if(this.isInertiaResponse(o.response))return this.setPage(o.response.data,{visitId:_});if(this.isLocationVisitResponse(o.response)){let s=b(o.response.headers["x-inertia-location"]),g=y;g.hash&&!s.hash&&w(g).href===s.href&&(s.hash=g.hash),this.locationVisit(s,l===!0)}else if(o.response)B(o.response)&&ie.show(o.response.data);else return Promise.reject(o)}).then(()=>{this.activeVisit&&this.finishVisit(this.activeVisit)}).catch(o=>{if(!G.default.isCancel(o)){let s=z(o);if(this.activeVisit&&this.finishVisit(this.activeVisit),s)return Promise.reject(o)}})}setPage(e,{visitId:i=this.createVisitId(),replace:r=!1,preserveURL:n=!1,preserveScroll:l=!1,preserveState:u=!1,target:d=null}={}){return Promise.resolve(this.resolveComponent(e.component)).then(f=>(i===this.visitId&&(e.scrollRegions=e.scrollRegions||[],e.rememberedState=e.rememberedState||{},n&&(e.url=window.location.href),!d||d==="_top"||d==="_parent"||d==="main"?(r=r||b(e.url).href===window.location.href,r?this.replaceState(e):this.pushState(e)):e.target=d,this.swapComponent({component:f,page:e,preserveState:u}).then(()=>{l||this.resetScrollPositions(),r||S(e)})),e))}pushState(e){this.page=e,window.history.pushState(e,"",e.url)}replaceState(e){this.page=e,window.history.replaceState(e,"",e.url)}handlePopstateEvent(e){if(e.state!==null){let i=e.state,r=this.createVisitId();Promise.resolve(this.resolveComponent(i.component)).then(n=>{r===this.visitId&&(this.page=i,this.swapComponent({component:n,page:i,preserveState:!1}).then(()=>{this.restoreScrollPositions(),S(i)}))})}else{let i=b(this.page.url);i.hash=window.location.hash,this.replaceState({...this.page,url:i.href}),this.resetScrollPositions()}}get(e,i={},r={}){return this.visit(e,{...r,method:"get",data:i})}reload(e={}){return this.visit(window.location.href,{...e,preserveScroll:!0,preserveState:!0,preserveURL:!0})}replace(e,i={}){return console.warn(`Inertia.replace() has been deprecated and will be removed in a future release. Please use Inertia.${i.method??"get"}() instead.`),this.visit(e,{preserveState:!0,...i,replace:!0})}post(e,i={},r={}){return this.visit(e,{preserveState:!0,...r,method:"post",data:i})}put(e,i={},r={}){return this.visit(e,{preserveState:!0,...r,method:"put",data:i})}patch(e,i={},r={}){return this.visit(e,{preserveState:!0,...r,method:"patch",data:i})}delete(e,i={}){return this.visit(e,{preserveState:!0,...i,method:"delete"})}remember(e,i="default"){ne||this.replaceState({...this.page,rememberedState:{...this.page?.rememberedState,[i]:e}})}restore(e="default"){if(!ne)return window.history.state?.rememberedState?.[e]}on(e,i){let r=n=>{let l=i(n);n.cancelable&&!n.defaultPrevented&&l===!1&&n.preventDefault()};return document.addEventListener(`inertia:${e}`,r),()=>document.removeEventListener(`inertia:${e}`,r)}};var me={buildDOMElement(t){let e=document.createElement("template");e.innerHTML=t;let i=e.content.firstChild;if(!t.startsWith("<script "))return i;let r=document.createElement("script");return r.innerHTML=i.innerHTML,i.getAttributeNames().forEach(n=>{r.setAttribute(n,i.getAttribute(n)||"")}),r},isInertiaManagedElement(t){return t.nodeType===Node.ELEMENT_NODE&&t.getAttribute("inertia")!==null},findMatchingElementIndex(t,e){let i=t.getAttribute("inertia");return i!==null?e.findIndex(r=>r.getAttribute("inertia")===i):-1},update:T(function(t){let e=t.map(r=>this.buildDOMElement(r));Array.from(document.head.childNodes).filter(r=>this.isInertiaManagedElement(r)).forEach(r=>{let n=this.findMatchingElementIndex(r,e);if(n===-1){r?.parentNode?.removeChild(r);return}let l=e.splice(n,1)[0];l&&!r.isEqualNode(l)&&r?.parentNode?.replaceChild(l,r)}),e.forEach(r=>document.head.appendChild(r))},1)};function j(t,e,i){let r={},n=0;function l(){let a=n+=1;return r[a]=[],a.toString()}function u(a){a===null||Object.keys(r).indexOf(a)===-1||(delete r[a],c())}function d(a,E=[]){a!==null&&Object.keys(r).indexOf(a)>-1&&(r[a]=E),c()}function f(){let a=e(""),E={...a?{title:`<title inertia="">${a}</title>`}:{}},P=Object.values(r).reduce((p,h)=>p.concat(h),[]).reduce((p,h)=>{if(h.indexOf("<")===-1)return p;if(h.indexOf("<title ")===0){let x=h.match(/(<title [^>]+>)(.*?)(<\/title>)/);return p.title=x?`${x[1]}${e(x[2])}${x[3]}`:h,p}let R=h.match(/ inertia="[^"]+"/);return R?p[R[0]]=h:p[Object.keys(p).length]=h,p},E);return Object.values(P)}function c(){t?i(f()):me.update(f())}return c(),{forceUpdate:c,createProvider:function(){let a=l();return{update:E=>d(a,E),disconnect:()=>u(a)}}}}var m=O(require("nprogress"),1),oe=null;function ge(t){document.addEventListener("inertia:start",ve.bind(null,t)),document.addEventListener("inertia:progress",be),document.addEventListener("inertia:finish",Ee)}function ve(t){oe=setTimeout(()=>m.default.start(),t)}function be(t){m.default.isStarted()&&t.detail.progress?.percentage&&m.default.set(Math.max(m.default.status,t.detail.progress.percentage/100*.9))}function Ee(t){if(clearTimeout(oe),m.default.isStarted())t.detail.visit.completed?m.default.done():t.detail.visit.interrupted?m.default.set(0):t.detail.visit.cancelled&&(m.default.done(),m.default.remove());else return}function we(t){let e=document.createElement("style");e.type="text/css",e.textContent=`
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
  `,document.head.appendChild(e)}function H({delay:t=250,color:e="#29d",includeCSS:i=!0,showSpinner:r=!1}={}){ge(t),m.default.configure({showSpinner:r}),i&&we(e)}function $(t){let e=t.currentTarget.tagName.toLowerCase()==="a";return!(t.target&&(t?.target).isContentEditable||t.defaultPrevented||e&&t.which>1||e&&t.altKey||e&&t.ctrlKey||e&&t.metaKey||e&&t.shiftKey)}var xe=new k;
//# sourceMappingURL=index.js.map
