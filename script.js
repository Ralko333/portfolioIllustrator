(async()=>{
    await window.PORTFOLIO_TEXT.load();
    const root=document.getElementById('sergey-portfolio-concept');
    const {assets,projects,previews,dimensions}=window.PORTFOLIO_DATA;
    const home=root.querySelector('.sp-home'),detail=root.querySelector('.sp-case'),gallery=root.querySelector('.sp-case-gallery'),publications=root.querySelector('.sp-case-publications');
    let previous=null,pending=null,transitionRun=0,flyerAnimation=null,flyingCorner=null,openingCard=null,transitionOverflow=null,transitionGutter=null,returnSnapshot=null,openingOrigin=null;
    let homeTitle=document.title;
    const text=()=>window.PORTFOLIO_TEXT.current;
    const ui=key=>text()?.ui[key]||({zoom:'Увеличить',fit:'Показать целиком',release:'Ссылка на релиз',publications:'Публикации J’PAN',personal:'Проект',client:'Клиент'})[key];
    const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
    const transition=root.querySelector('.sp-project-transition');
    const transitionTiming=Object.freeze({flight:400,orbit:600,fade:160});
    transition.style.setProperty('--sp-fade-duration',transitionTiming.fade+'ms');
    const sectionNav=root.querySelector('.sp-case-nav'),viewer=root.querySelector('.sp-lightbox'),viewerImage=viewer.querySelector('img'),viewerStage=viewer.querySelector('.sp-lightbox-stage'),zoomButton=viewer.querySelector('[data-image-zoom]');
    let imageList=[],imageIndex=0,savedOverflow='';
    function setZoom(zoomed){viewer.classList.toggle('sp-lightbox-zoomed',zoomed);if(zoomed)viewerImage.style.setProperty('--image-width',Math.max(viewerImage.naturalWidth,viewerStage.clientWidth*2)+'px');zoomButton.textContent=zoomed?ui('fit'):ui('zoom');zoomButton.setAttribute('aria-pressed',String(zoomed));viewerStage.scrollTo(0,0)}
    function displayImage(){
      const [asset,alt]=imageList[imageIndex];setZoom(false);viewerImage.src=assets[asset];viewerImage.alt=alt;
      viewerImage.style.setProperty('--image-width',dimensions[asset][0]+'px');
      viewer.querySelector('[data-image-original]').href=assets[asset];
      viewer.querySelector('#sp-lightbox-caption').textContent=alt+(imageList.length>1?' · '+(imageIndex+1)+' / '+imageList.length:'');
      viewer.querySelector('[data-image-previous]').disabled=imageList.length<2;viewer.querySelector('[data-image-next]').disabled=imageList.length<2;
    }
    function openImage(list,index){imageList=list;imageIndex=index;displayImage();savedOverflow=document.body.style.overflow;document.body.style.overflow='hidden';viewer.showModal()}
    function closeImage(){if(viewer.open)viewer.close()}
    function stepImage(step){imageIndex=(imageIndex+step+imageList.length)%imageList.length;displayImage()}
    viewer.querySelector('[data-image-close]').addEventListener('click',closeImage);
    viewer.querySelector('[data-image-previous]').addEventListener('click',()=>stepImage(-1));
    viewer.querySelector('[data-image-next]').addEventListener('click',()=>stepImage(1));
    zoomButton.addEventListener('click',()=>setZoom(!viewer.classList.contains('sp-lightbox-zoomed')));
    viewerImage.addEventListener('click',()=>setZoom(!viewer.classList.contains('sp-lightbox-zoomed')));
    viewer.addEventListener('close',()=>{document.body.style.overflow=savedOverflow;viewerImage.removeAttribute('src');setZoom(false)});
    viewer.addEventListener('click',event=>{if(event.target===viewer){const rect=viewer.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeImage()}});
    viewer.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();stepImage(event.key==='ArrowRight'?1:-1)}});
    function announce(text){root.querySelector('[data-announcement]').textContent=text}
    function scrollToGroup(heading,behavior){heading.style.scrollMarginTop=(sectionNav.hidden?12:sectionNav.getBoundingClientRect().height+12)+'px';heading.scrollIntoView({block:'start',behavior})}
    function showHome(){closeImage();detail.hidden=true;home.hidden=false;document.title=homeTitle;announce('Главная страница портфолио')}
    function cancelPending(){
      transitionRun++;
      clearTimeout(pending);pending=null;
      if(flyerAnimation){flyerAnimation.cancel();flyerAnimation=null}
      if(flyingCorner){flyingCorner.remove();flyingCorner=null}
      if(openingCard){openingCard.classList.remove('sp-project-is-opening');openingCard=null}
      if(transitionOverflow!==null){document.body.style.overflow=transitionOverflow;transitionOverflow=null}
      if(transitionGutter!==null){document.documentElement.style.scrollbarGutter=transitionGutter;transitionGutter=null}
      transition.classList.remove('sp-transition-arrived','sp-transition-reverse','sp-transition-returning');transition.hidden=true;
      if(returnSnapshot){
        const snapshot=returnSnapshot;returnSnapshot=null;
        home.hidden=snapshot.homeHidden;detail.hidden=snapshot.detailHidden;
        window.scrollTo({left:snapshot.x,top:snapshot.y,behavior:'instant'});
        return true;
      }
      return false;
    }
    function jump(id){cancelPending();if(location.hash==='#'+id)route();else location.hash=id}
    function navigateWithLogo(hash,label,trigger,reverse=false){
      cancelPending();
      const run=transitionRun;
      const returnOrigin=reverse&&openingOrigin?.card===trigger?openingOrigin:null;
      if(!reverse&&trigger)openingOrigin={card:trigger,x:window.scrollX,y:window.scrollY,width:window.innerWidth,height:window.innerHeight};
      function positionReturnCard(){
        if(returnOrigin&&returnOrigin.width===window.innerWidth&&returnOrigin.height===window.innerHeight)
          window.scrollTo({left:returnOrigin.x,top:returnOrigin.y,behavior:'instant'});
        else trigger?.scrollIntoView({block:'center',behavior:'instant'});
      }
      function complete(){
        if(run!==transitionRun)return;
        pending=null;returnSnapshot=null;
        if(location.hash!==hash)history.pushState(null,'',hash);
        route();
        if(reverse&&trigger){positionReturnCard();trigger.focus({preventScroll:true})}
      }
      if(reduceMotion.matches){complete();return}
      transition.setAttribute('aria-label',label);
      transition.style.setProperty('--sp-orbit-duration',transitionTiming.orbit+'ms');
      transition.classList.toggle('sp-transition-reverse',reverse);
      transition.hidden=false;
      transition.focus({preventScroll:true});
      if(reverse&&trigger){
        // Prepare the destination behind the opaque overlay before measuring it.
        returnSnapshot={homeHidden:home.hidden,detailHidden:detail.hidden,x:window.scrollX,y:window.scrollY};
        detail.hidden=true;home.hidden=false;
        positionReturnCard();
      }
      // Keep the card in the same position while the page's scroll is locked.
      transitionGutter=document.documentElement.style.scrollbarGutter;
      document.documentElement.style.scrollbarGutter='stable';
      transitionOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
      const corner=trigger?.querySelector('.sp-project-corner'),source=corner?.getBoundingClientRect();
      // Every project and both directions use the same wall-clock timeline.
      const duration=transitionTiming.flight+transitionTiming.orbit;
      function playTimeline(render){
        let frame=0;const started=performance.now();
        flyerAnimation={cancel:()=>cancelAnimationFrame(frame)};
        function step(now){
          if(run!==transitionRun)return;
          const elapsed=Math.min(duration,Math.max(0,now-started));
          render(elapsed);
          if(reverse&&elapsed>=duration-transitionTiming.fade)transition.classList.add('sp-transition-returning');
          if(elapsed<duration)frame=requestAnimationFrame(step);
          else{flyerAnimation=null;complete()}
        }
        render(0);frame=requestAnimationFrame(step);
      }
      if(!corner||!source.width){
        transition.style.setProperty('--sp-orbit-duration',duration+'ms');
        transition.classList.add('sp-transition-arrived');
        playTimeline(()=>{});return;
      }
      openingCard=trigger;openingCard.classList.add('sp-project-is-opening');
      const logo=transition.querySelector('.sp-transition-logo').getBoundingClientRect(),scale=logo.width/480;
      const sourceScale=source.width/108,sourcePath=corner.querySelector('path');
      const orbit=transition.querySelector('.sp-transition-orbit');
      const rest=sourcePath.getTotalLength()/orbit.getTotalLength()*100;
      transition.style.setProperty('--sp-orbit-rest',rest+' '+(100-rest));
      const shape=[[443,838],[443,874],[443,895],[457,909],[479,909],[511,909]];
      const start=shape.map(([x,y])=>({x:source.left+(x-423)*sourceScale,y:source.top+(y-818)*source.height/111}));
      const end=shape.map(([x,y])=>({x:logo.left+(x-403)*scale,y:logo.top+(y-244)*scale}));
      const xy=p=>p.x.toFixed(4)+','+p.y.toFixed(4);
      const cornerCommands=points=>' L'+xy(points[1])+' C'+xy(points[2])+' '+xy(points[3])+' '+xy(points[4])+' L'+xy(points[5]);
      const sourceD='M'+xy(start[0])+cornerCommands(start);
      const distance=Math.hypot(end[0].x-start[5].x,end[0].y-start[5].y);
      const handle=Math.max(28,Math.min(180,distance*.38));
      // Continue the source's rightward tangent, then enter the orbit downward.
      // Both tips follow this one continuous route, including the orbit itself.
      const connector=' C'+xy({x:start[5].x+handle,y:start[5].y})+' '+xy({x:end[0].x,y:end[0].y-handle})+' '+xy(end[0]);
      let axis=0;
      const orbitCommands=orbit.getAttribute('d').replace(/Z\s*$/i,'').replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi,value=>{
        const coordinate=axis++%2===0?logo.left+(Number(value)-403)*scale:logo.top+(Number(value)-244)*scale;
        return coordinate.toFixed(4);
      }).replace(/^\s*M[^a-z]+/i,'');
      const svgNS='http://www.w3.org/2000/svg';
      flyingCorner=document.createElementNS(svgNS,'svg');flyingCorner.setAttribute('class','sp-transition-flyer');
      flyingCorner.setAttribute('preserveAspectRatio','none');flyingCorner.setAttribute('aria-hidden','true');
      const ribbon=document.createElementNS(svgNS,'path');flyingCorner.append(ribbon);transition.append(flyingCorner);
      const viewport=flyingCorner.getBoundingClientRect();
      flyingCorner.setAttribute('viewBox','0 0 '+viewport.width+' '+viewport.height);
      ribbon.setAttribute('d',sourceD);
      const sourceLength=ribbon.getTotalLength();
      const approachD=sourceD+connector;
      ribbon.setAttribute('d',approachD);
      const arrival=ribbon.getTotalLength();
      const lapD=approachD+orbitCommands;
      ribbon.setAttribute('d',lapD);
      const orbitLength=ribbon.getTotalLength()-arrival;
      // Include the first corner of the next lap so a dash never wraps to the card.
      ribbon.setAttribute('d',lapD+cornerCommands(end));
      const totalLength=ribbon.getTotalLength(),cornerLength=totalLength-arrival-orbitLength;
      const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>x*x*x*(x*(x*6-15)+10);
      const {flight:flightDuration,orbit:orbitDuration}=transitionTiming;
      function drawLine(tail,head,width){
        ribbon.style.strokeDasharray=Math.max(.001,head-tail).toFixed(4)+' '+(totalLength+1).toFixed(4);
        ribbon.style.strokeDashoffset=(-tail).toFixed(4);
        ribbon.style.strokeWidth=width.toFixed(4)+'px';
      }
      function renderFlight(t){
        const head=ease(t),tail=ease(clamp((t-.17)/.83));
        drawLine(arrival*tail,sourceLength+(arrival+cornerLength-sourceLength)*head,34*(sourceScale*(1-head)+scale*head));
      }
      // Keep the established orbit's timing and changing dash length on this path.
      const orbitFrames=[[0,0,rest],[.14,9,14],[.26,24,19],[.75,77,19],[.89,91,12],[1,100,rest]];
      function renderOrbit(t){
        let i=1;while(i<orbitFrames.length-1&&t>orbitFrames[i][0])i++;
        const a=orbitFrames[i-1],b=orbitFrames[i],p=(t-a[0])/(b[0]-a[0]);
        const offset=a[1]+(b[1]-a[1])*p,length=a[2]+(b[2]-a[2])*p;
        const tail=arrival+orbitLength*offset/100;
        drawLine(tail,tail+orbitLength*length/100,34*scale);
      }
      function renderElapsed(elapsed){
        // Reuse the complete opening timeline backwards, including its orbit.
        const position=reverse?duration-elapsed:elapsed;
        if(position<flightDuration)renderFlight(clamp(position/flightDuration));
        else renderOrbit(clamp((position-flightDuration)/orbitDuration));
      }
      playTimeline(renderElapsed);
    }
    function openProject(key,trigger){
      const p=projects[key];if(!p)return;closeImage();previous=trigger||root.querySelector('[data-project="'+key+'"]');document.title=p.title+' — '+(text()?.home.brandName||'Сергей Белик')+(p.brand?' / '+p.brand:p.personal||p.mixed?'':' / J’PAN');
      ['label','title','description'].forEach(field=>root.querySelector('[data-case-'+field+']').textContent=p[field]);
      const related=root.querySelector('.sp-case-related');related.replaceChildren();
      for(const [project,label] of p.related||[]){
        const link=document.createElement('a');link.href='#project-'+project;link.textContent=label;
        link.addEventListener('click',event=>{event.preventDefault();navigateWithLogo('#project-'+project,'Открываем проект',null)});related.append(link);
      }
      related.hidden=!related.childElementCount;
      gallery.replaceChildren();gallery.classList.toggle('sp-case-wide',!!p.wide);gallery.classList.toggle('sp-case-illustration',!!p.personal);
      function publicationLink(label,url){const a=document.createElement('a');a.textContent=ui('release')+' ↗';a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.className='sp-release-link cursor-interaction';a.title=label;a.setAttribute('aria-label',ui('release')+': '+label);return a}
      publications.replaceChildren();
      sectionNav.replaceChildren();sectionNav.hidden=Object.keys(p.groups||{}).length<3;
      const usedLinks=new Set();
      p.media.forEach(([asset,alt,linkIndex,published,wide],index)=>{
        if(p.groups?.[index]){
          const anchor=p.groupAnchors?.[index]??String(index),heading=document.createElement('h3'),link=document.createElement('button');heading.className='sp-gallery-heading';heading.id='case-'+key+'-'+anchor;heading.textContent=p.groups[index];gallery.append(heading);
          if(p.groupDescriptions?.[index]){const description=document.createElement('p');description.className='sp-gallery-description';description.textContent=p.groupDescriptions[index];gallery.append(description)}
          link.type='button';link.textContent=p.groups[index];link.addEventListener('click',()=>{history.pushState(null,'','#project-'+key+'/'+(key==='menus'&&anchor==='10'?'halloween':anchor));scrollToGroup(heading,reduceMotion.matches?'instant':'smooth')});sectionNav.append(link);
        }
        if(p.subheadings?.[index]){const heading=document.createElement('h4');heading.className='sp-gallery-subheading';heading.textContent=p.subheadings[index];gallery.append(heading)}
        const figure=document.createElement('figure'),visual=document.createElement('button'),img=document.createElement('img'),caption=document.createElement('figcaption'),label=document.createElement('span');
        figure.classList.toggle('sp-media-published',!!published);figure.classList.toggle('sp-media-featured',asset==='imaginationFlood');if(wide)figure.style.gridColumn='1 / -1';
        visual.type='button';visual.className='sp-media-art';visual.setAttribute('aria-label','Увеличить: '+alt);visual.addEventListener('click',()=>openImage(p.media,index));
        img.src=previews[asset];img.alt=alt;img.dataset.asset=asset;img.loading='lazy';img.decoding='async';[img.width,img.height]=dimensions[asset];label.textContent=alt;visual.append(img);caption.append(label);
        if(Number.isInteger(linkIndex)){const [linkLabel,url]=p.proof.links[linkIndex];if(!usedLinks.has(url)){caption.append(publicationLink(linkLabel,url));usedLinks.add(url)}}
        figure.append(visual,caption);gallery.append(figure);
      });
      p.proof.links.forEach(([label,url])=>{if(!usedLinks.has(url)){const card=document.createElement('div'),context=document.createElement('span');card.className='sp-release-card';context.className='sp-release-context';context.textContent=label;card.append(context,publicationLink(label,url));publications.append(card);usedLinks.add(url)}});
      publications.hidden=!publications.childElementCount;
      if(!publications.hidden){const heading=document.createElement('h3');heading.className='sp-release-heading';heading.textContent=ui('publications');publications.prepend(heading)}
      let row=[];
      function centerRow(){if(row.length%2)row.at(-1).classList.add('sp-media-single');row=[]}
      for(const child of gallery.children){
        if(child.tagName!=='FIGURE'||child.style.gridColumn){centerRow();continue}
        row.push(child);
      }
      centerRow();
      home.hidden=true;detail.hidden=false;
      root.scrollIntoView({block:'start',behavior:'auto'});root.querySelector('[data-return]').focus({preventScroll:true});
      announce('Проект: '+p.title);
    }
    function route(){
      cancelPending();
      let [key,section]=location.hash.startsWith('#project-')?location.hash.slice(9).split('/'):[];
      if(['menu-layout','vlavashe','spaffy'].includes(key)){section=key;key='design';history.replaceState(null,'','#project-design/'+section)}
      if(location.hash==='#sp-design'){key='design';history.replaceState(null,'','#project-design')}
      if(key==='imagination-flood'){key='selected';section='0';history.replaceState(null,'','#project-selected/0')}
      if(key&&Object.hasOwn(projects,key)){openProject(key);if(section){const index=key==='menus'&&section==='halloween'?'10':section,heading=root.querySelector('#case-'+key+'-'+CSS.escape(index));if(heading)scrollToGroup(heading,'instant')}return}
      const wasDetail=!detail.hidden;showHome();
      const target=['#sp-work','#sp-about'].includes(location.hash)?root.querySelector(location.hash):root;
      target.scrollIntoView({block:'start',behavior:'auto'});
      if(wasDetail&&previous){previous.focus({preventScroll:true});previous.scrollIntoView({block:'center',behavior:'auto'})}
    }
    root.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{
      previous=button;
      navigateWithLogo('#project-'+button.dataset.project,'Открываем проект',button);
    }));
    root.querySelectorAll('[data-jump]').forEach(button=>button.addEventListener('click',()=>jump(button.dataset.jump)));
    root.querySelector('[data-home]').addEventListener('click',()=>{cancelPending();history.pushState(null,'',location.pathname+location.search);route();root.scrollIntoView({block:'start',behavior:'auto'})});
    root.querySelector('[data-return]').addEventListener('click',()=>navigateWithLogo('#sp-work','Возвращаемся к работам',previous,true));
    root.addEventListener('keydown',event=>{
      if(event.key!=='Escape')return;
      if(!transition.hidden){event.preventDefault();const returning=cancelPending();(returning?root.querySelector('[data-return]'):previous)?.focus({preventScroll:true});return}
      if(!viewer.open&&!detail.hidden)root.querySelector('[data-return]').click();
    });
    window.addEventListener('hashchange',route);
    window.addEventListener('popstate',route);
    setZoom(false);
    route();
  })();
