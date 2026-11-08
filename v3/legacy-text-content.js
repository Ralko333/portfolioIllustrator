/* Published portfolio copy. Text never becomes HTML. */
(()=>{
  'use strict';
  const data=window.PORTFOLIO_DATA;
  let published=null,current=null;
  const clone=value=>JSON.parse(JSON.stringify(value));
  function normalize(value,template){
    if(typeof template==='string')return typeof value==='string'?value.slice(0,12000):template;
    if(typeof template==='number')return template;
    if(Array.isArray(template))return template.map((item,i)=>normalize(value?.[i],item));
    const result={};
    for(const key of Object.keys(template))result[key]=normalize(value&&Object.hasOwn(value,key)?value[key]:undefined,template[key]);
    return result;
  }
  async function fetchPublished(){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch('../site-text.json',{cache:'no-cache',signal:controller.signal});
      if(!response.ok)throw new Error('Не удалось загрузить тексты сайта.');
      const value=await response.json();
      if(value.version!==1||!value.home||!value.ui||!value.projects)throw new Error('Неподдерживаемый файл текстов.');
      published=value;return clone(value);
    }finally{clearTimeout(timer)}
  }
  function apply(value){
    if(!published)return;
    current=normalize(value,published);
    const root=document.getElementById('sergey-portfolio-concept');
    if(!root)return;
    for(const node of root.querySelectorAll('[data-text]')){
      const [section,key]=node.dataset.text.split('.');node.textContent=current[section][key];
    }
    document.title=current.home.siteTitle;
    document.querySelector('meta[name="description"]').content=current.home.metaDescription;
    root.querySelector('[data-home]').setAttribute('aria-label',current.home.brandName+' — на главную');
    for(const [key,p]of Object.entries(data.projects)){
      const text=current.projects[key];if(!text)continue;
      for(const field of ['title','label','description','client','role','format'])p[field]=text[field];
      p.groups=clone(text.groups);p.subheadings=clone(text.subheadings);p.groupDescriptions=clone(text.groupDescriptions||{});
      p.related?.forEach((link,i)=>link[1]=text.relatedLabels?.[i]??link[1]);
      p.media.forEach((media,i)=>media[1]=text.captions[i]);
      p.proof.links.forEach((link,i)=>link[0]=text.releaseContexts[i]);
      const card=root.querySelector('[data-project="'+key+'"]');
      if(card){
        card.querySelector('.sp-project-title').textContent=text.title;
        card.querySelector('.sp-project-label').textContent=text.cardLabel;
        card.querySelector('.sp-arrow').textContent=current.ui.openProject+' ↗';
        card.setAttribute('aria-label',current.ui.openProject+': '+text.title);
      }
    }
    root.querySelector('[data-return]').setAttribute('aria-label',current.ui.back+' ко всем работам');
    root.querySelector('[data-image-original]').textContent=current.ui.original+' ↗';
    root.querySelector('[data-image-close]').textContent=current.ui.close+' ×';
  }
  async function load(){
    try{await fetchPublished();apply(published)}
    catch(error){console.warn('Portfolio text:',error.message)}
  }
  window.PORTFOLIO_TEXT={load,get current(){return current}};
})();
