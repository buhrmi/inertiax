import{default as Y}from"axios";function T(i,e){let t;return function(...r){clearTimeout(t),t=setTimeout(()=>i.apply(this,r),e)}}function b(i,e){return document.dispatchEvent(new CustomEvent(`inertia:${i}`,e))}var $=i=>b("before",{cancelable:!0,detail:{visit:i}}),q=i=>b("error",{detail:{errors:i}}),W=i=>b("exception",{cancelable:!0,detail:{exception:i}}),I=i=>b("finish",{detail:{visit:i}}),_=i=>b("invalid",{cancelable:!0,detail:{response:i}}),y=i=>b("navigate",{detail:{page:i}}),K=i=>b("progress",{detail:{progress:i}}),X=i=>b("start",{detail:{visit:i}}),J=i=>b("success",{detail:{page:i}});function O(i){return i instanceof File||i instanceof Blob||i instanceof FileList&&i.length>0||i instanceof FormData&&Array.from(i.values()).some(e=>O(e))||typeof i=="object"&&i!==null&&Object.values(i).some(e=>O(e))}function A(i,e=new FormData,t=null){i=i||{};for(let r in i)Object.prototype.hasOwnProperty.call(i,r)&&B(e,z(t,r),i[r]);return e}function z(i,e){return i?i+"["+e+"]":e}function B(i,e,t){if(Array.isArray(t))return Array.from(t.keys()).forEach(r=>B(i,z(e,r.toString()),t[r]));if(t instanceof Date)return i.append(e,t.toISOString());if(t instanceof File)return i.append(e,t,t.name);if(t instanceof Blob)return i.append(e,t);if(typeof t=="boolean")return i.append(e,t?"1":"0");if(typeof t=="string")return i.append(e,t);if(typeof t=="number")return i.append(e,`${t}`);if(t==null)return i.append(e,"");A(t,i,e)}var Q={modal:null,listener:null,show(i){typeof i=="object"&&(i=`All Inertia requests must receive a valid Inertia response, however a plain JSON response was received.<hr>${JSON.stringify(i)}`);let e=document.createElement("html");e.innerHTML=i,e.querySelectorAll("a").forEach(r=>r.setAttribute("target","_top")),this.modal=document.createElement("div"),this.modal.style.position="fixed",this.modal.style.width="100vw",this.modal.style.height="100vh",this.modal.style.padding="50px",this.modal.style.boxSizing="border-box",this.modal.style.backgroundColor="rgba(0, 0, 0, .6)",this.modal.style.zIndex=2e5,this.modal.addEventListener("click",()=>this.hide());let t=document.createElement("iframe");if(t.style.backgroundColor="white",t.style.borderRadius="5px",t.style.width="100%",t.style.height="100%",this.modal.appendChild(t),document.body.prepend(this.modal),document.body.style.overflow="hidden",!t.contentWindow)throw new Error("iframe not yet ready.");t.contentWindow.document.open(),t.contentWindow.document.write(e.outerHTML),t.contentWindow.document.close(),this.listener=this.hideOnEscape.bind(this),document.addEventListener("keydown",this.listener)},hide(){this.modal.outerHTML="",this.modal=null,document.body.style.overflow="visible",document.removeEventListener("keydown",this.listener)},hideOnEscape(i){i.keyCode===27&&this.hide()}};import se from"deepmerge";import*as C from"qs";function E(i){return new URL(i.toString(),window.location.toString())}function D(i,e,t,r="brackets"){let o=/^https?:\/\//.test(e.toString()),l=o||e.toString().startsWith("/"),m=!l&&!e.toString().startsWith("#")&&!e.toString().startsWith("?"),d=e.toString().includes("?")||i==="get"&&Object.keys(t).length,p=e.toString().includes("#"),c=new URL(e.toString(),"http://localhost");return i==="get"&&Object.keys(t).length&&(c.search=C.stringify(se(C.parse(c.search,{ignoreQueryPrefix:!0}),t),{encodeValuesOnly:!0,arrayFormat:r}),t={}),[[o?`${c.protocol}//${c.host}`:"",l?c.pathname:"",m?c.pathname.substring(1):"",d?c.search:"",p?c.hash:""].join(""),t]}function S(i){return i=new URL(i.href),i.hash="",i}var Z=typeof window>"u",F=class{constructor(){this.visitId=null}init({initialPage:e,resolveComponent:t,swapComponent:r}){this.page=e,this.resolveComponent=t,this.swapComponent=r,this.setNavigationType(),this.clearRememberedStateOnReload(),this.isBackForwardVisit()?this.handleBackForwardVisit(this.page):this.isLocationVisit()?this.handleLocationVisit(this.page):this.handleInitialPageVisit(this.page),this.setupEventListeners()}setNavigationType(){this.navigationType=window.performance&&window.performance.getEntriesByType("navigation").length>0?window.performance.getEntriesByType("navigation")[0].type:"navigate"}clearRememberedStateOnReload(){this.navigationType==="reload"&&window.history.state?.rememberedState&&delete window.history.state.rememberedState}handleInitialPageVisit(e){this.page.url+=window.location.hash,this.setPage(e,{preserveScroll:!0,preserveState:!0}).then(()=>y(e))}setupEventListeners(){window.addEventListener("popstate",this.handlePopstateEvent.bind(this)),document.addEventListener("scroll",T(this.handleScrollEvent.bind(this),100),!0),document.addEventListener("click",e=>{let t=e.target;if(t.closest("[data-inertia-ignore]"))return;let r=t.closest("a"),o=t.closest("[data-inertia-frame-id]")?.dataset.inertiaFrameId,l=t.closest("[data-hint]")?.dataset.hint,m=t.closest("[data-component]")?.dataset.component;if(!(!r||r.rel=="external"||r.target=="_blank")&&r.href&&r.href.startsWith(location.origin)){let d=r.attributes.getNamedItem("href")?.value,p=r.dataset["preserve-scroll"],c=r.dataset["preserve-state"];if(e.preventDefault(),e.stopPropagation(),d?.startsWith("#")){let s=this.page;s.url=r.href,this.setPage(s,{preserveScroll:p,preserveState:c}).then(()=>{y(s)})}else this.visit(r.href,{method:r.dataset.method,target:r.dataset.target||o,hint:l,component:m,preserveScroll:p,preserveState:c})}})}scrollRegions(){return document.querySelectorAll("[scroll-region]")}handleScrollEvent(e){typeof e.target.hasAttribute=="function"&&e.target.hasAttribute("scroll-region")&&this.saveScrollPositions()}saveScrollPositions(){this.replaceState({...history.state,scrollRegions:Array.from(this.scrollRegions()).map(e=>({top:e.scrollTop,left:e.scrollLeft}))})}resetScrollPositions(){window.scrollTo(0,0),this.scrollRegions().forEach(e=>{typeof e.scrollTo=="function"?e.scrollTo(0,0):(e.scrollTop=0,e.scrollLeft=0)}),this.saveScrollPositions(),window.location.hash&&setTimeout(()=>document.getElementById(window.location.hash.slice(1))?.scrollIntoView())}restoreScrollPositions(){this.page.scrollRegions&&this.scrollRegions().forEach((e,t)=>{let r=this.page.scrollRegions[t];if(r)typeof e.scrollTo=="function"?e.scrollTo(r.left,r.top):(e.scrollTop=r.top,e.scrollLeft=r.left);else return})}isBackForwardVisit(){return window.history.state&&this.navigationType==="back_forward"}handleBackForwardVisit(e){let t;e.props?t=e:(window.history.state.version=e.version,t=window.history.state),this.setPage(t,{preserveScroll:!0,preserveState:!0}).then(()=>{this.restoreScrollPositions(),y(e)})}locationVisit(e,t){try{let r={preserveScroll:t};window.sessionStorage.setItem("inertiaLocationVisit",JSON.stringify(r)),window.location.href=e.href,S(window.location).href===S(e).href&&window.location.reload()}catch{return!1}}isLocationVisit(){try{return window.sessionStorage.getItem("inertiaLocationVisit")!==null}catch{return!1}}handleLocationVisit(e){let t=JSON.parse(window.sessionStorage.getItem("inertiaLocationVisit")||"");window.sessionStorage.removeItem("inertiaLocationVisit"),e.url+=window.location.hash,e.rememberedState=window.history.state?.rememberedState??{},e.scrollRegions=window.history.state?.scrollRegions??[],this.setPage(e,{preserveScroll:t.preserveScroll,preserveState:!0}).then(()=>{t.preserveScroll&&this.restoreScrollPositions(),y(e)})}isLocationVisitResponse(e){return!!(e&&e.status===409&&e.headers["x-inertia-location"])}isInertiaResponse(e){return!!e?.headers["x-inertia"]}createVisitId(){return this.visitId={},this.visitId}cancelVisit(e,{cancelled:t=!1,interrupted:r=!1}){e&&!e.completed&&!e.cancelled&&!e.interrupted&&(e.cancelToken.abort(),e.onCancel(),e.completed=!1,e.cancelled=t,e.interrupted=r,I(e),e.onFinish(e))}finishVisit(e){!e.cancelled&&!e.interrupted&&(e.completed=!0,e.cancelled=!1,e.interrupted=!1,I(e),e.onFinish(e))}resolvePreserveOption(e,t){return typeof e=="function"?e(t):e==="errors"?Object.keys(t.props.errors||{}).length>0:e}cancel(){this.activeVisit&&this.cancelVisit(this.activeVisit,{cancelled:!0})}visit(e,{method:t="get",data:r={},replace:o=!1,preserveScroll:l=!1,preserveState:m=!1,preserveURL:d=!1,only:p=[],headers:c={},errorBag:s="",forceFormData:w=!1,target:h=null,component:u=null,hint:f=u,onCancelToken:R=()=>{},onBefore:x=()=>{},onStart:M=()=>{},onProgress:U=()=>{},onFinish:ne=()=>{},onCancel:oe=()=>{},onSuccess:G=()=>{},onError:H=()=>{},transformProps:N=()=>{},queryStringArrayFormat:k="brackets"}={}){let P=typeof e=="string"?E(e):e;if((O(r)||w)&&!(r instanceof FormData)&&(r=A(r)),!(r instanceof FormData)){let[n,a]=D(t,P,r,k);P=E(n),r=a}let L={url:P,method:t,data:r,replace:o,preserveScroll:l,preserveState:m,preserveURL:d,only:p,headers:c,errorBag:s,target:h,hint:f,component:u,forceFormData:w,transformProps:N,queryStringArrayFormat:k,noProgress:!1,cancelled:!1,completed:!1,interrupted:!1};if(x(L)===!1||!$(L))return;this.activeVisit&&this.cancelVisit(this.activeVisit,{interrupted:!0}),this.saveScrollPositions(),L.target&&(L.noProgress=!0);let j=this.createVisitId();if(this.activeVisit={...L,onCancelToken:R,onBefore:x,onStart:M,onProgress:U,onFinish:ne,onCancel:oe,onSuccess:G,onError:H,queryStringArrayFormat:k,cancelToken:new AbortController},R({cancel:()=>{this.activeVisit&&this.cancelVisit(this.activeVisit,{cancelled:!0})}}),f&&(console.log("hint",f),Promise.resolve(this.resolveComponent(f)).then(n=>{h&&h!=="_top"&&h!=="_parent"&&h!=="main"?this.swapComponent({component:n,page:{...this.page,target:h},preserveState:!1}):this.swapComponent({component:n,page:this.page,preserveState:!1})})),X(L),u){this.page.component=u,this.page.url=S(P).href,(!h||h==="_top"||h==="_parent"||h==="main")&&(o=o||E(this.page.url).href===window.location.href,o?this.replaceState(this.page):this.pushState(this.page)),l||this.resetScrollPositions(),o||y(this.page),I(this.activeVisit);return}M(L),Y({method:t,url:S(P).href,data:t==="get"?{}:r,params:t==="get"?r:{},signal:this.activeVisit.cancelToken.signal,headers:{...c,Accept:"text/html, application/xhtml+xml","X-Requested-With":"XMLHttpRequest","X-Inertia":!0,...p.length?{"X-Inertia-Partial-Component":this.page.component,"X-Inertia-Partial-Data":p.join(",")}:{},...s&&s.length?{"X-Inertia-Error-Bag":s}:{},...this.page.version?{"X-Inertia-Version":this.page.version}:{}},onUploadProgress:n=>{r instanceof FormData&&(n.percentage=n.progress?Math.round(n.progress*100):0,K(n),U(n))}}).then(n=>{if(!this.isInertiaResponse(n))return Promise.reject({response:n});let a=n.data;n.headers["x-inertia-frame"]&&(h=n.headers["x-inertia-frame"]),p.length&&a.component===this.page.component&&(a.props={...this.page.props,...a.props}),l=this.resolvePreserveOption(l,a),m=this.resolvePreserveOption(m,a),m&&window.history.state?.rememberedState&&a.component===this.page.component&&(a.rememberedState=window.history.state.rememberedState);let g=P,V=E(a.url);return g.hash&&!V.hash&&S(g).href===V.href&&(V.hash=g.hash,a.url=V.href),N&&N(a.props),this.setPage(a,{target:h,visitId:j,replace:o,preserveScroll:l,preserveState:m,preserveURL:d})}).then(n=>{let a=n.props.errors||{};if(Object.keys(a).length>0){let g=s?a[s]?a[s]:{}:a;return q(g),H(g)}return J(n),G(n)}).catch(n=>{if(this.isInertiaResponse(n.response))return this.setPage(n.response.data,{visitId:j});if(this.isLocationVisitResponse(n.response)){let a=E(n.response.headers["x-inertia-location"]),g=P;g.hash&&!a.hash&&S(g).href===a.href&&(a.hash=g.hash),this.locationVisit(a,l===!0)}else if(n.response)_(n.response)&&Q.show(n.response.data);else return Promise.reject(n)}).then(()=>{this.activeVisit&&this.finishVisit(this.activeVisit)}).catch(n=>{if(!Y.isCancel(n)){let a=W(n);if(this.activeVisit&&this.finishVisit(this.activeVisit),a)return Promise.reject(n)}})}setPage(e,{visitId:t=this.createVisitId(),replace:r=!1,preserveURL:o=!1,preserveScroll:l=!1,preserveState:m=!1,target:d=null}={}){return Promise.resolve(this.resolveComponent(e.component)).then(p=>(t===this.visitId&&(e.scrollRegions=e.scrollRegions||[],e.rememberedState=e.rememberedState||{},o&&(e.url=window.location.href),!d||d==="_top"||d==="_parent"||d==="main"?(r=r||E(e.url).href===window.location.href,r?this.replaceState(e):this.pushState(e)):e.target=d,this.swapComponent({component:p,page:e,preserveState:m}).then(()=>{l||this.resetScrollPositions(),r||y(e)})),e))}pushState(e){this.page=e,window.history.pushState(e,"",e.url)}replaceState(e){this.page=e,window.history.replaceState(e,"",e.url)}handlePopstateEvent(e){if(e.state!==null&&e.state.component){let t=e.state,r=this.createVisitId();Promise.resolve(this.resolveComponent(t.component)).then(o=>{r===this.visitId&&(this.page=t,this.swapComponent({component:o,page:t,preserveState:!1}).then(()=>{this.restoreScrollPositions(),y(t)}))})}else{if(!this.page.url)return;let t=E(this.page.url);t.hash=window.location.hash,this.replaceState({...history.state,url:t.href}),this.resetScrollPositions()}}get(e,t={},r={}){return this.visit(e,{...r,method:"get",data:t})}reload(e={}){return this.visit(window.location.href,{preserveScroll:!0,preserveState:!0,preserveURL:!0,...e})}replace(e,t={}){return console.warn(`Inertia.replace() has been deprecated and will be removed in a future release. Please use Inertia.${t.method??"get"}() instead.`),this.visit(e,{preserveState:!0,...t,replace:!0})}post(e,t={},r={}){return this.visit(e,{preserveState:!0,...r,method:"post",data:t})}put(e,t={},r={}){return this.visit(e,{preserveState:!0,...r,method:"put",data:t})}patch(e,t={},r={}){return this.visit(e,{preserveState:!0,...r,method:"patch",data:t})}delete(e,t={}){return this.visit(e,{preserveState:!0,...t,method:"delete"})}remember(e,t="default"){Z||this.replaceState({...history.state,rememberedState:{...this.page?.rememberedState,[t]:e}})}restore(e="default"){if(!Z)return window.history.state?.rememberedState?.[e]}on(e,t){let r=o=>{let l=t(o);o.cancelable&&!o.defaultPrevented&&l===!1&&o.preventDefault()};return document.addEventListener(`inertia:${e}`,r),()=>document.removeEventListener(`inertia:${e}`,r)}};var ae={buildDOMElement(i){let e=document.createElement("template");e.innerHTML=i;let t=e.content.firstChild;if(!i.startsWith("<script "))return t;let r=document.createElement("script");return r.innerHTML=t.innerHTML,t.getAttributeNames().forEach(o=>{r.setAttribute(o,t.getAttribute(o)||"")}),r},isInertiaManagedElement(i){return i.nodeType===Node.ELEMENT_NODE&&i.getAttribute("inertia")!==null},findMatchingElementIndex(i,e){let t=i.getAttribute("inertia");return t!==null?e.findIndex(r=>r.getAttribute("inertia")===t):-1},update:T(function(i){let e=i.map(r=>this.buildDOMElement(r));Array.from(document.head.childNodes).filter(r=>this.isInertiaManagedElement(r)).forEach(r=>{let o=this.findMatchingElementIndex(r,e);if(o===-1){r?.parentNode?.removeChild(r);return}let l=e.splice(o,1)[0];l&&!r.isEqualNode(l)&&r?.parentNode?.replaceChild(l,r)}),e.forEach(r=>document.head.appendChild(r))},1)};function ee(i,e,t){let r={},o=0;function l(){let s=o+=1;return r[s]=[],s.toString()}function m(s){s===null||Object.keys(r).indexOf(s)===-1||(delete r[s],c())}function d(s,w=[]){s!==null&&Object.keys(r).indexOf(s)>-1&&(r[s]=w),c()}function p(){let s=e(""),w={...s?{title:`<title inertia="">${s}</title>`}:{}},h=Object.values(r).reduce((u,f)=>u.concat(f),[]).reduce((u,f)=>{if(f.indexOf("<")===-1)return u;if(f.indexOf("<title ")===0){let x=f.match(/(<title [^>]+>)(.*?)(<\/title>)/);return u.title=x?`${x[1]}${e(x[2])}${x[3]}`:f,u}let R=f.match(/ inertia="[^"]+"/);return R?u[R[0]]=f:u[Object.keys(u).length]=f,u},w);return Object.values(h)}function c(){i?t(p()):ae.update(p())}return c(),{forceUpdate:c,createProvider:function(){let s=l();return{update:w=>d(s,w),disconnect:()=>m(s)}}}}import v from"nprogress";var te=null;function le(i){document.addEventListener("inertia:start",ce(i)),document.addEventListener("inertia:progress",de),document.addEventListener("inertia:finish",pe)}function ce(i){return function(e){e.detail.visit.noProgress||(te=setTimeout(()=>v.start(),i))}}function de(i){v.isStarted()&&i.detail.progress?.percentage&&v.set(Math.max(v.status,i.detail.progress.percentage/100*.9))}function pe(i){if(clearTimeout(te),v.isStarted())i.detail.visit.completed?v.done():i.detail.visit.interrupted?v.set(0):i.detail.visit.cancelled&&(v.done(),v.remove());else return}function he(i){let e=document.createElement("style");e.type="text/css",e.textContent=`
    #nprogress {
      pointer-events: none;
    }

    #nprogress .bar {
      background: ${i};

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
      box-shadow: 0 0 10px ${i}, 0 0 5px ${i};
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
      border-top-color: ${i};
      border-left-color: ${i};
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
  `,document.head.appendChild(e)}function ie({delay:i=250,color:e="#29d",includeCSS:t=!0,showSpinner:r=!1}={}){le(i),v.configure({showSpinner:r}),t&&he(e)}function re(i){let e=i.currentTarget.tagName.toLowerCase()==="a";return!(i.target&&(i?.target).isContentEditable||i.defaultPrevented||e&&i.which>1||e&&i.altKey||e&&i.ctrlKey||e&&i.metaKey||e&&i.shiftKey)}var Ae=new F;export{ee as createHeadManager,E as hrefToUrl,D as mergeDataIntoQueryString,Ae as router,ie as setupProgress,re as shouldIntercept,S as urlWithoutHash};
//# sourceMappingURL=index.esm.js.map
